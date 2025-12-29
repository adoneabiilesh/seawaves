# 🏗️ COMPLETE SYSTEM ARCHITECTURE & FLOW

## PROJECT OVERVIEW

```
Restaurant SaaS Platform
├── Multi-Tenant Architecture (Subdomain-based)
├── Role-Based Access Control (4 roles)
├── Real-time Order Management
├── AI Menu Digitization
├── Multi-Payment Integration
└── Team Management System
```

---

## PART 1: DOMAIN ARCHITECTURE

### 1.1 Domain Structure

```
yourplatform.com (Main Platform)
│
├── Root Domain (Public Pages)
│   ├── https://yourplatform.com/              ← Landing Page
│   ├── https://yourplatform.com/login         ← Login Portal
│   ├── https://yourplatform.com/register      ← Registration (Owner only)
│   ├── https://yourplatform.com/pricing       ← Pricing Page
│   ├── https://yourplatform.com/features      ← Features Page
│   └── https://yourplatform.com/help          ← Help & Documentation
│
├── Restaurant Subdomains (Multi-Tenant)
│   ├── https://pizzeria-roma.yourplatform.com/        ← Customer Menu
│   ├── https://pizzeria-roma.yourplatform.com/menu    ← Menu Page
│   ├── https://pizzeria-roma.yourplatform.com/checkout ← Checkout
│   ├── https://pizzeria-roma.yourplatform.com/dashboard ← Staff Dashboard
│   ├── https://pizzeria-roma.yourplatform.com/dashboard/kitchen ← Kitchen
│   ├── https://pizzeria-roma.yourplatform.com/dashboard/orders ← Orders
│   ├── https://pizzeria-roma.yourplatform.com/dashboard/team ← Team Mgmt
│   └── https://pizzeria-roma.yourplatform.com/dashboard/settings ← Settings
│
├── Other Subdomains
│   ├── https://osteria-milano.yourplatform.com/
│   ├── https://trattoria-firenze.yourplatform.com/
│   └── ... (unlimited restaurants)
│
└── Admin Subdomains
    ├── https://admin.yourplatform.com/        ← Platform Admin
    ├── https://api.yourplatform.com/          ← API Gateway
    └── https://webhook.yourplatform.com/      ← Webhook Handler
```

### 1.2 Domain Registration (register.it)

**Step 1: Buy Main Domain**
```
Register: yourplatform.com
Provider: register.it
Cost: ~€12/year
Duration: 1 year (auto-renew)
```

**Step 2: Configure DNS Records**

```
DNS Records in register.it Control Panel:
┌──────────────────────────────────────────────────────┐
│ Type  │ Name  │ Value                   │ TTL        │
├───────┼───────┼─────────────────────────┼────────────┤
│ A     │ @     │ 76.76.19.165 (Vercel)   │ 3600       │
│ A     │ *     │ 76.76.19.165 (Wildcard) │ 3600       │
│ CNAME │ www   │ cname.vercel-dns.com    │ 3600       │
│ MX    │ @     │ mail.yourplatform.com   │ 3600       │
│ TXT   │ @     │ (SPF/DKIM records)      │ 3600       │
└──────────────────────────────────────────────────────┘

⚠️ Wildcard DNS (*.yourplatform.com) is CRITICAL
   This routes ALL subdomains to Vercel
```

**Step 3: Vercel Configuration**

```
1. Create Project: yourplatform-saas
2. Connect Git Repository
3. Add Domain: yourplatform.com
4. Add Wildcard: *.yourplatform.com
5. Wait: ~10 minutes for SSL certificates
6. Status: All green checkmarks ✅

Vercel automatically:
- Routes main domain → landing page
- Routes *.yourplatform.com → dynamic subdomain handler
- Generates SSL certificates for all subdomains
- Handles DNS validation
```

### 1.3 How Subdomain Routing Works

```
User visits: https://pizzeria-roma.yourplatform.com
                    ↓
DNS lookup: *.yourplatform.com → 76.76.19.165 (Vercel IP)
                    ↓
Vercel receives request with Host header
                    ↓
Middleware extracts subdomain: "pizzeria-roma"
                    ↓
Next.js App Router matches: /[subdomain]/
                    ↓
Query database for restaurant with subdomain="pizzeria-roma"
                    ↓
TenantProvider wraps components with restaurant context
                    ↓
Render restaurant-specific UI & data
                    ↓
User sees: Menu, orders, dashboard (based on role)
```

**Code: Middleware (middleware.ts)**

```typescript
export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  
  // Extract subdomain from host
  // host = "pizzeria-roma.yourplatform.com"
  // subdomain = "pizzeria-roma"
  const parts = host.split('.');
  const subdomain = parts[0];
  
  // Skip for main domain pages
  const mainDomainPages = ['www', 'localhost', 'yourplatform.com'];
  if (mainDomainPages.some(page => host.includes(page))) {
    return NextResponse.next();
  }
  
  // Skip static files and API
  if (url.pathname.startsWith('/_next/') || 
      url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Validate subdomain exists in database
  const restaurant = await prisma.restaurant.findUnique({
    where: { subdomain }
  });
  
  if (!restaurant) {
    // Restaurant not found, redirect to main site
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Pass subdomain to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant', subdomain);
  requestHeaders.set('x-tenant-id', restaurant.id);
  
  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
```

