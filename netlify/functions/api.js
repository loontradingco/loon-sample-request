// netlify/functions/api.js
// Serverless API for Loon Sample Request with Notion Integration

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Notion API helper
async function notionRequest(endpoint, method, body) {
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY not configured');
  }
  
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Notion API error:', error);
    throw new Error(error.message || 'Notion API error');
  }
  
  return response.json();
}

// Create a sample request in Notion
async function createSampleRequestInNotion(data) {
  const SAMPLE_REQUESTS_DB_ID = process.env.SAMPLE_REQUESTS_DB_ID;
  if (!SAMPLE_REQUESTS_DB_ID) {
    throw new Error('SAMPLE_REQUESTS_DB_ID not configured');
  }
  
  // Format wines list for property (short version)
  const winesShort = data.wines?.map(w => w.name).join(', ') || '';
  // Format wines list for page content (detailed version)
  const winesDetailed = data.wines?.map(w => `• ${w.name} (${w.producer})`).join('\n') || '';
  
  // Build properties for Notion page
  const properties = {
    // Title - Company Name
    'Name': {
      title: [{ text: { content: `${data.contact?.company} - Sample Request` } }]
    },
    // Company
    'Company': {
      rich_text: [{ text: { content: data.contact?.company || '' } }]
    },
    // First Name
    'First': {
      rich_text: [{ text: { content: data.contact?.firstName || '' } }]
    },
    // Last Name
    'Last': {
      rich_text: [{ text: { content: data.contact?.lastName || '' } }]
    },
    // Email
    'Email': {
      email: data.contact?.email || null
    },
    // Phone
    'Phone': {
      phone_number: data.contact?.phone || null
    },
    // Street Address
    'Street': {
      rich_text: [{ text: { content: data.shipping?.address1 + (data.shipping?.address2 ? ', ' + data.shipping.address2 : '') } }]
    },
    // City
    'City': {
      rich_text: [{ text: { content: data.shipping?.city || '' } }]
    },
    // State/Region (text - accepts any value)
    'State/Region': {
      rich_text: [{ text: { content: data.shipping?.state || '' } }]
    },
    // Zip Code
    'Zip Code': {
      rich_text: [{ text: { content: data.shipping?.zip || '' } }]
    },
    // Country (text - accepts any value)
    'Country': {
      rich_text: [{ text: { content: data.shipping?.country || '' } }]
    },
    // Wines (list of wine names)
    'Wines': {
      rich_text: [{ text: { content: winesShort.substring(0, 2000) } }] // Notion limit is 2000 chars
    },
    // Wines Count
    'Wines Count': {
      number: data.wines?.length || 0
    },
    // Status
    'Status': {
      select: { name: 'New' }
    },
    // Submitted Date
    'Submitted': {
      date: { start: new Date().toISOString().split('T')[0] }
    }
  };
  
  // Create the page
  const response = await notionRequest('/pages', 'POST', {
    parent: { database_id: SAMPLE_REQUESTS_DB_ID },
    properties,
    children: [
      // Add wines list as page content (detailed with producers)
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Wines Requested' } }]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: winesDetailed } }]
        }
      },
      // Add comments if any
      ...(data.comments ? [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Comments' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: data.comments } }]
          }
        }
      ] : [])
    ]
  });
  
  return response;
}

function formatAddress(shipping) {
  if (!shipping) return '';
  const parts = [
    shipping.address1,
    shipping.address2,
    `${shipping.city}, ${shipping.state} ${shipping.zip}`,
    shipping.country
  ].filter(Boolean);
  return parts.join('\n');
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
      if (httpMethod === 'GET' && resourceId) {
        // For demo, return sample data
        // In production, fetch from Notion or your products database
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
              { id: '5', name: 'Champagne Brut Réserve NV', producer: 'Georges de la Chapelle', region: 'Champagne', color: 'Sparkling', vintage: 'NV' },
              { id: '6', name: 'Côtes du Rhône Villages 2021', producer: 'Cellier des Princes', region: 'Rhône', color: 'Red', vintage: '2021' }
            ]
          })
        };
      }
    }
    
    if (resource === 'sample-request') {
      if (httpMethod === 'POST') {
        const data = JSON.parse(body);
        const id = generateId();
        
        // Log the request
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
        console.log('==========================');
        
        // Store in Notion
        let notionPageId = null;
        if (process.env.NOTION_API_KEY && process.env.SAMPLE_REQUESTS_DB_ID) {
          try {
            const notionResponse = await createSampleRequestInNotion(data);
            notionPageId = notionResponse.id;
            console.log('Created Notion page:', notionPageId);
          } catch (notionErr) {
            console.error('Notion error:', notionErr.message);
          }
        } else {
          console.log('Notion not configured - request logged only');
        }
        
        // Send email notification
        if (process.env.RESEND_API_KEY) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Loon Trading Co. <samples@loontradingco.com>',
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
                  ${notionPageId ? `<p><a href="https://notion.so/${notionPageId.replace(/-/g, '')}">View in Notion</a></p>` : ''}
                  <p style="color: #666; font-size: 12px;">Submitted: ${new Date().toLocaleString()}</p>
                `
              })
            });
            console.log('Email sent:', emailResponse.ok ? 'Success' : 'Failed');
            if (!emailResponse.ok) {
              const errorData = await emailResponse.json();
              console.log('Email error details:', errorData);
            }
          } catch (emailErr) {
            console.error('Email error:', emailErr);
          }
        }
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            success: true, 
            id,
            notionPageId,
            message: 'Sample request submitted successfully' 
          })
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
      body: JSON.stringify({ error: error.message })
    };
  }
};
