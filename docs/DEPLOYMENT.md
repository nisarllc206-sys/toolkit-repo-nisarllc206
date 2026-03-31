# Deployment Guide

See `deployment/deployment-guide.md` for detailed deployment instructions.

## Quick Reference

| Platform | Command | Free Tier |
|----------|---------|-----------|
| Vercel | `vercel --prod` | ✅ Yes |
| Railway | Push to GitHub | ✅ Yes |
| Firebase | `firebase deploy` | ✅ Yes |
| Docker | `docker-compose up -d` | ❌ VPS needed |

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `JWT_SECRET` (64+ chars)
- [ ] Enable HTTPS
- [ ] Configure `CORS_ORIGIN` to your frontend domain
- [ ] Set up Stripe webhook with production URL
- [ ] Enable Firebase Firestore rules
- [ ] Configure email service
- [ ] Monitor with logging (Winston logs to files in production)
