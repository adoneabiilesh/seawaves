# Production Deployment Checklist

## Pre-Deployment

### Database Setup
- [ ] Create Supabase project
- [ ] Run SQL migration (`supabase_migration.sql`)
- [ ] Verify all tables created (User, RestaurantRole, Session)
- [ ] Test RLS policies
- [ ] Enable database backups

### Environment Variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Generate and set `NEXTAUTH_SECRET` (openssl rand -base64 32)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Set Stripe keys (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [ ] Set `STRIPE_WEBHOOK_SECRET`
- [ ] Set SendGrid keys (optional)
- [ ] Set `NEXT_PUBLIC_APP_URL`
- [ ] Set `GEMINI_API_KEY`

### Stripe Configuration
- [ ] Create Stripe account
- [ ] Enable Stripe Connect
- [ ] Switch to live mode
- [ ] Configure webhook endpoint
- [ ] Test webhook with Stripe CLI
- [ ] Verify platform fee calculation

### Domain Configuration
- [ ] Register domain
- [ ] Add wildcard DNS record (*.yourplatform.com)
- [ ] Configure in Vercel
- [ ] Enable automatic SSL
- [ ] Test subdomain routing

## Deployment

### Code Deployment
- [ ] Run `npm run build` locally to test
- [ ] Fix any build errors
- [ ] Deploy to Vercel
- [ ] Verify deployment successful
- [ ] Check environment variables in Vercel

### Post-Deployment Testing
- [ ] Test owner registration
- [ ] Test login flow
- [ ] Test subdomain creation
- [ ] Test team invitation
- [ ] Test order creation
- [ ] Test Stripe payment (test mode first)
- [ ] Test webhook delivery
- [ ] Test role-based access control

## Security

### Authentication
- [ ] Verify passwords are hashed
- [ ] Test session expiration
- [ ] Verify JWT secret is secure
- [ ] Test unauthorized access blocked

### Authorization
- [ ] Test owner-only endpoints
- [ ] Test role-based filtering
- [ ] Verify cross-tenant data isolation
- [ ] Test RLS policies

### Payment Security
- [ ] Verify webhook signature validation
- [ ] Test refund flow
- [ ] Verify platform fee calculation
- [ ] Test failed payment handling

## Monitoring

### Error Tracking
- [ ] Set up Sentry (optional)
- [ ] Configure error alerts
- [ ] Test error reporting

### Logging
- [ ] Review Vercel logs
- [ ] Check Supabase logs
- [ ] Monitor Stripe dashboard

### Performance
- [ ] Run Lighthouse audit
- [ ] Check API response times
- [ ] Monitor database query performance

## Documentation

- [ ] Update README.md
- [ ] Document environment variables
- [ ] Create user guides
- [ ] Document API endpoints

## Launch

### Soft Launch
- [ ] Invite beta testers
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Monitor performance

### Public Launch
- [ ] Announce launch
- [ ] Monitor for issues
- [ ] Respond to support requests
- [ ] Scale infrastructure if needed

## Post-Launch

### Maintenance
- [ ] Set up automated backups
- [ ] Create incident response plan
- [ ] Schedule security audits
- [ ] Plan feature updates

### Scaling
- [ ] Monitor user growth
- [ ] Optimize database queries
- [ ] Consider caching layer
- [ ] Plan for increased traffic

---

## Quick Start Commands

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/payments/webhook

# Deploy to Vercel
vercel --prod

# Check build
npm run build

# Run locally
npm run dev
```

---

## Support Contacts

- Supabase: https://supabase.com/dashboard
- Stripe: https://dashboard.stripe.com
- Vercel: https://vercel.com/dashboard
- SendGrid: https://app.sendgrid.com

---

**Last Updated:** 2025-12-16
