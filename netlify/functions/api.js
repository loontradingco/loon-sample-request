// netlify/functions/api.js
// Serverless API for Loon Sample Request with Notion Integration
// Updated with Analytics Tracking: Location, Duration, Access Logs

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Email template styles (matching loontradingco.com)
const emailStyles = `
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #faf9f7; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #ccedd9; color: #000000; padding: 32px; text-align: center; }
    .header h1 { font-family: Georgia, serif; font-size: 24px; font-weight: 400; margin: 0 0 8px 0; letter-spacing: 1px; color: #000000; }
    .header p { font-size: 14px; color: rgba(0,0,0,0.7); margin: 0; }
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
        </div>
        <div class="content">
          <p>Hello ${data.contact?.firstName},</p>
          <p>Thank you for sending your sample request. We have received your request and will process soon.</p>
          
          <h2>Your Request Summary</h2>
          <p class="label">Company</p>
          <p><strong>${data.contact?.company}</strong></p>
          
          <p class="label">Shipping To</p>
          <p>
            ${data.shipping?.address1}<br>
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
          
          <p>Thank you,<br><strong>Loon Trading Co.</strong></p>
        </div>
        <div class="footer">
          <div class="social-links" style="margin-bottom: 16px;">
            <a href="https://www.linkedin.com/company/loontradingcompany/" style="display: inline-block; margin: 0 8px;">
              <img src="https://cdn-icons-png.flaticon.com/24/174/174857.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;">
            </a>
            <a href="https://www.instagram.com/loontradingco/" style="display: inline-block; margin: 0 8px;">
              <img src="https://cdn-icons-png.flaticon.com/24/174/174855.png" alt="Instagram" width="24" height="24" style="vertical-align: middle;">
            </a>
            <a href="https://www.youtube.com/@loontradingcompany" style="display: inline-block; margin: 0 8px;">
              <img src="https://cdn-icons-png.flaticon.com/24/174/174883.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;">
            </a>
          </div>
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

// ============================================
// ANALYTICS: IP Geolocation Helper
// ============================================
async function getLocationFromIP(ip) {
  // Skip localhost/private IPs
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
    return { formatted: 'Local/Private', city: 'Local', region: '', country: '' };
  }
  
  try {
    // Use free ip-api.com service (no API key needed, 45 requests/min limit)
    // For production with high traffic, consider ipstack.com or ipinfo.io
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,isp,org`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          city: data.city || '',
          region: data.regionName || '',
          country: data.country || '',
          isp: data.isp || '',
          org: data.org || '',
          formatted: [data.city, data.regionName, data.country].filter(Boolean).join(', ') || 'Unknown'
        };
      }
    }
  } catch (e) {
    console.error('Geolocation error:', e.message);
  }
  
  return { formatted: 'Unknown', city: '', region: '', country: '' };
}

// Get client IP from various headers
function getClientIP(event) {
  // Netlify-specific header (most reliable)
  const nfIP = event.headers['x-nf-client-connection-ip'];
  if (nfIP) return nfIP;
  
  // Standard forwarded header
  const forwarded = event.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  
  // Other common headers
  return event.headers['x-real-ip'] || 
         event.headers['client-ip'] || 
         event.headers['cf-connecting-ip'] || // Cloudflare
         'unknown';
}

