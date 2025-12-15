-- Migration: Add ratings, reviews, table sessions, and location fields
-- Run this in Supabase SQL Editor

-- Create TableSession table
CREATE TABLE IF NOT EXISTS "TableSession" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL,
  "tableNumber" INTEGER NOT NULL,
  "sessionToken" TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Rating table
CREATE TABLE IF NOT EXISTS "Rating" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "menuItemId" TEXT NOT NULL,
  "orderId" TEXT,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Review table
CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL UNIQUE,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "comment" TEXT,
  "customerName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add location fields to Restaurant (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Restaurant' AND column_name = 'latitude') THEN
    ALTER TABLE "Restaurant" ADD COLUMN "latitude" DOUBLE PRECISION;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Restaurant' AND column_name = 'longitude') THEN
    ALTER TABLE "Restaurant" ADD COLUMN "longitude" DOUBLE PRECISION;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Restaurant' AND column_name = 'locationRadius') THEN
    ALTER TABLE "Restaurant" ADD COLUMN "locationRadius" DOUBLE PRECISION DEFAULT 0.05;
  END IF;
END $$;

-- Add tableSessionId to Order (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Order' AND column_name = 'tableSessionId') THEN
    ALTER TABLE "Order" ADD COLUMN "tableSessionId" TEXT;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "TableSession_restaurantId_tableNumber_idx" 
  ON "TableSession"("restaurantId", "tableNumber");
  
CREATE INDEX IF NOT EXISTS "TableSession_sessionToken_idx" 
  ON "TableSession"("sessionToken");
  
CREATE INDEX IF NOT EXISTS "Rating_menuItemId_idx" 
  ON "Rating"("menuItemId");
  
CREATE INDEX IF NOT EXISTS "Review_restaurantId_idx" 
  ON "Review"("restaurantId");
  
CREATE INDEX IF NOT EXISTS "Review_orderId_idx" 
  ON "Review"("orderId");

-- Add foreign keys (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'TableSession_restaurantId_fkey') THEN
    ALTER TABLE "TableSession" 
    ADD CONSTRAINT "TableSession_restaurantId_fkey" 
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'Rating_menuItemId_fkey') THEN
    ALTER TABLE "Rating" 
    ADD CONSTRAINT "Rating_menuItemId_fkey" 
    FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'Review_restaurantId_fkey') THEN
    ALTER TABLE "Review" 
    ADD CONSTRAINT "Review_restaurantId_fkey" 
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'Review_orderId_fkey') THEN
    ALTER TABLE "Review" 
    ADD CONSTRAINT "Review_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'Order_tableSessionId_fkey') THEN
    ALTER TABLE "Order" 
    ADD CONSTRAINT "Order_tableSessionId_fkey" 
    FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL;
  END IF;
END $$;





