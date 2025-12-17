// netlify/functions/api.js
// Serverless API for Loon Sample Request with Notion Integration

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Email template styles (matching loontradingco.com)
const emailStyles = `
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #faf9f7; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #1a1a1a; color: #ffffff; padding: 32px; text-align: center; }
    .header h1 { font-family: Georgia, serif; font-size: 24px; font-weight: 400; margin: 0 0 8px 0; letter-spacing: 1px; }
    .header p { font-size: 14px; color: rgba(255,255,255,0.7); margin: 0; }
    .content { padding: 32px; }
    .content h2 { font-family: Georgia, serif; font-size: 20px; font-weight: 400; color: #1a1a1a; margin: 0 0 16px 0; border-bottom: 1px solid #e5e2dd; padding-bottom: 12px; }
    .content p { font-size: 15px; line-height: 1.6; color: #333; margin: 8px 0; }
    .content .label { color: #6b6b6b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 16px; margin-bottom: 4px; }
    .wine-list { background: #f8f7f5; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .wine-list ul { margin: 0; padding-left: 20px; }
    .wine-list li { margin: 8px 0; font-size: 14px; }
    .footer { background: #f8f7f5; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e2dd; }
    .footer p { font-size: 12px; color: #6b6b6b; margin: 4px 0; }
    .footer a { color: #1a1a1a; text-decoration: none; }
    .tagline { font-family: Georgia, serif; font-style: italic; font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 12px; }
    .button { display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 4px; margin-top: 16px; }
  </style>
`;