---

## PART 2: COMPLETE USER FLOW

### 2.1 Customer (Guest) Flow

```
┌─────────────────────────────────────────────────────┐
│ CUSTOMER JOURNEY (No Account Needed)                │
└─────────────────────────────────────────────────────┘

1. DISCOVERY
   ├─ Restaurant staff gives QR code
   ├─ Customer scans: pizzeria-roma.yourplatform.com
   └─ OR: Customer manually enters URL

2. MENU BROWSING
   ├─ TenantProvider loads restaurant: pizzeria-roma
   ├─ Displays menu in customer's language
   ├─ Filters by allergens/preferences
   └─ Views prices & images

3. ORDERING
   ├─ Selects items + quantities
   ├─ Adds to cart
   ├─ Reviews special requests
   └─ Proceeds to checkout

4. PAYMENT METHOD SELECTION ⭐ NEW
   ├─ Option A: Pay Online (Stripe)
   │   ├─ Enters card details
   │   ├─ Stripe processes payment
   │   ├─ Order marked as PAID
   │   └─ QR receipt shown
   │
   └─ Option B: Pay at Counter
       ├─ Enters name & table number
       ├─ No payment taken
       ├─ Order marked as PENDING_PAYMENT
       └─ Receipts shows "Pay at counter"

5. ORDER CONFIRMATION
   ├─ Order number displayed (e.g., #2847)
   ├─ Estimated prep time (e.g., 15 mins)
   ├─ Real-time status updates
   └─ Notification when ready

6. COLLECTION/DEPARTURE
   ├─ Notified: Order is ready
   ├─ If paid online: Receipt shown, no payment needed
   ├─ If paying at counter: Payment processed
   └─ Order marked as SERVED

NO DATABASE ACCOUNT NEEDED FOR CUSTOMERS!
(Order data stored server-side, accessed via order number)
```

### 2.2 Owner Registration Flow

```
┌─────────────────────────────────────────────────────┐
│ OWNER REGISTRATION (Account Required)               │
└─────────────────────────────────────────────────────┘

1. LANDING PAGE
   ├─ Owner clicks [LOG IN]
   └─ Redirected to /login

2. LOGIN PAGE
   ├─ Two options:
   │  ├─ "I have an account" → Login form
   │  └─ "Create new restaurant" → Register form
   └─ Owner chooses Register

3. REGISTRATION (New Owner)
   ├─ Form Fields:
   │  ├─ Email (e.g., marco@pizzeria.it)
   │  ├─ Password (bcrypt hashed)
   │  ├─ First Name
   │  ├─ Last Name
   │  ├─ Phone Number
   │  └─ Restaurant Name
   │
   ├─ Backend creates:
   │  ├─ Owner account (User table)
   │  ├─ Restaurant account (Restaurant table)
   │  ├─ Unique subdomain (auto-generated or user-provided)
   │  └─ Session token
   │
   └─ Owner redirected to dashboard

4. OWNER DASHBOARD (First Time Setup)
   ├─ Step 1: Upload Menu
   │  ├─ Drag & drop menu photo
   │  ├─ Veryfi extracts items
   │  ├─ Owner reviews & edits
   │  └─ Items saved to database
   │
   ├─ Step 2: Connect Stripe
   │  ├─ "Connect Bank Account" button
   │  ├─ Redirects to Stripe Connect
   │  ├─ Owner authorizes payments
   │  └─ Stripe Account ID saved
   │
   ├─ Step 3: Invite Team
   │  ├─ "Invite Team Members" button
   │  ├─ Enter emails & assign roles
   │  ├─ Emails sent to team
   │  └─ Awaiting acceptance
   │
   └─ Step 4: Go Live
       ├─ QR code generated
       ├─ QR code printed
       ├─ Restaurant goes live
       └─ First orders come in!

5. SETTINGS & CONFIGURATION
   ├─ Restaurant name
   ├─ Logo & branding
   ├─ Currency & language
   ├─ Operating hours
   ├─ Delivery settings
   └─ Payment modes (online/counter)
```

### 2.3 Team Member Invitation Flow

