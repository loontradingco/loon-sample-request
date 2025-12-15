# Loon Sample Request Form

A web-based sample request form for Loon Trading Co. customers to request wine samples.

## Live URL

**https://loon-sample-requests.netlify.app**

## Features

- **Dynamic Wine Selection** - Wines organized by Region → Producer for easy browsing
- **Search & Filter** - Quick search across wine names, producers, and regions
- **Shopping Cart** - Visual cart showing selected wines with easy removal
- **Complete Contact Form** - Company info, contact details, shipping address
- **Special Instructions** - Field for delivery notes and comments
- **Mobile Responsive** - Works on desktop, tablet, and mobile
- **Email Notifications** - Sends notifications to john@loontradingco.com and office@loontradingco.com

## How It Works

1. Share a link with your customer: `https://loon-sample-requests.netlify.app?list=demo`
2. Customer selects wines from the list
3. Customer fills out contact and shipping information
4. Customer submits the request
5. Email notifications are sent to your team
6. Request data is logged (see Netlify Functions logs)

## Demo Mode

Visit `?list=demo` to see the form with sample wines for testing.

## Email Notifications

Emails are sent via Resend API when configured:

- **From:** onboarding@resend.dev (or your verified domain)
- **To:** john@loontradingco.com, office@loontradingco.com

### Setting Up Email

1. Add `RESEND_API_KEY` environment variable in Netlify
2. Get your API key from resend.com
3. (Optional) Verify your domain for custom "from" address

## Project Structure

```
LoonSampleRequest/
├── public/
│   ├── index.html      # Main form (single-page app)
│   └── logo.png        # Loon Trading Co. logo
├── netlify/
│   └── functions/
│       └── api.js      # Serverless API handler
├── netlify.toml        # Netlify configuration
├── package.json        # Dependencies
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/price-list/:id` | GET | Get wines for a price list |
| `/api/price-list` | POST | Create a new price list |
| `/api/sample-request` | POST | Submit a sample request |

## Deployment

The site is deployed on Netlify and auto-deploys when you push to GitHub.

### Manual Deploy

```bash
cd LoonSampleRequest
netlify deploy --prod
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | No | Resend API key for email notifications |

## Future Enhancements

- **Notion Integration** - Store requests in your Notion database
- **Custom Price Lists** - Integration with Price List Exporter
- **Order Tracking** - Status updates for sample requests

## Local Development

```bash
npm install
npm start
```

Then visit http://localhost:3000?list=demo

---

© 2024 Loon Trading Co.