// Build internal notification email (to Loon Trading)
function buildInternalEmail(data, notionPageId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Sample Request</h1>
          <p>From ${data.contact?.company}</p>
          <div class="tagline">Relationships. Strategy. Integrity.</div>
        </div>
        <div class="content">
          <h2>Contact Information</h2>
          <p class="label">Company</p>
          <p><strong>${data.contact?.company}</strong></p>
          <p class="label">Contact</p>
          <p>${data.contact?.firstName} ${data.contact?.lastName}</p>
          <p class="label">Email</p>
          <p><a href="mailto:${data.contact?.email}">${data.contact?.email}</a></p>
          <p class="label">Phone</p>
          <p>${data.contact?.phone || 'Not provided'}</p>
          
          <h2>Shipping Address</h2>
          <p>
            ${data.shipping?.address1}<br>
            ${data.shipping?.address2 ? data.shipping.address2 + '<br>' : ''}
            ${data.shipping?.city}, ${data.shipping?.state} ${data.shipping?.zip}<br>
            ${data.shipping?.country}
          </p>
          
          <h2>Wines Requested (${data.wines?.length})</h2>
          <div class="wine-list">
            <ul>
              ${data.wines?.map(w => `<li><strong>${w.name}</strong> - ${w.producer}</li>`).join('')}
            </ul>
          </div>
          
          ${data.comments ? `
            <h2>Comments</h2>
            <p>${data.comments}</p>
          ` : ''}
          
          ${notionPageId ? `
            <p style="margin-top: 24px;">
              <a href="https://notion.so/${notionPageId.replace(/-/g, '')}" class="button">View in Notion</a>
            </p>
          ` : ''}
        </div>
        <div class="footer">
          <p>Submitted: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Build confirmation email (to requester)
function buildConfirmationEmail(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sample Request Received</h1>
          <p>Thank you for your interest</p>
          <div class="tagline">Relationships. Strategy. Integrity.</div>
        </div>
        <div class="content">
          <p>Dear ${data.contact?.firstName},</p>
          <p>Thank you for submitting your sample request. We have received your request and will process it shortly.</p>
          
          <h2>Your Request Summary</h2>
          <p class="label">Company</p>
          <p><strong>${data.contact?.company}</strong></p>
          
          <p class="label">Shipping To</p>
          <p>
            ${data.shipping?.address1}<br>
            ${data.shipping?.address2 ? data.shipping.address2 + '<br>' : ''}
            ${data.shipping?.city}, ${data.shipping?.state} ${data.shipping?.zip}<br>
            ${data.shipping?.country}
          </p>
          
          <h2>Wines Requested (${data.wines?.length})</h2>
          <div class="wine-list">
            <ul>
              ${data.wines?.map(w => `<li><strong>${w.name}</strong> - ${w.producer}</li>`).join('')}
            </ul>
          </div>
          
          <p style="margin-top: 24px;">If you have any questions, please don't hesitate to contact us at <a href="mailto:office@loontradingco.com">office@loontradingco.com</a>.</p>
          
          <p>Best regards,<br><strong>Loon Trading Co.</strong></p>
        </div>
        <div class="footer">
          <p><a href="https://www.loontradingco.com">www.loontradingco.com</a></p>
          <p style="margin-top: 8px;">© ${new Date().getFullYear()} Loon Trading Co.</p>
        </div>
      </div>
    </body>
    </html>
  `;
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

// Get states from Notion database
async function getStatesFromNotion() {
  const STATES_DB_ID = process.env.STATES_DB_ID;
  if (!STATES_DB_ID) {
    return null;
  }
  
  try {
    const response = await notionRequest(`/databases/${STATES_DB_ID}/query`, 'POST', {
      sorts: [{ property: 'Name', direction: 'ascending' }]
    });
    
    return response.results.map(page => {
      const name = page.properties.Name?.title?.[0]?.plain_text || '';
      const abbrev = page.properties.Abbreviation?.rich_text?.[0]?.plain_text || 
                     page.properties.Abbrev?.rich_text?.[0]?.plain_text || '';
      return { name, abbrev };
    }).filter(s => s.name);
  } catch (err) {
    console.error('Failed to fetch states:', err);
    return null;
  }
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
    'Name': {
      title: [{ text: { content: `${data.contact?.company} - Sample Request` } }]
    },
    'Company': {
      rich_text: [{ text: { content: data.contact?.company || '' } }]
    },
    'First': {
      rich_text: [{ text: { content: data.contact?.firstName || '' } }]
    },
    'Last': {
      rich_text: [{ text: { content: data.contact?.lastName || '' } }]
    },
    'Email': {
      email: data.contact?.email || null
    },
    'Phone': {
      phone_number: data.contact?.phone || null
    },
    'Street': {
      rich_text: [{ text: { content: data.shipping?.address1 + (data.shipping?.address2 ? ', ' + data.shipping.address2 : '') } }]
    },
    'City': {
      rich_text: [{ text: { content: data.shipping?.city || '' } }]
    },
    'State/Region': {
      rich_text: [{ text: { content: data.shipping?.state || '' } }]
    },
    'Zip Code': {
      rich_text: [{ text: { content: data.shipping?.zip || '' } }]
    },
    'Country': {
      rich_text: [{ text: { content: data.shipping?.country || '' } }]
    },
    'Wines': {
      rich_text: [{ text: { content: winesShort.substring(0, 2000) } }]
    },
    'Wines Count': {
      number: data.wines?.length || 0
    },
    'Status': {
      select: { name: 'New' }
    },
    'Submitted': {
      date: { start: new Date().toISOString().split('T')[0] }
    }
  };
  
  const response = await notionRequest('/pages', 'POST', {
    parent: { database_id: SAMPLE_REQUESTS_DB_ID },
    properties,
    children: [
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

exports.handler = async (event, context) => {
  const { httpMethod, path: urlPath, body } = event;
  
  console.log('=== API Request ===');
  console.log('Path:', urlPath);
  console.log('Method:', httpMethod);
  
  const pathParts = urlPath.replace('/api/', '').replace('/.netlify/functions/api/', '').split('/').filter(Boolean);
  const resource = pathParts[0];
  const resourceId = pathParts[1];
  
  console.log('Resource:', resource);
  console.log('ResourceId:', resourceId);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    // States endpoint
    if (resource === 'states') {
      if (httpMethod === 'GET') {
        const states = await getStatesFromNotion();
        if (states) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ states })
          };
        }
        // Fallback to hardcoded US states
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            states: [
              { name: 'Alabama', abbrev: 'AL' }, { name: 'Alaska', abbrev: 'AK' }, { name: 'Arizona', abbrev: 'AZ' },
              { name: 'Arkansas', abbrev: 'AR' }, { name: 'California', abbrev: 'CA' }, { name: 'Colorado', abbrev: 'CO' },
              { name: 'Connecticut', abbrev: 'CT' }, { name: 'Delaware', abbrev: 'DE' }, { name: 'Florida', abbrev: 'FL' },
              { name: 'Georgia', abbrev: 'GA' }, { name: 'Hawaii', abbrev: 'HI' }, { name: 'Idaho', abbrev: 'ID' },
              { name: 'Illinois', abbrev: 'IL' }, { name: 'Indiana', abbrev: 'IN' }, { name: 'Iowa', abbrev: 'IA' },
              { name: 'Kansas', abbrev: 'KS' }, { name: 'Kentucky', abbrev: 'KY' }, { name: 'Louisiana', abbrev: 'LA' },
              { name: 'Maine', abbrev: 'ME' }, { name: 'Maryland', abbrev: 'MD' }, { name: 'Massachusetts', abbrev: 'MA' },
              { name: 'Michigan', abbrev: 'MI' }, { name: 'Minnesota', abbrev: 'MN' }, { name: 'Mississippi', abbrev: 'MS' },
              { name: 'Missouri', abbrev: 'MO' }, { name: 'Montana', abbrev: 'MT' }, { name: 'Nebraska', abbrev: 'NE' },
              { name: 'Nevada', abbrev: 'NV' }, { name: 'New Hampshire', abbrev: 'NH' }, { name: 'New Jersey', abbrev: 'NJ' },
              { name: 'New Mexico', abbrev: 'NM' }, { name: 'New York', abbrev: 'NY' }, { name: 'North Carolina', abbrev: 'NC' },
              { name: 'North Dakota', abbrev: 'ND' }, { name: 'Ohio', abbrev: 'OH' }, { name: 'Oklahoma', abbrev: 'OK' },
              { name: 'Oregon', abbrev: 'OR' }, { name: 'Pennsylvania', abbrev: 'PA' }, { name: 'Rhode Island', abbrev: 'RI' },
              { name: 'South Carolina', abbrev: 'SC' }, { name: 'South Dakota', abbrev: 'SD' }, { name: 'Tennessee', abbrev: 'TN' },
              { name: 'Texas', abbrev: 'TX' }, { name: 'Utah', abbrev: 'UT' }, { name: 'Vermont', abbrev: 'VT' },
              { name: 'Virginia', abbrev: 'VA' }, { name: 'Washington', abbrev: 'WA' }, { name: 'West Virginia', abbrev: 'WV' },
              { name: 'Wisconsin', abbrev: 'WI' }, { name: 'Wyoming', abbrev: 'WY' }
            ]
          })
        };
      }
    }
    
    // Price list endpoint - fetches wines from Notion based on dynamic price list ID
    if (resource === 'price-list') {
      if (httpMethod === 'GET' && resourceId) {
        const PRODUCTS_DB_ID = process.env.PRODUCTS_DATABASE_ID || '267a824fc71f8028a369dd5eb02279d2';
        const PRICE_LIST_EXPORTS_DB_ID = process.env.PRICE_LIST_EXPORTS_DATABASE_ID || '2cca824fc71f80cabe74f214af845c9d';
        
        console.log('=== Price List Request ===');
        console.log('resourceId:', resourceId);
        
        try {
          // First, look up the price list export in Notion
          const exportSearch = await notionRequest(`/databases/${PRICE_LIST_EXPORTS_DB_ID}/query`, 'POST', {
            filter: {
              property: 'Price List ID',
              rich_text: { equals: resourceId }
            }
          });
          
          console.log('Export search results:', exportSearch.results?.length || 0);
          
          if (!exportSearch.results || exportSearch.results.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: 'Price list not found',
                message: `No price list found with ID: ${resourceId}`,
                priceListId: resourceId
              })
            };
          }
          
          const exportRecord = exportSearch.results[0];
          const exportProps = exportRecord.properties;
          
          // Get the product IDs from the export record (may be split across multiple rich_text blocks)
          const richTextArray = exportProps['Product IDs']?.rich_text || [];
          const productIdsStr = richTextArray.map(rt => rt.plain_text).join('');
          const productIds = productIdsStr.split(',').map(id => id.trim()).filter(Boolean);
          
          console.log('Found', productIds.length, 'product IDs');
          console.log('First few IDs:', productIds.slice(0, 3));
          
          if (productIds.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: 'No products in price list',
                message: 'This price list has no products',
                priceListId: resourceId
              })
            };
          }
          
          // Get display info from export
          const companyName = exportProps['Company']?.rich_text?.[0]?.plain_text || '';
          const targetMarket = exportProps['Target Market']?.select?.name || '';
          const displayName = exportProps['Name']?.title?.[0]?.plain_text || resourceId;
          
          // Fetch products by page ID - small batches to avoid rate limits
          const products = [];
          const maxProducts = 50; // Start with just 50 for testing
          
          const limitedIds = productIds.slice(0, maxProducts);
          console.log('Fetching', limitedIds.length, 'products');
          console.log('Sample ID:', limitedIds[0]);
          
          // Fetch just the first one to see properties
          try {
            const firstPage = await notionRequest(`/pages/${limitedIds[0]}`, 'GET');
            console.log('First page properties:', JSON.stringify(Object.keys(firstPage.properties || {})));
            
            // Log the title property specifically
            const props = firstPage.properties;
            for (const [key, value] of Object.entries(props)) {
              if (value.type === 'title') {
                console.log('Title property found:', key, '=', value.title?.[0]?.plain_text);
              }
            }
          } catch (err) {
            console.log('Error fetching first page:', err.message);
          }
          
          // Fetch sequentially in small groups to avoid rate limits
          for (let i = 0; i < limitedIds.length; i += 5) {
            const batchIds = limitedIds.slice(i, i + 5);
            console.log('Fetching batch', i/5 + 1);
            
            const batchResults = await Promise.all(
              batchIds.map(async (pageId) => {
                try {
                  const page = await notionRequest(`/pages/${pageId}`, 'GET');
                  
                  if (page && page.properties) {
                    const props = page.properties;
                    
                    // Find the title property dynamically
                    let productName = '';
                    for (const [key, value] of Object.entries(props)) {
                      if (value.type === 'title' && value.title?.[0]?.plain_text) {
                        productName = value.title[0].plain_text;
                        break;
                      }
                    }
                    
                    const producer = props.Producer?.rollup?.array?.[0]?.title?.[0]?.plain_text ||
                                    props['Producer Text']?.formula?.string ||
                                    props.Producer?.rich_text?.[0]?.plain_text || '';
                    const region = props.Region?.select?.name || '';
                    const appellation = props.Appellation?.select?.name || '';
                    const color = props.Color?.select?.name || '';
                    const vintage = props.Vintage?.rich_text?.[0]?.plain_text || 
                                   props.Vintage?.number?.toString() || '';
                    const range = props.Range?.rollup?.array?.[0]?.title?.[0]?.plain_text ||
                                 props['Range']?.formula?.string || '';
                    
                    if (productName) {
                      return {
                        id: page.id,
                        name: productName,
                        producer: producer,
                        region: region,
                        appellation: appellation,
                        range: range,
                        color: color,
                        vintage: vintage
                      };
                    }
                  }
                  return null;
                } catch (pageErr) {
                  console.log('ERROR fetching', pageId, ':', pageErr.message);
                  return null;
                }
              })
            );
            
            products.push(...batchResults.filter(Boolean));
          }
          
          console.log('Total fetched:', products.length, 'products');
          
          // Organize by region, then producer
          const organized = {};
          products.forEach(p => {
            const region = p.region || 'Other';
            const producer = p.producer || 'Unknown';
            
            if (!organized[region]) organized[region] = {};
            if (!organized[region][producer]) organized[region][producer] = [];
            organized[region][producer].push(p);
          });
          
          // Sort within each group
          Object.keys(organized).forEach(region => {
            Object.keys(organized[region]).forEach(producer => {
              organized[region][producer].sort((a, b) => 
                (a.name || '').localeCompare(b.name || '')
              );
            });
          });
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              priceListId: resourceId,
              displayName: displayName,
              company: companyName,
              targetMarket: targetMarket,
              productCount: products.length,
              wines: organized
            })
          };
          
        } catch (error) {
          console.error('Price list error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to fetch price list',
              message: error.message 
            })
          };
        }
      }
    }
    
    // Sample request endpoint
    if (resource === 'sample-request') {
      if (httpMethod === 'POST') {
        const data = JSON.parse(body);
        const id = generateId();
        
        console.log('=== NEW SAMPLE REQUEST ===');
        console.log('Request ID:', id);
        console.log('Company:', data.contact?.company);
        console.log('Contact:', `${data.contact?.firstName} ${data.contact?.lastName}`);
        console.log('Email:', data.contact?.email);
        console.log('Wines requested:', data.wines?.length);
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
        
        // Send emails
        if (process.env.RESEND_API_KEY) {
          // Send internal notification
          try {
            const internalEmail = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Loon Trading Co. <samples@loontradingco.com>',
                to: ['john@loontradingco.com', 'office@loontradingco.com'],
                subject: `New Sample Request from ${data.contact?.company}`,
                html: buildInternalEmail(data, notionPageId)
              })
            });
            console.log('Internal email sent:', internalEmail.ok ? 'Success' : 'Failed');
          } catch (err) {
            console.error('Internal email error:', err);
          }
          
          // Send confirmation to requester
          if (data.contact?.email) {
            try {
              const confirmationEmail = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: 'Loon Trading Co. <samples@loontradingco.com>',
                  to: [data.contact.email],
                  subject: 'Sample Request Received - Loon Trading Co.',
                  html: buildConfirmationEmail(data)
                })
              });
              console.log('Confirmation email sent:', confirmationEmail.ok ? 'Success' : 'Failed');
            } catch (err) {
              console.error('Confirmation email error:', err);
            }
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