// Get states from Notion database
async function getStatesFromNotion() {
  const STATES_DB_ID = process.env.STATES_DB_ID;
  if (!STATES_DB_ID) {
    return null;
  }
  
  try {
    const response = await notionRequest(`/databases/${STATES_DB_ID}/query`, 'POST', {});
    
    const states = response.results.map(page => {
      const props = page.properties || {};
      
      let titleValue = '';
      for (const [key, value] of Object.entries(props)) {
        if (value.type === 'title' && value.title?.[0]?.plain_text) {
          titleValue = value.title[0].plain_text;
          break;
        }
      }
      
      const fullName = props['Name']?.rich_text?.[0]?.plain_text ||
                       props['Full Name']?.rich_text?.[0]?.plain_text ||
                       props['State Name']?.rich_text?.[0]?.plain_text ||
                       props['State']?.rich_text?.[0]?.plain_text ||
                       props['Territory']?.rich_text?.[0]?.plain_text ||
                       props['Region']?.rich_text?.[0]?.plain_text || '';
      
      const abbrev = props['Abbreviation']?.rich_text?.[0]?.plain_text || 
                     props['Abbrev']?.rich_text?.[0]?.plain_text ||
                     props['Code']?.rich_text?.[0]?.plain_text || '';
      
      let name = fullName || titleValue;
      let abbreviation = abbrev || (fullName ? titleValue : '');
      
      if (name && name.length <= 3 && name === name.toUpperCase() && fullName) {
        abbreviation = name;
        name = fullName;
      }
      
      let country = 'United States';
      if (abbreviation.startsWith('Canada-') || name.startsWith('Canada-')) {
        country = 'Canada';
      } else if (name === 'Mexico' || abbreviation === 'MX') {
        country = 'Mexico';
      } else if (['Bermuda', 'Brazil', 'Puerto Rico', 'US Virgin Islands', 'Guam'].includes(name)) {
        country = 'Other';
      }
      
      return { name, abbrev: abbreviation, country };
    }).filter(s => {
      if (!s.name) return false;
      const nameLower = s.name.toLowerCase();
      if (nameLower === 'national' || nameLower === 'canada') return false;
      return true;
    });
    
    states.sort((a, b) => a.name.localeCompare(b.name));
    states.push({ name: 'Other', abbrev: '', country: 'Other' });
    
    return states;
  } catch (err) {
    console.error('Failed to fetch states:', err);
    return null;
  }
}

// Create sample requests in Notion - one entry per producer
async function createSampleRequestInNotion(data) {
  const SAMPLE_REQUESTS_DB_ID = process.env.SAMPLE_REQUESTS_DB_ID;
  if (!SAMPLE_REQUESTS_DB_ID) {
    throw new Error('SAMPLE_REQUESTS_DB_ID not configured');
  }
  
  const winesByProducer = {};
  for (const wine of (data.wines || [])) {
    const producer = wine.producer || 'Unknown';
    if (!winesByProducer[producer]) {
      winesByProducer[producer] = [];
    }
    winesByProducer[producer].push(wine);
  }
  
  const producers = Object.keys(winesByProducer);
  console.log(`Creating ${producers.length} sample request entries for ${producers.join(', ')}`);
  
  const createdPages = [];
  
  const now = new Date();
  const submissionDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  
  const state = data.shipping?.state || '';
  const company = data.contact?.company || '';
  
  for (const producer of producers) {
    const producerWines = winesByProducer[producer];
    
    const winesShort = producerWines.map(w => w.name).join(', ');
    const winesDetailed = producerWines.map(w => `• ${w.name}`).join('\n');
    
    const entryName = `${submissionDate} / ${state} / ${company} / ${producer}`;
    
    const properties = {
      'Name': { title: [{ text: { content: entryName } }] },
      'Company': { rich_text: [{ text: { content: data.contact?.company || '' } }] },
      'First': { rich_text: [{ text: { content: data.contact?.firstName || '' } }] },
      'Last': { rich_text: [{ text: { content: data.contact?.lastName || '' } }] },
      'Email': { email: data.contact?.email || null },
      'Phone': { phone_number: data.contact?.phone || null },
      'Street': { rich_text: [{ text: { content: data.shipping?.address1 || '' } }] },
      'City': { rich_text: [{ text: { content: data.shipping?.city || '' } }] },
      'State/Region': { rich_text: [{ text: { content: data.shipping?.state || '' } }] },
      'Zip Code': { rich_text: [{ text: { content: data.shipping?.zip || '' } }] },
      'Country': { rich_text: [{ text: { content: data.shipping?.country || '' } }] },
      'Wines': { rich_text: [{ text: { content: winesShort.substring(0, 2000) } }] },
      'Wines Count': { number: producerWines.length },
      'Status': { select: { name: 'New' } },
      'Submitted': { date: { start: new Date().toISOString().split('T')[0] } }
    };
    
    const response = await notionRequest('/pages', 'POST', {
      parent: { database_id: SAMPLE_REQUESTS_DB_ID },
      properties,
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ type: 'text', text: { content: 'Wines Requested' } }] }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: winesDetailed } }] }
        },
        ...(data.comments ? [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ type: 'text', text: { content: 'Comments' } }] }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ type: 'text', text: { content: data.comments } }] }
          }
        ] : [])
      ]
    });
    
    createdPages.push(response);
  }
  
  return createdPages;
}

