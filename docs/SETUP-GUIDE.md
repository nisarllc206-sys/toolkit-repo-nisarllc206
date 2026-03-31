# Local Development Setup Guide

## Prerequisites

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 9+
- Firebase project with Firestore enabled
- (Optional) OpenAI API key, Stripe account, Twilio account

---

## Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ai-creator-saas
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials (see below for each service).

### 4. Start the Backend Server
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

### 5. Open the Frontend
Open `frontend/public/index.html` in your browser, or serve it:
```bash
npx serve frontend/public -p 3000
```

---

## Environment Variable Configuration

### Required: JWT Secret
Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Set as `JWT_SECRET` in `.env`.

### Firebase (Required for full functionality)
See `docs/FIREBASE-SETUP.md` for detailed instructions.

Set:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

### OpenAI (Required for AI features)
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set `OPENAI_API_KEY=sk-...`

### Stripe (Optional - for payments)
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Get keys from Developers → API keys
3. Set `STRIPE_SECRET_KEY=sk_test_...`
4. For webhooks: Install Stripe CLI, run `stripe listen --forward-to localhost:5000/api/payments/webhook`
5. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Twilio WhatsApp (Optional)
1. Create account at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token from Console
3. Join WhatsApp Sandbox: Text "join <code>" to +14155238886
4. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `WHATSAPP_NOTIFY_TO`

### Email (Optional)
For Gmail:
1. Enable 2-Step Verification on your Google account
2. Go to Security → App Passwords
3. Generate an App Password
4. Set `EMAIL_USER=your@gmail.com`, `EMAIL_PASSWORD=<app-password>`

### WordPress (Optional)
1. In WordPress Admin: Users → Profile → Application Passwords
2. Add a name (e.g., "AI Creator SaaS") and generate password
3. Format in `.env`: `WORDPRESS_SITES=[{"siteUrl":"https://site.com","username":"admin","applicationPassword":"xxxx xxxx xxxx"}]`

---

## Running Automation Scripts

```bash
# WordPress auto-publisher (runs every 5 minutes)
cd automation
node wp-auto-post.js

# Social media scheduler
node social-scheduler.js

# Notification sender
node notification-sender.js
```

---

## Seeding the Database

After Firebase is configured:
```bash
cd database/migrations
node 001_initial_schema.js
```

---

## API Health Check
```bash
curl http://localhost:5000/health
```

Expected: `{"status":"ok","timestamp":"...","uptime":...}`

---

## Testing Auth Flow
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