```
┌─────────────────────────────────────────────────────┐
│ TEAM MEMBER INVITATION (Owner invites)              │
└─────────────────────────────────────────────────────┘

1. OWNER INVITES
   ├─ Location: Dashboard → Team Management
   ├─ Owner clicks: "Invite Team Member"
   ├─ Enters:
   │  ├─ Email address (e.g., luigi@pizzeria.it)
   │  ├─ Role dropdown:
   │  │  ├─ 📊 Manager
   │  │  ├─ 🍽️ Waiter
   │  │  └─ 👨‍🍳 Kitchen Staff
   │  └─ Sends invite

2. BACKEND CREATES INVITATION
   ├─ Creates RestaurantRole:
   │  ├─ user_id: (null initially)
   │  ├─ restaurant_id: pizzeria-roma
   │  ├─ role: "waiter"
   │  ├─ status: "pending"
   │  └─ invited_at: now()
   │
   ├─ Generates invite token (JWT)
   ├─ Sends email with invite link:
   │  └─ yourplatform.com/invite?token=xxxxx
   │
   └─ Invite stored in database

3. TEAM MEMBER RECEIVES EMAIL
   ├─ Subject: "Marco invited you to join Pizzeria Roma"
   ├─ Email body:
   │  ├─ Welcome message
   │  ├─ Restaurant name
   │  ├─ Your role: "Waiter"
   │  └─ [ACCEPT INVITATION] button
   │
   └─ Link expires in 7 days

4. TEAM MEMBER ACCEPTS
   ├─ Clicks [ACCEPT INVITATION]
   ├─ Redirected to: yourplatform.com/invited
   ├─ Page shows:
   │  ├─ Restaurant: Pizzeria Roma
   │  ├─ Your Role: Waiter
   │  ├─ Special permissions listed
   │  └─ [CREATE ACCOUNT] button
   │
   └─ Creates account OR logs in if existing

5. ACCOUNT CREATION (If new user)
   ├─ Form:
   │  ├─ Email (pre-filled from invitation)
   │  ├─ Password
   │  ├─ First Name
   │  ├─ Last Name
   │  └─ [CREATE ACCOUNT]
   │
   ├─ Backend:
   │  ├─ Creates User account
   │  ├─ Updates RestaurantRole:
   │  │  ├─ user_id: (new user id)
   │  │  ├─ status: "accepted"
   │  │  └─ accepted_at: now()
   │  └─ Creates session

6. FIRST LOGIN TO DASHBOARD
   ├─ Redirected to: pizzeria-roma.yourplatform.com/dashboard
   ├─ Middleware checks role
   ├─ Renders WAITER VIEW:
   │  ├─ "Tables" section
   │  ├─ Active orders
   │  ├─ Cannot see: Kitchen, Payments, Inventory
   │  └─ Can do: View orders, add items, mark served
   │
   └─ Welcome message: "You're all set, Luigi!"
```

---

## PART 3: ROLE-BASED ACCESS CONTROL (RBAC)

### 3.1 The Four Roles

```
┌────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                       │
├────────────────────────────────────────────────────────┤
│                                                          │
│  🔑 OWNER (Level 4) ← Highest Access                  │
│   ├─ Full platform access                             │
│   ├─ Can invite/remove team                           │
│   ├─ Views payments & payouts                         │
│   └─ Can change any setting                           │
│                                                          │
│  📊 MANAGER (Level 3) ← Run Operations                │
│   ├─ Views orders & status                            │
│   ├─ Views kitchen dashboard                          │
│   ├─ Manages inventory                                │
│   ├─ Reads reports & analytics                        │
│   └─ Cannot: Access payments, modify settings         │
│                                                          │
│  🍽️ WAITER (Level 2) ← Serve Tables                  │
│   ├─ Views ONLY active orders for their tables        │
│   ├─ Can add items to orders                          │
│   ├─ Can mark tables as served                        │
│   ├─ Sees allergen warnings                           │
│   └─ Cannot: Access kitchen, inventory, payments      │
│                                                          │
│  👨‍🍳 KITCHEN (Level 1) ← Prepare Food              │
│   ├─ Views ONLY kitchen orders                        │
│   ├─ Updates prep status (pending→ready)              │
│   ├─ Sees allergen alerts                             │
│   └─ Cannot: See customers, payments, inventory       │
│                                                          │
└────────────────────────────────────────────────────────┘
```

### 3.2 Permission Matrix (Complete)

```
Feature                  Owner   Manager   Waiter   Kitchen
─────────────────────────────────────────────────────────────
View Dashboard           ✅      ✅        ✅       ✅
View Orders             ✅      ✅        ✅*      ✅**
Update Order Status     ✅      ✅        ✅       ✅
View Kitchen Dashboard  ✅      ✅        ❌       ✅
Manage Menu             ✅      ❌        ❌       ❌
Manage Inventory        ✅      ✅        ❌       ❌
View Payments           ✅      ❌        ❌       ❌
Process Refunds         ✅      ❌        ❌       ❌
View Analytics/Reports  ✅      ✅        ❌       ❌
Invite Team Members     ✅      ❌        ❌       ❌
Change Team Roles       ✅      ❌        ❌       ❌
Edit Settings           ✅      ❌        ❌       ❌
Connect Stripe          ✅      ❌        ❌       ❌

Legend:
✅ = Full access
✅* = Active orders only (their tables)
✅** = Kitchen orders only (pending/preparing)
❌ = No access
```

