const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
const PRICE_LISTS_DIR = path.join(DATA_DIR, 'price-lists');
const REQUESTS_DIR = path.join(DATA_DIR, 'requests');

// Ensure directories exist
[DATA_DIR, PRICE_LISTS_DIR, REQUESTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Email configuration (optional - set in environment variables)
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'john@loontradingco.com';

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ============================================================================
// API ROUTES
// ============================================================================

// Create a new price list (called from Loon Price List Exporter)
app.post('/api/price-list', (req, res) => {
  try {
    const { name, company, wines, createdBy, exportDate } = req.body;
    
    if (!wines || !Array.isArray(wines) || wines.length === 0) {
      return res.status(400).json({ error: 'Wines array is required' });
    }
    
    const id = generateId();
    const priceList = {
      id,
      name: name || 'Price List',
      company: company || 'Unknown',
      wines: wines.map(w => ({
        id: w.id || generateId(),
        name: w['Product Name'] || w.name,
        producer: w.Producer || w.producer,
        region: w.Region || w.region,
        range: w.Range || w.range,
        color: w.Color || w.color,
        vintage: w.Vintage || w.vintage || ''
      })),
      createdBy,
      exportDate: exportDate || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // Save to file
    const filePath = path.join(PRICE_LISTS_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(priceList, null, 2));
    
    // Generate sample request URL
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const sampleUrl = `${baseUrl}?list=${id}`;
    
    res.json({
      success: true,
      id,
      sampleUrl,
      wineCount: priceList.wines.length
    });
  } catch (error) {
    console.error('Error creating price list:', error);
    res.status(500).json({ error: 'Failed to create price list' });
  }
});

// Get a price list
app.get('/api/price-list/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(PRICE_LISTS_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Price list not found' });
    }
    
    const priceList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(priceList);
  } catch (error) {
    console.error('Error fetching price list:', error);
    res.status(500).json({ error: 'Failed to fetch price list' });
  }
});

