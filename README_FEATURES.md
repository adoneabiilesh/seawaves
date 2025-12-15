# New Features Implementation Guide

This document describes the new features that have been added to the restaurant ordering system.

## Features Implemented

### 1. Food Ratings and Reviews
- **Rating System**: Customers can rate individual menu items (1-5 stars) after placing an order
- **Review System**: Customers can leave overall reviews for their order experience
- **Components**: 
  - `ReviewModal.tsx` - Modal that appears after checkout for rating/reviewing
  - API endpoints: `/api/ratings/create` and `/api/reviews/create`

### 2. Trending and Most Liked Food Recommendations
- **Trending Items**: Shows items based on recent orders and ratings (last 30 days)
- **Most Liked Items**: Displays highest-rated items by customers
- **Display**: Featured sections in the menu page with visual indicators
- **API Endpoints**: 
  - `/api/menu/trending?restaurantId={id}&limit={n}`
  - `/api/menu/most-liked?restaurantId={id}&limit={n}`

### 3. Multiple Payment Methods
- **Payment Options**: 
  - Card (Credit/Debit)
  - Cash
  - Apple Pay
  - Google Pay
  - PayPal
  - Venmo
  - Zelle
- **UI**: Updated `CartDrawer.tsx` with grid layout for payment method selection

### 4. Table Session Management
- **New Session Per Table**: Each table visit creates a new session
- **Session Tracking**: Sessions are tracked and can be ended when customers leave
- **Components**: 
  - `hooks/useTableSession.ts` - Hook for managing table sessions
- **API Endpoints**:
  - `POST /api/table-sessions/create` - Create new session
  - `GET /api/table-sessions/[sessionToken]` - Get session details
  - `PATCH /api/table-sessions/[sessionToken]` - Update session (end session)

### 5. Location-Based Access Control
- **Geofencing**: Website only accessible within restaurant's location radius
- **Component**: `LocationGuard.tsx` - Wraps menu page to verify location
- **API Endpoint**: `POST /api/location/verify` - Verifies user's location
- **Configuration**: Restaurant can set latitude, longitude, and radius in database

## Database Schema Updates

### New Tables
1. **TableSession**: Tracks table sessions
   - `sessionToken` - Unique token for session
   - `tableNumber` - Table number
   - `isActive` - Whether session is active
   - `startedAt`, `endedAt` - Session timestamps

2. **Rating**: Individual menu item ratings
   - `menuItemId` - Reference to menu item
   - `orderId` - Optional reference to order
   - `rating` - 1-5 star rating

3. **Review**: Order reviews
   - `restaurantId` - Restaurant reference
   - `orderId` - Order reference (unique)
   - `rating` - Overall rating
   - `comment` - Review text
   - `customerName` - Optional customer name

### Updated Tables
- **Restaurant**: Added location fields
  - `latitude`, `longitude` - Restaurant coordinates
  - `locationRadius` - Access radius in kilometers (default 0.05 = 50 meters)

- **Order**: Added table session reference
  - `tableSessionId` - Optional reference to table session

- **MenuItem**: Added ratings relation
  - `ratings` - One-to-many relation with Rating

## Setup Instructions

### 1. Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name add_ratings_reviews_sessions_location
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Ensure your `.env` file has:
```
DATABASE_URL="your_postgresql_connection_string"
```

### 4. Configure Restaurant Location
Update the restaurant record in the database with location coordinates:
```sql
UPDATE "Restaurant" 
SET latitude = 40.7128, 
    longitude = -74.0060, 
    locationRadius = 0.05 
WHERE id = 'your-restaurant-id';
```

## Usage

### For Customers
1. **Access Menu**: Location is verified automatically when accessing the menu
2. **Place Order**: Select items, customize, and choose payment method
3. **Rate & Review**: After payment, a review modal appears automatically
4. **View Recommendations**: See trending and most-liked items on the menu page

### For Restaurant Owners
1. **Set Location**: Configure restaurant coordinates in settings
2. **View Reviews**: Access reviews through admin dashboard (to be implemented)
3. **Track Sessions**: Monitor table sessions for analytics

## API Usage Examples

### Create Table Session
```javascript
POST /api/table-sessions/create
{
  "restaurantId": "rest-123",
  "tableNumber": 5
}
```

### Verify Location
```javascript
POST /api/location/verify
{
  "restaurantId": "rest-123",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Submit Rating
```javascript
POST /api/ratings/create
{
  "menuItemId": "item-123",
  "orderId": "order-456",
  "rating": 5
}
```

### Submit Review
```javascript
POST /api/reviews/create
{
  "restaurantId": "rest-123",
  "orderId": "order-456",
  "rating": 5,
  "comment": "Great food!",
  "customerName": "John Doe"
}
```

## Notes

- The location verification gracefully falls back to allowing access if geolocation is not supported or denied
- Table sessions are stored in localStorage for persistence across page refreshes
- Trending score calculation: (average rating × 0.6) + (normalized recent orders × 0.4)
- Payment methods are displayed in a grid for easy selection
- Review modal appears 500ms after successful checkout for better UX

## Future Enhancements

- Admin dashboard for viewing reviews and ratings
- Analytics dashboard for trending items
- Push notifications for new reviews
- Email notifications for review submissions
- Review moderation features
- Advanced session analytics





