# Loon Sample Request Form

A web-based sample request form for Loon Trading Co. customers to request wine samples. Stores requests in Notion and sends email notifications.

## Live URL

**https://loon-sample-requests.netlify.app**

## Features

- **Dynamic Wine Selection** - Wines organized by Region → Producer
- **Shopping Cart** - Visual cart showing selected wines
- **Notion Integration** - Requests stored in your Notion database
- **Email Notifications** - Sends to john@loontradingco.com and office@loontradingco.com
- **Mobile Responsive** - Works on all devices

---

## Setup Guide

### Step 1: Create the Notion Database

1. Open Notion and create a new database (Table view)
2. Name it "Sample Requests"
3. Add these properties:

| Property Name | Type | Notes |
|---------------|------|-------|
| Name | Title | Auto-filled with "Company - Sample Request" |
| Company | Text | Customer company name |
| Contact Name | Text | First + Last name |
| Email | Email | Contact email |
| Phone | Phone | Contact phone |
| Shipping Address | Text | Full address |
| Wines Count | Number | Count of wines requested |
| Status | Select | Options: New, Processing, Shipped, Complete |
| Submitted | Date | Request date |

4. **Get the Database ID:**
   - Open the database in Notion
   - Look at the URL: `https://notion.so/YOUR_WORKSPACE/DATABASE_ID?v=...`
   - Copy the DATABASE_ID (32 characters, no dashes)

### Step 2: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it "Loon Sample Requests"
4. Select your workspace
5. Click "Submit"
6. Copy the "Internal Integration Token" (starts with `secret_`)

### Step 3: Connect Database to Integration

1. Open your Sample Requests database in Notion
2. Click "..." menu (top right) → "Add connections"
3. Search for "Loon Sample Requests" and add it

### Step 4: Add Environment Variables in Netlify

Go to Netlify → Site Settings → Environment Variables → Add:

| Variable | Value |
|----------|-------|
| `NOTION_API_KEY` | Your integration token (secret_...) |
| `SAMPLE_REQUESTS_DB_ID` | Your database ID (32 chars) |
| `RESEND_API_KEY` | Your Resend API key |

### Step 5: Deploy

Push to GitHub (auto-deploys) or run:
```bash
netlify deploy --prod
```

---

## How It Works

1. Customer visits: `https://loon-sample-requests.netlify.app?list=demo`
2. Selects wines and fills out form
3. Submits request
4. **Notion:** New page created in your database with all details
5. **Email:** Notification sent to your team with link to Notion page

---

## Project Structure

```
LoonSampleRequest/
├── public/
│   ├── index.html      # Main form
│   └── logo.png        # Logo
├── netlify/
│   └── functions/
│       └── api.js      # API with Notion integration
├── netlify.toml        # Netlify config
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTION_API_KEY` | Yes | Notion integration token |
| `SAMPLE_REQUESTS_DB_ID` | Yes | Notion database ID |
| `RESEND_API_KEY` | Yes | Resend API key for emails |

---

## Local Development

```bash
npm install
npm start
```

Visit http://localhost:3000?list=demo

---

© 2024 Loon Trading Co.