// ============================================
// MAIN HANDLER
// ============================================
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
    // ============================================
    // ANALYTICS: Track page view with location
    // GET /api/track/{priceListId}
    // ============================================
    if (resource === 'track' && resourceId && httpMethod === 'GET') {
      const PRICE_LIST_EXPORTS_DB_ID = process.env.PRICE_LIST_EXPORTS_DATABASE_ID || '2cca824fc71f80cabe74f214af845c9d';
      
      const clientIP = getClientIP(event);
      console.log('=== Analytics Track ===');
      console.log('Price List ID:', resourceId);
      console.log('Client IP:', clientIP);
      
      const location = await getLocationFromIP(clientIP);
      console.log('Location:', location.formatted);
      
      const baseId = resourceId.endsWith('90') ? resourceId.slice(0, -2) : resourceId;
      const is90Plus = resourceId.endsWith('90');
      
      try {
        const queryResponse = await notionRequest(
          `/databases/${PRICE_LIST_EXPORTS_DB_ID}/query`, 
          'POST',
          { filter: { property: 'Price List ID', rich_text: { equals: baseId } } }
        );
        
        if (queryResponse.results && queryResponse.results.length > 0) {
          const page = queryResponse.results[0];
          const props = page.properties;
          
          const currentViews = props['Views']?.number || 0;
          
          let accessLog = [];
          try {
            const logText = props['Access Log']?.rich_text?.[0]?.plain_text;
            if (logText) accessLog = JSON.parse(logText);
          } catch (e) {
            accessLog = [];
          }
          
          const newEntry = {
            ts: new Date().toISOString(),
            ip: clientIP,
            loc: location.formatted,
            city: location.city || '',
            region: location.region || '',
            country: location.country || '',
            is90: is90Plus
          };
          
          accessLog.unshift(newEntry);
          if (accessLog.length > 100) accessLog = accessLog.slice(0, 100);
          
          let accessLogStr = JSON.stringify(accessLog);
          while (accessLogStr.length > 2000 && accessLog.length > 1) {
            accessLog.pop();
            accessLogStr = JSON.stringify(accessLog);
          }
          
          const updateProps = {
            'Views': { number: currentViews + 1 },
            'Last Accessed': { date: { start: new Date().toISOString() } },
            'Last Visitor Location': { rich_text: [{ text: { content: location.formatted.substring(0, 100) } }] },
            'Last Visitor IP': { rich_text: [{ text: { content: clientIP.substring(0, 50) } }] },
            'Access Log': { rich_text: [{ text: { content: accessLogStr } }] }
          };
          
          await notionRequest(`/pages/${page.id}`, 'PATCH', { properties: updateProps });
          
          console.log('Analytics updated: Views =', currentViews + 1);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
              views: currentViews + 1,
              location: location.formatted
            })
          };
        }
        
        console.log('Price list not found for tracking:', baseId);
      } catch (error) {
        console.error('Track error:', error.message);
      }
      
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, sessionId: Date.now().toString(36) }) };
    }
    
    // ============================================
    // ANALYTICS: Track session duration
    // POST /api/track-duration
    // ============================================
    if (resource === 'track-duration' && httpMethod === 'POST') {
      const PRICE_LIST_EXPORTS_DB_ID = process.env.PRICE_LIST_EXPORTS_DATABASE_ID || '2cca824fc71f80cabe74f214af845c9d';
      
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      
      const { priceListId, duration, sessionId } = data;
      
      console.log('=== Analytics Duration ===');
      console.log('Price List ID:', priceListId);
      console.log('Duration (sec):', duration);
      
      if (!priceListId || !duration || duration < 1) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      
      const baseId = priceListId.endsWith('90') ? priceListId.slice(0, -2) : priceListId;
      
      try {
        const queryResponse = await notionRequest(
          `/databases/${PRICE_LIST_EXPORTS_DB_ID}/query`, 
          'POST',
          { filter: { property: 'Price List ID', rich_text: { equals: baseId } } }
        );
        
        if (queryResponse.results && queryResponse.results.length > 0) {
          const page = queryResponse.results[0];
          const props = page.properties;
          
          const currentAvg = props['Avg Duration (sec)']?.number || 0;
          const views = props['Views']?.number || 1;
          
          // Rolling average: newAvg = ((oldAvg * (n-1)) + newValue) / n
          const newAvg = Math.round(((currentAvg * Math.max(views - 1, 0)) + Math.min(duration, 3600)) / views);
          
          const maxDuration = props['Max Duration (sec)']?.number || 0;
          
          const updateProps = { 'Avg Duration (sec)': { number: newAvg } };
          
          if (duration > maxDuration) {
            updateProps['Max Duration (sec)'] = { number: Math.min(duration, 3600) };
          }
          
          await notionRequest(`/pages/${page.id}`, 'PATCH', { properties: updateProps });
          
          console.log('Duration updated: Avg =', newAvg, 'seconds');
        }
      } catch (error) {
        console.error('Track duration error:', error.message);
      }
      
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
    
    // ============================================
    // States endpoint
    // ============================================
    if (resource === 'states') {
      if (httpMethod === 'GET') {
        const states = await getStatesFromNotion();
        if (states) {
          return { statusCode: 200, headers, body: JSON.stringify({ states }) };
        }
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
    
    // ============================================
    // Price list endpoint
    // ============================================
    if (resource === 'price-list') {
      if (httpMethod === 'GET' && resourceId) {
        const PRODUCTS_DB_ID = process.env.PRODUCTS_DATABASE_ID || '267a824fc71f8028a369dd5eb02279d2';
        const PRICE_LIST_EXPORTS_DB_ID = process.env.PRICE_LIST_EXPORTS_DATABASE_ID || '2cca824fc71f80cabe74f214af845c9d';
        
        console.log('=== Price List Request ===');
        console.log('resourceId:', resourceId);
        
        const is90Plus = resourceId.endsWith('90');
        const baseListId = is90Plus ? resourceId.slice(0, -2) : resourceId;
        
        console.log('is90Plus:', is90Plus);
        console.log('baseListId:', baseListId);
        
        try {
          const exportSearch = await notionRequest(`/databases/${PRICE_LIST_EXPORTS_DB_ID}/query`, 'POST', {
            filter: { property: 'Price List ID', rich_text: { equals: baseListId } }
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
          
          const richTextArray = exportProps['Product IDs']?.rich_text || [];
          const productIdsStr = richTextArray.map(rt => rt.plain_text).join('');
          const productIds = productIdsStr.split(',').map(id => id.trim()).filter(Boolean);
          
          console.log('Found', productIds.length, 'product IDs');
          
          const productDataArray = exportProps['Product Data']?.rich_text || [];
          const productDataStr = productDataArray.map(rt => rt.plain_text).join('');
          let productData = {};
          
          if (productDataStr) {
            try {
              productData = JSON.parse(productDataStr);
              console.log('Found product data for', Object.keys(productData).length, 'products');
            } catch (e) {
              console.log('Could not parse product data JSON:', e.message);
            }
          }
          
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
          
          const companyName = exportProps['Company']?.rich_text?.[0]?.plain_text || '';
          const targetMarket = exportProps['Target Market']?.select?.name || '';
          let displayName = exportProps['Name']?.title?.[0]?.plain_text || resourceId;
          
          if (is90Plus) displayName = `${displayName} (90+ Scores)`;
          
          console.log('Display name:', displayName);
          console.log('Target market:', targetMarket);
          
          const products = [];
          
          if (Object.keys(productData).length > 0) {
            console.log('Using cached product data (fast path)');
            
            for (const productId of productIds) {
              const normalizedId = productId.replace(/-/g, '');
              const data = productData[productId] || productData[normalizedId];
              
              if (data) {
                products.push({
                  id: productId,
                  name: data.name || '',
                  producer: data.producer || '',
                  region: data.region || '',
                  color: data.color || '',
                  vintage: data.vintage || ''
                });
              }
            }
            
            console.log('Loaded', products.length, 'products from cached data');
          } else {
            console.log('No cached product data, falling back to database query (slow)');
            
            const productIdSet = new Set(productIds.map(id => id.replace(/-/g, '').toLowerCase()));
            let hasMore = true;
            let startCursor = undefined;
            let supplierCache = {};
            let pageCount = 0;
            const maxPages = 10;
            
            while (hasMore && pageCount < maxPages && products.length < productIds.length) {
              const response = await notionRequest(`/databases/${PRODUCTS_DB_ID}/query`, 'POST', {
                sorts: [{ property: 'Region', direction: 'ascending' }],
                start_cursor: startCursor,
                page_size: 100
              });
              
              pageCount++;
              
              for (const page of response.results || []) {
                const pageIdNormalized = page.id.replace(/-/g, '').toLowerCase();
                if (!productIdSet.has(pageIdNormalized)) continue;
                
                const props = page.properties;
                
                let productName = '';
                for (const [key, value] of Object.entries(props)) {
                  if (value.type === 'title' && value.title?.[0]?.plain_text) {
                    productName = value.title[0].plain_text;
                    break;
                  }
                }
                
                let producer = '';
                const supplierRelation = props['🏢 Supplier']?.relation;
                if (supplierRelation && supplierRelation.length > 0) {
                  const supplierId = supplierRelation[0].id;
                  if (supplierCache[supplierId]) {
                    producer = supplierCache[supplierId];
                  } else {
                    try {
                      const supplierPage = await notionRequest(`/pages/${supplierId}`, 'GET');
                      for (const [key, value] of Object.entries(supplierPage.properties || {})) {
                        if (value.type === 'title' && value.title?.[0]?.plain_text) {
                          producer = value.title[0].plain_text;
                          supplierCache[supplierId] = producer;
                          break;
                        }
                      }
                    } catch (e) { /* ignore */ }
                  }
                }
                
                const region = props.Region?.multi_select?.[0]?.name || props.Region?.select?.name || '';
                const color = props.Color?.select?.name || '';
                const vintage = props.Vintage?.rich_text?.[0]?.plain_text || '';
                const fullName = props['Full Product Name']?.formula?.string || productName;
                
                if (productName) {
                  products.push({
                    id: page.id,
                    name: fullName || productName,
                    producer: producer,
                    region: region,
                    color: color,
                    vintage: vintage
                  });
                }
              }
              
              hasMore = response.has_more;
              startCursor = response.next_cursor;
            }
          }
          
          console.log('Total products:', products.length);
          
          const organized = {};
          products.forEach(p => {
            const region = p.region || 'Other';
            const producer = p.producer || 'Unknown';
            
            if (!organized[region]) organized[region] = {};
            if (!organized[region][producer]) organized[region][producer] = [];
            organized[region][producer].push(p);
          });
          
          Object.keys(organized).forEach(region => {
            Object.keys(organized[region]).forEach(producer => {
              organized[region][producer].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            });
          });
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              priceListId: resourceId,
              baseListId: baseListId,
              is90Plus: is90Plus,
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
            body: JSON.stringify({ error: 'Failed to fetch price list', message: error.message })
          };
        }
      }
    }
    
    // ============================================
    // Sample request endpoint
    // ============================================
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
        
        let notionPageId = null;
        if (process.env.NOTION_API_KEY && process.env.SAMPLE_REQUESTS_DB_ID) {
          try {
            const notionResponse = await createSampleRequestInNotion(data);
            notionPageId = notionResponse[0]?.id;
            console.log('Created Notion page:', notionPageId);
          } catch (notionErr) {
            console.error('Notion error:', notionErr.message);
          }
        } else {
          console.log('Notion not configured - request logged only');
        }
        
        if (process.env.RESEND_API_KEY) {
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
          body: JSON.stringify({ success: true, id, notionPageId, message: 'Sample request submitted successfully' })
        };
      }
    }
    
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
    
  } catch (error) {
    console.error('API Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
