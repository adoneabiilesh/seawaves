# Quick Fix: Use Raw SQL (No ORM)

## Simplest Solution: Run SQL Directly

Since Prisma is having issues, you can:

### Option 1: Use Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Paste the migration SQL
4. Run it

**Migration SQL for your new tables:**

```sql
-- Create TableSession table
CREATE TABLE IF NOT EXISTS "TableSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "restaurantId" TEXT NOT NULL,
  "tableNumber" INTEGER NOT NULL,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Rating table
CREATE TABLE IF NOT EXISTS "Rating" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "menuItemId" TEXT NOT NULL,
  "orderId" TEXT,
  "rating" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Review table
CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "restaurantId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL UNIQUE,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "customerName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add location fields to Restaurant
ALTER TABLE "Restaurant" 
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "locationRadius" DOUBLE PRECISION DEFAULT 0.05;

-- Add tableSessionId to Order
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "tableSessionId" TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS "TableSession_restaurantId_tableNumber_idx" ON "TableSession"("restaurantId", "tableNumber");
CREATE INDEX IF NOT EXISTS "TableSession_sessionToken_idx" ON "TableSession"("sessionToken");
CREATE INDEX IF NOT EXISTS "Rating_menuItemId_idx" ON "Rating"("menuItemId");
CREATE INDEX IF NOT EXISTS "Review_restaurantId_idx" ON "Review"("restaurantId");
CREATE INDEX IF NOT EXISTS "Review_orderId_idx" ON "Review"("orderId");

-- Add foreign keys
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_restaurantId_fkey" 
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;

ALTER TABLE "Rating" ADD CONSTRAINT "Rating_menuItemId_fkey" 
  FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE;

ALTER TABLE "Review" ADD CONSTRAINT "Review_restaurantId_fkey" 
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;

ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" 
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_tableSessionId_fkey" 
  FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL;
```

### Option 2: Use Postgres Client Directly

Install:
```bash
npm install postgres
```

Use in your code:
```typescript
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// Run queries
const users = await sql`SELECT * FROM "User" WHERE id = ${userId}`;
```

## This is the Fastest Solution!

No ORM needed. Just:
1. Run SQL in Supabase dashboard
2. Use `postgres` package for queries
3. Done!





