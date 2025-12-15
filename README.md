# Loon Sample Request

A web application for wine distributors and retailers to request samples from Loon Trading Co. price lists.

## How It Works

1. **Export a Price List** - When you export a price list from the Loon Price List Exporter, you can generate a sample request link
2. **Share the Link** - Include the sample request URL in your email or Excel file
3. **Customer Fills Form** - Your customer visits the link, sees only the wines from their price list, and can select which ones they want to sample
4. **You Get Notified** - You receive an email with the sample request details

## Free Deployment on Netlify (Recommended)

### Step 1: Create a GitHub Repository

1. Go to github.com and sign in (or create account)
2. Click "New Repository"
3. Name it `loon-sample-request`
4. Make it Public or Private
5. Click "Create Repository"

### Step 2: Upload the Files

Option A - Using GitHub web interface:
1. Click "uploading an existing file"
2. Drag and drop all files from this folder
3. Click "Commit changes"

Option B - Using command line:
```bash
cd LoonSampleRequest
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/loon-sample-request.git
git push -u origin main
```

### Step 3: Deploy on Netlify

1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Authorize Netlify to access your GitHub
5. Select your `loon-sample-request` repository
6. Leave build settings as default (Netlify will detect `netlify.toml`)
7. Click "Deploy site"

### Step 4: Your Site is Live!

Netlify will give you a URL like: `https://random-name-123.netlify.app`

You can customize it:
1. Go to "Site settings" → "Change site name"
2. Change to something like `loon-samples` 
3. Your URL becomes: `https://loon-samples.netlify.app`

Or add your own domain in "Domain settings"

## Testing Your Deployment

Visit your site with a test parameter:
```
https://your-site.netlify.app?list=demo
```

This will show demo wines so you can test the form.

## Connecting to Price List Exporter

Once deployed, your sample request URL format will be:
```
https://your-site.netlify.app?list=PRICE_LIST_ID
```

In a future update, the exporter can automatically generate these links when exporting price lists.

## Local Development

```bash
npm install
npm start
```

Runs at `http://localhost:3001`

## File Structure

```
LoonSampleRequest/
├── public/
│   └── index.html      # Frontend form
├── netlify/
│   └── functions/
│       └── api.js      # Serverless API
├── netlify.toml        # Netlify config
├── server.js           # Local dev server
└── package.json
```

## Data Storage Note

The current Netlify function uses in-memory storage (demo mode). For production with persistent data, you'll need to add:

1. **Netlify Blobs** (easiest) - Built into Netlify
2. **MongoDB Atlas** (free tier) - NoSQL database
3. **Supabase** (free tier) - PostgreSQL database
4. **Notion API** - Store requests in your Notion database

## Adding Email Notifications

To get email notifications when someone submits a request:

1. Sign up for [Resend](https://resend.com) (free tier: 100 emails/day)
2. Add your API key to Netlify environment variables
3. Update the API function to send emails

Or use Netlify Forms for simpler form handling.
