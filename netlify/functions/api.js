// netlify/functions/api.js
// Serverless API for Loon Sample Request

const fs = require('fs');
const path = require('path');

// In-memory storage for serverless (for demo - use a database in production)
// Netlify functions are stateless, so we'll use Netlify Blobs or external DB for persistence
let priceLists = {};
let sampleRequests = {};

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

exports.handler = async (event, context) => {
  const { httpMethod, path: urlPath, body } = event;
  
  // Parse the path
  const pathParts = urlPath.replace('/api/', '').replace('/.netlify/functions/api/', '').split('/');
  const resource = pathParts[0];
  const resourceId = pathParts[1];
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    // Route handling
    if (resource === 'price-list') {
      if (httpMethod === 'POST') {
        // Create price list
        const data = JSON.parse(body);
        const id = generateId();
        
        const priceList = {
          id,
          name: data.name || 'Price List',
          company: data.company || 'Unknown',
          wines: (data.wines || []).map(w => ({
            id: w.id || generateId(),
            name: w['Product Name'] || w.name,
            producer: w.Producer || w.producer,
            region: w.Region || w.region,
            range: w.Range || w.range,
            color: w.Color || w.color,
            vintage: w.Vintage || w.vintage || ''
          })),
          createdAt: new Date().toISOString()
        };
        
        // Store (in production, use a database)
        priceLists[id] = priceList;
        
        // For Netlify, we need to persist this - could use:
        // 1. Netlify Blobs
        // 2. External database (MongoDB Atlas, Supabase, etc.)
        // 3. Store in query params (for simple cases)
        
        const baseUrl = process.env.URL || 'https://your-site.netlify.app';
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            id,
            sampleUrl: `${baseUrl}?list=${id}`,
            wineCount: priceList.wines.length
          })
        };
      }
      
      if (httpMethod === 'GET' && resourceId) {
        // Get price list
        const priceList = priceLists[resourceId];
        
        if (!priceList) {
          // For demo, generate sample data
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              id: resourceId,
              name: 'Sample Price List',
              company: 'Demo Company',
              wines: [
                { id: '1', name: 'Château Couhins-Lurton Blanc 2021', producer: 'André Lurton', region: 'Bordeaux', color: 'White', vintage: '2021' },
                { id: '2', name: 'Château Bonnet Blanc 2022', producer: 'André Lurton', region: 'Bordeaux', color: 'White', vintage: '2022' },
                { id: '3', name: 'Château La Louvière Rouge 2019', producer: 'André Lurton', region: 'Bordeaux', color: 'Red', vintage: '2019' },
                { id: '4', name: 'Tertre du Bosquet 2022', producer: 'Bercut Vandervoort', region: 'Languedoc', color: 'Red', vintage: '2022' },
                { id: '5', name: 'Champagne Brut Réserve NV', producer: 'Georges de la Chapelle', region: 'Champagne', color: 'Sparkling', vintage: 'NV' }
              ]
            })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(priceList)
        };
      }
    }
    
    if (resource === 'sample-request') {
      if (httpMethod === 'POST') {
        // Submit sample request
        const data = JSON.parse(body);
        const id = generateId();
        
        const request = {
          id,
          ...data,
          status: 'pending',
          submittedAt: new Date().toISOString()
        };
        
        sampleRequests[id] = request;
        
        // Log the request details for Netlify logs
        console.log('=== NEW SAMPLE REQUEST ===');
        console.log('Request ID:', id);
        console.log('Company:', data.contact?.company);
        console.log('Contact:', `${data.contact?.firstName} ${data.contact?.lastName}`);
        console.log('Email:', data.contact?.email);
        console.log('Phone:', data.contact?.phone);
        console.log('Shipping:', `${data.shipping?.city}, ${data.shipping?.state}`);
        console.log('Wines requested:', data.wines?.length);
        data.wines?.forEach(w => console.log('  -', w.name));
        console.log('Comments:', data.comments || 'None');
        console.log('Notify emails:', data.notifyEmails?.join(', '));
        console.log('==========================');
        
        // Send email notification if Resend is configured
        if (process.env.RESEND_API_KEY) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Loon Trading Co. <onboarding@resend.dev>',
                to: ['john@loontradingco.com', 'office@loontradingco.com'],
                subject: `New Sample Request from ${data.contact?.company}`,
                html: `
                  <h2>New Sample Request</h2>
                  <p><strong>Company:</strong> ${data.contact?.company}</p>
                  <p><strong>Contact:</strong> ${data.contact?.firstName} ${data.contact?.lastName}</p>
                  <p><strong>Email:</strong> <a href="mailto:${data.contact?.email}">${data.contact?.email}</a></p>
                  <p><strong>Phone:</strong> ${data.contact?.phone}</p>
                  <h3>Shipping Address</h3>
                  <p>${data.shipping?.address1}<br>
                  ${data.shipping?.address2 ? data.shipping.address2 + '<br>' : ''}
                  ${data.shipping?.city}, ${data.shipping?.state} ${data.shipping?.zip}<br>
                  ${data.shipping?.country}</p>
                  <h3>Wines Requested (${data.wines?.length})</h3>
                  <ul>${data.wines?.map(w => `<li>${w.name} - ${w.producer}</li>`).join('')}</ul>
                  ${data.comments ? `<h3>Comments</h3><p>${data.comments}</p>` : ''}
                  <p style="color: #666; font-size: 12px;">Submitted: ${new Date().toLocaleString()}</p>
                `
              })
            });
            console.log('Email sent:', emailResponse.ok ? 'Success' : 'Failed');
          } catch (emailErr) {
            console.error('Email error:', emailErr);
          }
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            requestId: id,
            message: 'Sample request submitted successfully'
          })
        };
      }
      
      if (httpMethod === 'GET') {
        // List all requests (admin)
        const requests = Object.values(sampleRequests);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(requests)
        };
      }
    }
    
    // 404 for unknown routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