// Submit a sample request
app.post('/api/sample-request', async (req, res) => {
  try {
    const { priceListId, priceListName, wines, contact, shipping, comments } = req.body;
    
    if (!wines || wines.length === 0) {
      return res.status(400).json({ error: 'No wines selected' });
    }
    
    if (!contact || !contact.email) {
      return res.status(400).json({ error: 'Contact information required' });
    }
    
    const requestId = generateId();
    const request = {
      id: requestId,
      priceListId,
      priceListName,
      wines,
      contact,
      shipping,
      comments,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    
    // Save to file
    const filePath = path.join(REQUESTS_DIR, `${requestId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(request, null, 2));
    
    // Send notification email (if configured)
    if (EMAIL_CONFIG.host && EMAIL_CONFIG.auth.user) {
      try {
        await sendNotificationEmail(request);
      } catch (emailErr) {
        console.error('Failed to send notification email:', emailErr);
      }
    }
    
    // Send confirmation email to customer
    if (EMAIL_CONFIG.host && EMAIL_CONFIG.auth.user) {
      try {
        await sendConfirmationEmail(request);
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
      }
    }
    
    res.json({
      success: true,
      requestId,
      message: 'Sample request submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting sample request:', error);
    res.status(500).json({ error: 'Failed to submit sample request' });
  }
});

// List all sample requests (admin)
app.get('/api/sample-requests', (req, res) => {
  try {
    const files = fs.readdirSync(REQUESTS_DIR).filter(f => f.endsWith('.json'));
    const requests = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(REQUESTS_DIR, f), 'utf8'));
      return {
        id: data.id,
        company: data.contact?.company,
        contactName: `${data.contact?.firstName} ${data.contact?.lastName}`,
        email: data.contact?.email,
        wineCount: data.wines?.length,
        status: data.status,
        submittedAt: data.submittedAt
      };
    });
    
    // Sort by date descending
    requests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.json(requests);
  } catch (error) {
    console.error('Error listing requests:', error);
    res.status(500).json({ error: 'Failed to list requests' });
  }
});

// Get a specific sample request
app.get('/api/sample-request/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(REQUESTS_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// Update request status
app.patch('/api/sample-request/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const filePath = path.join(REQUESTS_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    request.status = status;
    request.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(filePath, JSON.stringify(request, null, 2));
    res.json({ success: true, request });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

async function sendNotificationEmail(request) {
  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  
  const wineList = request.wines.map(w => `• ${w.name} (${w.producer})`).join('\n');
  
  await transporter.sendMail({
    from: EMAIL_CONFIG.auth.user,
    to: NOTIFY_EMAIL,
    subject: `New Sample Request from ${request.contact.company}`,
    text: `
New Sample Request Received

Company: ${request.contact.company}
Contact: ${request.contact.firstName} ${request.contact.lastName}
Email: ${request.contact.email}
Phone: ${request.contact.phone}

Shipping Address:
${request.shipping.address1}
${request.shipping.address2 || ''}
${request.shipping.city}, ${request.shipping.state} ${request.shipping.zip}
${request.shipping.country}

Wines Requested (${request.wines.length}):
${wineList}

Comments:
${request.comments || 'None'}

Submitted: ${new Date(request.submittedAt).toLocaleString()}
    `.trim(),
    html: `
<h2>New Sample Request Received</h2>

<h3>Contact Information</h3>
<p><strong>Company:</strong> ${request.contact.company}<br>
<strong>Contact:</strong> ${request.contact.firstName} ${request.contact.lastName}<br>
<strong>Email:</strong> <a href="mailto:${request.contact.email}">${request.contact.email}</a><br>
<strong>Phone:</strong> ${request.contact.phone}</p>

<h3>Shipping Address</h3>
<p>${request.shipping.address1}<br>
${request.shipping.address2 ? request.shipping.address2 + '<br>' : ''}
${request.shipping.city}, ${request.shipping.state} ${request.shipping.zip}<br>
${request.shipping.country}</p>

<h3>Wines Requested (${request.wines.length})</h3>
<ul>
${request.wines.map(w => `<li><strong>${w.name}</strong> - ${w.producer} (${w.region})</li>`).join('')}
</ul>

${request.comments ? `<h3>Comments</h3><p>${request.comments}</p>` : ''}

<p style="color: #666; font-size: 12px;">Submitted: ${new Date(request.submittedAt).toLocaleString()}</p>
    `
  });
}

async function sendConfirmationEmail(request) {
  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  
  const wineList = request.wines.map(w => `• ${w.name}`).join('\n');
  
  await transporter.sendMail({
    from: EMAIL_CONFIG.auth.user,
    to: request.contact.email,
    subject: 'Sample Request Confirmation - Loon Trading Co.',
    text: `
Dear ${request.contact.firstName},

Thank you for your sample request! We have received your order and will be in touch shortly to confirm the details.

Wines Requested:
${wineList}

Shipping to:
${request.shipping.address1}
${request.shipping.address2 || ''}
${request.shipping.city}, ${request.shipping.state} ${request.shipping.zip}

If you have any questions, please don't hesitate to contact us.

Best regards,
Loon Trading Co.
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2c2c2c;">Sample Request Confirmation</h2>
  
  <p>Dear ${request.contact.firstName},</p>
  
  <p>Thank you for your sample request! We have received your order and will be in touch shortly to confirm the details.</p>
  
  <h3 style="color: #d4a853;">Wines Requested</h3>
  <ul>
    ${request.wines.map(w => `<li>${w.name}</li>`).join('')}
  </ul>
  
  <h3 style="color: #d4a853;">Shipping To</h3>
  <p>${request.shipping.address1}<br>
  ${request.shipping.address2 ? request.shipping.address2 + '<br>' : ''}
  ${request.shipping.city}, ${request.shipping.state} ${request.shipping.zip}</p>
  
  <p>If you have any questions, please don't hesitate to contact us.</p>
  
  <p>Best regards,<br>
  <strong>Loon Trading Co.</strong></p>
</div>
    `
  });
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`Sample Request Server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
