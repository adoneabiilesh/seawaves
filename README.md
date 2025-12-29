# Restaurant SaaS Platform

A complete multi-tenant restaurant management platform with role-based access control, team management, Stripe payment processing, and real-time order tracking.

## 🚀 Features

- **Multi-Tenant Architecture**: Subdomain-based routing for each restaurant
- **Role-Based Access Control**: 4 roles (Owner, Manager, Waiter, Kitchen) with granular permissions
- **Team Management**: Invite and manage team members with JWT-based invitations
- **Stripe Integration**: Payment processing with Stripe Connect and platform fees
- **Order Management**: Real-time order tracking with role-based filtering
- **Secure Authentication**: NextAuth with bcrypt password hashing
- **Audit Logging**: Track all sensitive actions

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account
- Stripe account
- Domain with wildcard DNS support

## 🛠️ Installation

```bash
# Clone repository
git clone <your-repo-url>
cd culinaryai---smart-restaurant-os

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
```

## 🗄️ Database Setup

1. Create a Supabase project
2. Run the SQL migration:
   - Open Supabase SQL Editor
   - Copy contents of `supabase_migration.sql`
   - Execute the script

## ⚙️ Configuration

### Environment Variables

See `.env.example` for all required variables.

**Critical Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

### Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourplatform.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to `.env.local`

## 🚀 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./walkthrough.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Payments**: Stripe + Stripe Connect
- **Deployment**: Vercel

### Key Files
- `middleware.ts` - Subdomain routing and tenant extraction
- `lib/auth.ts` - NextAuth configuration
- `lib/permissions.ts` - RBAC permission system
- `lib/tenant.ts` - Subdomain utilities
- `lib/db.ts` - Supabase client

## 🔐 Security

- ✅ bcrypt password hashing (10 rounds)
- ✅ JWT session tokens (30-day expiration)
- ✅ Stripe webhook signature verification
- ✅ Row Level Security (RLS) on database
- ✅ Role-based API authorization
- ✅ Audit logging for sensitive actions

## 📊 Database Schema

**Main Tables:**
- `User` - All team members
- `Owner` - Restaurant owners (backward compatibility)
- `Restaurant` - Restaurant details and settings
- `RestaurantRole` - RBAC many-to-many relationship
- `Order` - Customer orders
- `Payment` - Payment records
- `AuditLog` - Action tracking

## 🎯 User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access to all features |
| **Manager** | Orders, kitchen, inventory, analytics |
| **Waiter** | Active orders, table management |
| **Kitchen** | Kitchen orders, status updates |

## 🧪 Testing

### Test Owner Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Doe",
    "restaurantName": "Test Restaurant"
  }'
```

### Test Subdomain Locally
Add to `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 test-restaurant.localhost
```

Then visit: `http://test-restaurant.localhost:3000`

## 🚀 Deployment

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete deployment guide.

**Quick Deploy to Vercel:**
```bash
npm i -g vercel
vercel --prod
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register owner
- `POST /api/auth/[...nextauth]` - NextAuth handler

### Team Management
- `POST /api/team/invite` - Invite team member
- `POST /api/team/accept` - Accept invitation
- `GET /api/team/list` - List team members

### Orders
- `POST /api/orders/create` - Create order
- `GET /api/orders/list` - List orders (role-filtered)
- `POST /api/orders/update-status` - Update order status

### Payments
- `POST /api/payments/create-intent` - Create Stripe PaymentIntent
- `POST /api/payments/webhook` - Stripe webhook handler

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
1. Check the [Deployment Guide](./walkthrough.md)
2. Review [API Documentation](./API_DOCUMENTATION.md)
3. Check Supabase logs
4. Review Stripe dashboard

## 🎉 Acknowledgments

Built with:
- Next.js
- Supabase
- Stripe
- NextAuth.js
- TailwindCSS

---

**Ready to launch your restaurant SaaS platform!** 🚀
