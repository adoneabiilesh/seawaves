# Restaurant SaaS Platform - Complete API Documentation

## Base URL
- Production: `https://yourplatform.com`
- Restaurant subdomain: `https://{subdomain}.yourplatform.com`

## Authentication
All protected endpoints require NextAuth session cookie.

---

## Authentication Endpoints

### Register Owner
**POST** `/api/auth/register`

Creates new restaurant owner account with subdomain.

**Request Body:**
```json
{
  "email": "owner@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "restaurantName": "Pizzeria Roma"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "owner@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "restaurant": {
    "id": "rest_123",
    "name": "Pizzeria Roma",
    "subdomain": "pizzeria-roma"
  },
  "dashboardUrl": "https://pizzeria-roma.yourplatform.com/dashboard"
}
```

---

## Team Management Endpoints

### Invite Team Member
**POST** `/api/team/invite`

**Auth Required:** Owner only

**Request Body:**
```json
{
  "email": "waiter@example.com",
  "role": "waiter",
  "restaurantId": "rest_123"
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "inv_123",
    "email": "waiter@example.com",
    "role": "waiter",
    "inviteUrl": "https://yourplatform.com/invite?token=eyJhbGc..."
  }
}
```

### Accept Invitation
**POST** `/api/team/accept`

**Request Body:**
```json
{
  "token": "eyJhbGc...",
  "password": "NewPassword123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation accepted successfully"
}
```

### List Team Members
**GET** `/api/team/list?restaurantId=rest_123`

**Auth Required:** Owner only

**Response:**
```json
{
  "success": true,
  "teamMembers": [
    {
      "id": "role_123",
      "userId": "user_456",
      "email": "waiter@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "waiter",
      "status": "accepted",
      "invitedAt": "2025-12-16T00:00:00Z",
      "acceptedAt": "2025-12-16T01:00:00Z"
    }
  ]
}
```

---

## Order Management Endpoints

### Create Order
**POST** `/api/orders/create`

**Request Body:**
```json
{
  "restaurantId": "rest_123",
  "customerName": "Customer Name",
  "customerEmail": "customer@example.com",
  "tableNumber": "5",
  "paymentMode": "online",
  "specialRequests": "No onions",
  "items": [
    {
      "id": "item_1",
      "name": "Margherita Pizza",
      "price": 12.99,
      "quantity": 2,
      "modifiers": ["Extra cheese"],
      "specialRequest": "Well done"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "orderNumber": "ORD-1734307200-ABC12",
    "totalPrice": 25.98,
    "status": "pending",
    "estimatedPrepTime": 30
  }
}
```

### List Orders
**GET** `/api/orders/list?restaurantId=rest_123`

**Auth Required:** Yes (role-based filtering applied)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order_123",
      "orderNumber": "ORD-1734307200-ABC12",
      "customerName": "Customer Name",
      "tableNumber": "5",
      "totalPrice": 25.98,
      "status": "preparing",
      "paymentMode": "online",
      "createdAt": "2025-12-16T03:00:00Z",
      "OrderItem": [
        {
          "menuItemName": "Margherita Pizza",
          "quantity": 2,
          "price": 12.99
        }
      ]
    }
  ],
  "userRole": "waiter"
}
```

### Update Order Status
**POST** `/api/orders/update-status`

**Auth Required:** Yes

**Request Body:**
```json
{
  "orderId": "order_123",
  "status": "ready",
  "restaurantId": "rest_123",
  "previousStatus": "preparing"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "status": "ready",
    "readyAt": "2025-12-16T03:30:00Z"
  }
}
```

---

## Payment Endpoints

### Create Payment Intent
**POST** `/api/payments/create-intent`

**Auth Required:** Yes

**Request Body:**
```json
{
  "orderId": "order_123",
  "amount": 25.98,
  "currency": "eur",
  "restaurantId": "rest_123"
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentId": "payment_123"
}
```

### Stripe Webhook
**POST** `/api/payments/webhook`

**Headers Required:**
- `stripe-signature`: Webhook signature from Stripe

**Handles Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## Stripe Connect Endpoints

### Create Connect Onboarding Link
**POST** `/api/stripe/connect`

**Auth Required:** Owner only

**Request Body:**
```json
{
  "restaurantId": "rest_123"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/..."
}
```

---

## Utility Endpoints

### Check Subdomain Availability
**POST** `/api/subdomain/check`

**Request Body:**
```json
{
  "subdomain": "pizzeria-roma"
}
```

**Response:**
```json
{
  "available": true,
  "subdomain": "pizzeria-roma"
}
```

**Error Response:**
```json
{
  "available": false,
  "error": "Subdomain already taken"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- 100 requests/minute per IP for public endpoints
- 1000 requests/minute for authenticated endpoints

---

## Webhooks

### Stripe Webhook Configuration

**Endpoint:** `https://yourplatform.com/api/payments/webhook`

**Events to Subscribe:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

**Signature Verification:** Required via `STRIPE_WEBHOOK_SECRET`

---

## Role-Based Filtering

### Order List Filtering by Role:

- **Owner/Manager:** See all orders
- **Waiter:** See only active orders (pending, preparing, ready)
- **Kitchen:** See only kitchen orders (pending, preparing)

### Permission Checks:

All endpoints verify user has appropriate role before allowing access.