### 3.3 Database Schema for RBAC

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed
  firstName     String
  lastName      String
  phone         String?
  
  // Many-to-many: User can work at multiple restaurants
  restaurantRoles RestaurantRole[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Restaurant {
  id            String    @id @default(cuid())
  subdomain     String    @unique  // "pizzeria-roma"
  name          String
  
  // Owner relationship
  owner         User      @relation(fields: [ownerId], references: [id])
  ownerId       String
  
  // Team members (Many-to-many through RestaurantRole)
  teamMembers   RestaurantRole[]
  
  // Other data
  menu          MenuItem[]
  orders        Order[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model RestaurantRole {
  id            String    @id @default(cuid())
  
  // Links
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  restaurantId  String
  
  user          User?     @relation(fields: [userId], references: [id])
  userId        String?   // Null until invitation accepted
  
  // Role & Status
  role          String    // "owner" | "manager" | "waiter" | "kitchen"
  status        String    @default("pending")  // "pending" | "accepted" | "revoked"
  
  // Timeline
  invitedAt     DateTime  @default(now())
  acceptedAt    DateTime?
  revokedAt     DateTime?
  
  // Unique: Only one role per user per restaurant
  @@unique([restaurantId, userId])
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model AuditLog {
  id            String    @id @default(cuid())
  
  // Context
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  restaurantId  String
  
  user          User?     @relation(fields: [userId], references: [id])
  userId        String?
  
  // Action details
  action        String    // "order_created", "payment_processed", "team_invited"
  resourceType  String    // "order", "payment", "menu_item"
  resourceId    String
  
  // Additional context
  role          String    // What role did this action
  changes       Json?     // What changed (if update)
  ipAddress     String?
  
  createdAt     DateTime  @default(now())
  
  @@index([restaurantId])
  @@index([action])
}
```

### 3.4 Permission Checking Code

```typescript
// lib/permissions.ts

type Role = 'owner' | 'manager' | 'waiter' | 'kitchen';

const PERMISSIONS: Record<Role, string[]> = {
  owner: [
    'view:dashboard',
    'view:orders',
    'view:kitchen',
    'view:payments',
    'edit:menu',
    'edit:inventory',
    'edit:settings',
    'manage:team',
    'process:payments'
  ],
  
  manager: [
    'view:dashboard',
    'view:orders',
    'view:kitchen',
    'view:inventory',
    'edit:inventory',
    'view:analytics'
  ],
  
  waiter: [
    'view:dashboard',
    'view:orders:own',  // Only active orders
    'update:order:status',
    'add:items'
  ],
  
  kitchen: [
    'view:dashboard',
    'view:orders:kitchen',  // Only kitchen orders
    'update:order:status'
  ]
};

export function hasPermission(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccess(
  role: Role | null,
  requiredRole: Role
): boolean {
  const roleHierarchy: Record<Role, number> = {
    owner: 4,
    manager: 3,
    waiter: 2,
    kitchen: 1
  };
  
  if (!role) return false;
  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

export function getAccessibleRoutes(role: Role): string[] {
  const routes: Record<Role, string[]> = {
    owner: [
      '/dashboard',
      '/dashboard/menu',
      '/dashboard/orders',
      '/dashboard/kitchen',
      '/dashboard/inventory',
      '/dashboard/payments',
      '/dashboard/team',
      '/dashboard/settings'
    ],
    
    manager: [
      '/dashboard',
      '/dashboard/orders',
      '/dashboard/kitchen',
      '/dashboard/inventory',
      '/dashboard/analytics'
    ],
    
    waiter: [
      '/dashboard',
      '/dashboard/tables'  // Custom waiter view
    ],
    
    kitchen: [
      '/dashboard',
      '/dashboard/kitchen'
    ]
  };
  
  return routes[role] || [];
}
```

---

## PART 4: COMPLETE SYSTEM FLOW

### 4.1 Request Flow (With Authentication & Authorization)

```
┌──────────────────────────────────────────────────────┐
│             USER REQUEST FLOW                        │
└──────────────────────────────────────────────────────┘

1. USER REQUEST
   └─ GET https://pizzeria-roma.yourplatform.com/dashboard/orders

2. MIDDLEWARE (middleware.ts)
   ├─ Extract subdomain: "pizzeria-roma"
   ├─ Check if restaurant exists
   ├─ Add to request headers: x-tenant, x-tenant-id
   └─ Pass to Next.js

3. AUTHENTICATION CHECK
   ├─ Get session via getServerSession()
   ├─ If no session → Redirect to /login
   └─ If session exists → Continue

4. AUTHORIZATION CHECK
   ├─ Get user's role for restaurant
   ├─ Check permission for route
   │  └─ waiter: Can access /dashboard/tables? YES
   │  └─ waiter: Can access /dashboard/kitchen? NO
   │
   └─ If no permission → Redirect to /unauthorized

5. DATA FETCHING
   ├─ Query database with tenant filter
   ├─ Always add where clause: where: { restaurantId: x-tenant-id }
   ├─ For waiters: Only active orders, only their tables
   ├─ For kitchen: Only pending/preparing orders
   └─ Returns filtered data

6. RENDER COMPONENT
   ├─ Server component verifies permissions
   ├─ TenantProvider wraps client components
   ├─ Client components use useTenant() hook
   └─ UI renders with correct data

7. RESPONSE
   └─ User sees dashboard with role-appropriate data
```

### 4.2 Order Lifecycle Flow

```
┌─────────────────────────────────────────────────────┐
│          ORDER LIFECYCLE                            │
└─────────────────────────────────────────────────────┘

CUSTOMER SIDE:
1. Customer adds items to cart
2. Selects payment mode:
   ├─ Option A: Pay Online
   │  ├─ Processes payment via Stripe
   │  ├─ Order created with status: PAID
   │  └─ Kitchen immediately starts prep
   │
   └─ Option B: Pay at Counter
      ├─ No payment taken
      ├─ Order created with status: PENDING_PAYMENT
      └─ Kitchen still starts prep

KITCHEN SIDE:
3. Order appears in kitchen dashboard
   ├─ Status: PENDING (new order)
   ├─ Kitchen staff click "Start Prep"
   └─ Status changes to: PREPARING

4. Kitchen prepares food
   ├─ Real-time updates via Socket.io
   ├─ Other kitchen staff see update
   └─ When done → Click "Ready"

5. Order marked READY
   ├─ Status changed in database
   ├─ Emit event via Socket.io
   ├─ Customer's phone notifies: "Your order is ready!"
   └─ Waiter dashboard shows: "Ready to serve"

WAITER SIDE:
6. Waiter collects order from kitchen
   ├─ Takes order to table
   ├─ Marks table as "Served"
   └─ Status: SERVED

PAYMENT VERIFICATION:
7. If PAID online:
   ├─ Payment already processed
   ├─ No payment needed
   └─ Receipt shown

   If PENDING_PAYMENT:
   ├─ Process payment at counter
   ├─ Cash or card
   ├─ Update status: PAID
   └─ Receipt shown

COMPLETION:
8. Order archived
   ├─ Added to history
   ├─ Counted in reports
   ├─ Revenue calculated
   └─ Analytics updated
```

### 4.3 Payment Flow (Dual Mode)

```
┌─────────────────────────────────────────────────────┐
│          PAYMENT PROCESSING                         │
└─────────────────────────────────────────────────────┘

SCENARIO 1: ONLINE PAYMENT (via Stripe)
─────────────────────────────────────────

Customer checkout:
  ├─ Reviews cart: €45.00
  ├─ Clicks [PAY ONLINE]
  └─ Redirected to Stripe Elements

Stripe checkout:
  ├─ Customer enters card details
  ├─ Clicks [Complete Payment]
  └─ Stripe processes transaction

Stripe response:
  ├─ Success: PaymentIntent confirmed
  │  ├─ Stripe sends webhook: payment_intent.succeeded
  │  ├─ Server creates Order with status: PAID
  │  ├─ Server creates Payment record
  │  └─ Emit Socket.io event: new-order
  │
  └─ Error: Payment declined
     ├─ Stripe sends: charge.failed webhook
     ├─ Server logs failure
     └─ Customer shown error message

Kitchen receives order:
  ├─ Order visible in dashboard
  ├─ Badge: "✓ PAID ONLINE"
  └─ Prep begins immediately

Customer notification:
  ├─ Real-time status updates
  ├─ "Order is being prepared..."
  ├─ "Order ready! Come collect."
  └─ No additional payment needed

SCENARIO 2: COUNTER PAYMENT (Cash/Card)
──────────────────────────────────────────

Customer checkout:
  ├─ Reviews cart: €45.00
  ├─ Enters name & table number
  ├─ Clicks [PLACE ORDER]
  └─ NO payment taken

Order creation:
  ├─ Order created with status: PENDING_PAYMENT
  ├─ Badge: "💵 PAY AT COUNTER"
  ├─ Kitchen receives order
  └─ Prep begins immediately

Kitchen receives order:
  ├─ Order visible in dashboard
  ├─ Badge: "💵 PAY AT COUNTER"
  └─ Prep begins immediately

Waiter collects food:
  ├─ Takes order from kitchen
  ├─ Brings to table
  └─ Asks customer for payment

Payment at counter:
  ├─ Customer pays with cash or card
  ├─ Waiter confirms payment
  ├─ Waiter marks order as PAID in app
  ├─ Status: SERVED
  └─ Revenue recorded

PAYMENT RECONCILIATION:
─────────────────────

Stripe integration:
  ├─ Stripe handles: Online payments only
  ├─ Stripe Connect takes commission: 3%
  ├─ Payout to restaurant: 97%
  └─ Scheduled: Daily payouts

Manual payments:
  ├─ Counter payments tracked in database
  ├─ Manual reconciliation needed
  ├─ Recorded in Owner dashboard
  └─ Included in reports

Owner dashboard shows:
  ├─ Total orders: 50
  ├─ Online paid: €800 (Stripe)
  ├─ Counter: €400 (manual)
  ├─ Total revenue: €1,200
  ├─ Stripe takes: €24 (3%)
  ├─ Restaurant receives: €776 + €400 = €1,176
  └─ Next payout: Tomorrow at 14:00
```

---

## PART 5: SYSTEM ARCHITECTURE DIAGRAM

```
┌───────────────────────────────────────────────────────────────┐
│                    COMPLETE ARCHITECTURE                      │
└───────────────────────────────────────────────────────────────┘

EDGE LAYER (Cloudflare/Vercel)
├─ DNS Routing (*.yourplatform.com → Vercel IP)
├─ Global CDN
└─ DDoS Protection

FRONTEND LAYER (Vercel)
├─ Next.js 14 (App Router)
├─ React 18 + TypeScript
├─ TailwindCSS Styling
└─ Client-side state (Zustand/React Query)

MIDDLEWARE LAYER (Next.js Middleware)
├─ Subdomain extraction
├─ Tenant validation
├─ Session verification
└─ Role-based routing

API LAYER (Next.js API Routes)
├─ Authentication (/auth/*)
│  ├─ Login
│  ├─ Register
│  └─ Session management
│
├─ Orders (/api/orders/*)
│  ├─ Create order
│  ├─ Update status
│  ├─ List orders (filtered by role)
│  └─ Get order details
│
├─ Menu (/api/menu/*)
│  ├─ Get items
│  ├─ Edit items
│  ├─ Upload OCR
│  └─ Manage categories
│
├─ Payments (/api/payments/*)
│  ├─ Create Stripe intent
│  ├─ Webhook handler
│  ├─ Refund processing
│  └─ Payment history
│
├─ Team (/api/team/*)
│  ├─ Invite members
│  ├─ Manage roles
│  ├─ Accept invitations
│  └─ Remove members
│
└─ Kitchen (/api/kitchen/*)
   ├─ Get pending orders
   ├─ Update status
   └─ Socket.io events

REAL-TIME LAYER (Socket.io + Redis)
├─ New order notifications
├─ Status update broadcasts
├─ Kitchen dashboard updates
└─ Multi-user sync

DATABASE LAYER (PostgreSQL)
├─ User accounts
├─ Restaurants
├─ RestaurantRole (RBAC)
├─ Menu items
├─ Orders
├─ Payments
├─ Inventory
└─ Audit logs

EXTERNAL SERVICES
├─ Stripe (Payments)
│  ├─ Stripe Connect (Payouts)
│  └─ Webhooks
│
├─ Veryfi (OCR)
│  ├─ Menu image extraction
│  └─ Item recognition
│
├─ SendGrid (Email)
│  ├─ Invitations
│  ├─ Order confirmations
│  └─ Notifications
│
├─ Supabase Storage (Images)
│  ├─ Menu photos
│  ├─ Restaurant logos
│  └─ Order receipts
│
└─ Sentry (Error Tracking)
   └─ Performance monitoring
```

---

## PART 6: SUBDOMAIN MANAGEMENT PROCESS

### 6.1 Creating New Restaurant Subdomain

```typescript
// app/api/auth/register/route.ts

export async function POST(request: Request) {
  const { email, password, firstName, lastName, restaurantName } = await request.json();
  
  // 1. Create Owner account
  const owner = await prisma.owner.create({
    data: {
      email,
      password: bcrypt.hashSync(password, 10),
      firstName,
      lastName
    }
  });
  
  // 2. Generate subdomain (auto or user-provided)
  let subdomain = generateSubdomain(restaurantName);
  
  // 3. Check if subdomain already exists
  while (await prisma.restaurant.findUnique({ where: { subdomain } })) {
    subdomain = generateSubdomain(restaurantName) + Math.random().toString(36).substr(2, 5);
  }
  
  // 4. Create Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurantName,
      subdomain,  // CRITICAL: Must be unique!
      email,
      ownerId: owner.id,
      // Default settings
      currency: 'eur',
      language: 'it',
      timezone: 'Europe/Rome'
    }
  });
  
  // 5. Create RestaurantRole (owner has owner role)
  await prisma.restaurantRole.create({
    data: {
      userId: owner.id,
      restaurantId: restaurant.id,
      role: 'owner',
      status: 'accepted',
      acceptedAt: new Date()
    }
  });
  
  // 6. Create session
  const session = await getServerSession(authOptions);
  
  return NextResponse.json({
    success: true,
    subdomain: restaurant.subdomain,
    restaurantId: restaurant.id,
    dashboardUrl: `https://${subdomain}.yourplatform.com/dashboard`
  });
}

function generateSubdomain(restaurantName: string): string {
  return restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with dash
    .replace(/-+/g, '-')            // Replace multiple dashes with single
    .replace(/^-|-$/g, '');          // Remove leading/trailing dashes
}
```

### 6.2 Validating Subdomain Availability

```typescript
// app/api/subdomain/check/route.ts

export async function POST(request: Request) {
  const { subdomain } = await request.json();
  
  // Validate format
  if (!/^[a-z0-9-]{3,30}$/.test(subdomain)) {
    return NextResponse.json({
      available: false,
      error: 'Invalid format. Use lowercase letters, numbers, and dashes.'
    });
  }
  
  // Check if exists
  const exists = await prisma.restaurant.findUnique({
    where: { subdomain }
  });
  
  if (exists) {
    return NextResponse.json({
      available: false,
      error: 'Subdomain already taken'
    });
  }
  
  return NextResponse.json({
    available: true,
    subdomain
  });
}
```

---

## PART 7: COMPLETE USER TYPES & FLOWS

```
┌────────────────────────────────────────────────────────────┐
│               COMPLETE USER MATRIX                        │
└────────────────────────────────────────────────────────────┘

USER TYPE 1: CUSTOMER (Guest)
├─ Account: NOT REQUIRED
├─ Access: Public menu + checkout
├─ URLs visited:
│  ├─ pizzeria-roma.yourplatform.com (menu)
│  ├─ pizzeria-roma.yourplatform.com/checkout
│  └─ pizzeria-roma.yourplatform.com/order/{id}
├─ Data: Order info (name, email, items, payment)
├─ Permissions: View menu, place order, pay
└─ Session: Order number (no auth needed)

USER TYPE 2: OWNER
├─ Account: REQUIRED
├─ Access: Full platform admin
├─ URLs:
│  ├─ yourplatform.com/login (login)
│  ├─ yourplatform.com/register (signup)
│  ├─ pizzeria-roma.yourplatform.com/dashboard (full)
│  └─ pizzeria-roma.yourplatform.com/dashboard/* (all pages)
├─ Roles: Can be owner of 1+ restaurants
├─ Permissions: Everything
└─ Email: marco@pizzeria.it

USER TYPE 3: MANAGER
├─ Account: REQUIRED (invited by owner)
├─ Access: Operational dashboard (no finances/settings)
├─ URLs:
│  ├─ yourplatform.com/login
│  ├─ pizzeria-roma.yourplatform.com/dashboard
│  ├─ pizzeria-roma.yourplatform.com/dashboard/orders
│  ├─ pizzeria-roma.yourplatform.com/dashboard/kitchen
│  ├─ pizzeria-roma.yourplatform.com/dashboard/inventory
│  └─ pizzeria-roma.yourplatform.com/dashboard/analytics
├─ Invitation: Email from owner
├─ Permissions: View + manage operations
└─ Email: giovanni@pizzeria.it

USER TYPE 4: WAITER
├─ Account: REQUIRED (invited by owner)
├─ Access: Active table orders only
├─ URLs:
│  ├─ yourplatform.com/login
│  └─ pizzeria-roma.yourplatform.com/dashboard (tables view)
├─ Invitation: Email from owner
├─ Permissions: View active orders, add items, mark served
└─ Email: luigi@pizzeria.it

USER TYPE 5: KITCHEN STAFF
├─ Account: REQUIRED (invited by owner)
├─ Access: Kitchen dashboard only
├─ URLs:
│  ├─ yourplatform.com/login
│  └─ pizzeria-roma.yourplatform.com/dashboard (kitchen view)
├─ Invitation: Email from owner
├─ Permissions: Prep orders, update status
└─ Email: giuseppe@pizzeria.it

USER TYPE 6: PLATFORM ADMIN
├─ Account: SPECIAL (manual creation)
├─ Access: All restaurants + admin tools
├─ URLs:
│  └─ admin.yourplatform.com/dashboard
├─ Role: Special "admin" role (not in RestaurantRole)
├─ Permissions: Manage restaurants, users, payments
└─ Email: admin@yourplatform.com
```

---

## PART 8: DOMAIN & SUBDOMAIN STRATEGY

### 8.1 Domain Registration Requirements

```
REQUIRED:
  ✅ Main domain: yourplatform.com (register.it)
  ✅ Wildcard DNS: *.yourplatform.com
  ✅ SSL certificate: Auto-generated by Vercel
  ✅ MX records: For email (optional, depends on email service)

NOT NEEDED:
  ❌ Individual domain for each restaurant
  ❌ Manual subdomains in DNS
  ❌ Multiple SSL certificates
```

### 8.2 Subdomain Naming Convention

```
VALID SUBDOMAINS:
  ✅ pizzeria-roma
  ✅ osteria-milano
  ✅ trattoria-firenze
  ✅ restaurant1
  ✅ cafe-moderno
  ✅ r123

INVALID SUBDOMAINS:
  ❌ Pizzeria Roma (spaces)
  ❌ PIZZA_ROMA (underscores)
  ❌ www (reserved)
  ❌ admin (reserved for platform)
  ❌ api (reserved for API)
  ❌ yourplatform.com (main domain)

RULES:
  - Lowercase letters, numbers, dashes
  - 3-30 characters
  - No spaces, underscores, special chars
  - Must be unique
  - Checked before creation
```

### 8.3 Multi-Restaurant Support

```
SINGLE OWNER, MULTIPLE RESTAURANTS:

Marco's restaurants:
├─ Pizzeria Roma
│  ├─ Subdomain: pizzeria-roma
│  ├─ URL: pizzeria-roma.yourplatform.com
│  └─ Database: restaurant.id = "abc123"
│
├─ Osteria Milano
│  ├─ Subdomain: osteria-milano
│  ├─ URL: osteria-milano.yourplatform.com
│  └─ Database: restaurant.id = "def456"
│
└─ Trattoria Firenze
   ├─ Subdomain: trattoria-firenze
   ├─ URL: trattoria-firenze.yourplatform.com
   └─ Database: restaurant.id = "ghi789"

Owner can switch between:
  pizzeria-roma.yourplatform.com/dashboard
  osteria-milano.yourplatform.com/dashboard
  trattoria-firenze.yourplatform.com/dashboard

Different customers for each, separate orders, separate teams.
```

---

## PART 9: DATA ISOLATION & SECURITY

### 9.1 Tenant Data Isolation

```typescript
// CRITICAL: Every query must include restaurantId filter

// ❌ WRONG - Would leak data between restaurants
const orders = await prisma.order.findMany();

// ✅ CORRECT - Only get this restaurant's orders
const restaurantId = request.headers.get('x-tenant-id');
const orders = await prisma.order.findMany({
  where: { restaurantId }
});

// Same for all entities:
// - Menu items
// - Team members
// - Payments
// - Inventory
// - Audit logs
```

### 9.2 Row-Level Security (Database Level)

```sql
-- PostgreSQL RLS (optional but recommended)

-- Enable RLS on orders table
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- Only restaurant owners can see their orders
CREATE POLICY owner_orders ON "Order"
  FOR SELECT
  USING (
    restaurantId = current_user_setting::uuid
  );

-- Waiters only see active orders
CREATE POLICY waiter_orders ON "Order"
  FOR SELECT
  USING (
    restaurantId = current_user_setting::uuid
    AND status IN ('pending', 'preparing', 'ready')
  );

-- Kitchen staff only see kitchen orders
CREATE POLICY kitchen_orders ON "Order"
  FOR SELECT
  USING (
    restaurantId = current_user_setting::uuid
    AND status IN ('pending', 'preparing')
  );
```

### 9.3 Authentication & Authorization Stack

```
┌─────────────────────────────────────────────────────────┐
│          SECURITY STACK                                 │
└─────────────────────────────────────────────────────────┘

1. PASSWORD HASHING
   ├─ Library: bcryptjs
   ├─ Salt rounds: 10
   ├─ Never store plain text
   └─ Compare with bcrypt.compare()

2. SESSION MANAGEMENT
   ├─ NextAuth.js v5
   ├─ Strategy: JWT
   ├─ Duration: 30 days
   └─ Contains: userId, email, restaurantId(s), role(s)

3. MIDDLEWARE VERIFICATION
   ├─ Every request checked
   ├─ Subdomain validated
   ├─ Session verified
   └─ Role authorized

4. API ROUTE PROTECTION
   ├─ getServerSession() check
   ├─ User permission check
   ├─ Tenant filter in queries
   └─ Return 401/403 if denied

5. ENVIRONMENT VARIABLES
   ├─ NEXTAUTH_SECRET (random, 32+ bytes)
   ├─ DATABASE_URL (encrypted connection)
   ├─ STRIPE_SECRET_KEY (never in client)
   └─ API keys (never exposed to client)

6. HTTPS & TLS
   ├─ Enforced by Vercel
   ├─ Auto-renewing certificates
   ├─ 256-bit encryption
   └─ All traffic encrypted
```

---

## PART 10: DEPLOYMENT & MONITORING

### 10.1 Deployment Architecture

```
Development Environment:
  └─ localhost:3000
     ├─ Local PostgreSQL
     ├─ Stripe test keys
     └─ Mock Veryfi

Staging Environment:
  └─ staging.yourplatform.com
     ├─ Staging database
     ├─ Stripe test keys
     └─ Limited traffic

Production Environment:
  ├─ yourplatform.com
  ├─ *.yourplatform.com (restaurants)
  ├─ Production database (backups every 4 hours)
  ├─ Stripe live keys
  ├─ Real Veryfi API
  └─ Production CDN
```

### 10.2 Monitoring & Observability

```
MONITORING TOOLS:
  ├─ Sentry (Error tracking)
  ├─ LogRocket (Session recording)
  ├─ Vercel Analytics (Performance)
  ├─ Supabase Monitoring (Database)
  └─ Custom dashboards (Orders, revenue)

ALERTS:
  ├─ Payment failures (> 5% failure rate)
  ├─ API errors (> 1% error rate)
  ├─ Database issues (connection errors)
  ├─ High latency (> 2 seconds)
  └─ Security events (failed logins, permission denials)

METRICS:
  ├─ Daily active users (by role)
  ├─ Orders per hour
  ├─ Revenue per day
  ├─ API response time
  ├─ Error rate
  └─ Database query performance
```

---

## SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **Main Domain** | yourplatform.com (register.it) |
| **Restaurant Subdomains** | *.yourplatform.com (wildcard) |
| **Tenant Isolation** | Subdomain-based + database filters |
| **User Types** | Customer, Owner, Manager, Waiter, Kitchen |
| **Roles** | 4 + special admin role |
| **RBAC** | RestaurantRole table (many-to-many) |
| **Authentication** | NextAuth.js + JWT |
| **Authorization** | Middleware + API route checks |
| **Data Isolation** | WHERE restaurantId = x in all queries |
| **Payments** | Stripe (online) + manual (counter) |
| **Real-time** | Socket.io + Redis |
| **Deployment** | Vercel (Edge + Serverless) |
| **Database** | PostgreSQL (Supabase) |
| **Monitoring** | Sentry + LogRocket + Custom |

---

**Now you have the complete system architecture from domains to databases to user flows. Ready to build! 🚀**

