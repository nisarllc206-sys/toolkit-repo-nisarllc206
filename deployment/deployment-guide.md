# Deployment Guide

## Option 1: Vercel (Recommended for starters)

### Prerequisites
- Vercel account (free tier works)
- Firebase project with Firestore enabled

### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd /path/to/project
   vercel --prod
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`

5. **Custom Domain** (optional):
   - Go to Project Settings → Domains
   - Add your domain and follow DNS instructions

---

## Option 2: Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Set root directory to `backend/`
4. Add environment variables from `.env.example`
5. Railway auto-detects Node.js and deploys

---

## Option 3: Firebase Hosting + Cloud Functions

### Frontend
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

### Backend as Cloud Function
```bash
firebase init functions
# Copy backend files into functions/
firebase deploy --only functions
```

---

## Option 4: Docker / VPS

### Build and run
```bash
docker-compose up -d --build
```

### With SSL (Let's Encrypt)
```bash
# Install Certbot
certbot certonly --webroot -w /var/www/html -d yourdomain.com

# Update nginx.conf with SSL paths
docker-compose restart nginx
```

---

## Environment Variables Checklist

| Variable | Required | Notes |
|----------|----------|-------|
| JWT_SECRET | ✅ | Generate with `openssl rand -base64 64` |
| FIREBASE_PROJECT_ID | ✅ | From Firebase Console |
| FIREBASE_PRIVATE_KEY | ✅ | From service account JSON |
| FIREBASE_CLIENT_EMAIL | ✅ | From service account JSON |
| OPENAI_API_KEY | ✅ for AI | From platform.openai.com |
| STRIPE_SECRET_KEY | ✅ for payments | From Stripe Dashboard |
| STRIPE_WEBHOOK_SECRET | ✅ for payments | From Stripe Webhooks |
| TWILIO_ACCOUNT_SID | Optional | For WhatsApp |
| EMAIL_USER | Optional | For email notifications |
