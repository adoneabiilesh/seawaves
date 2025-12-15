-- Migration: Add tables for new dashboard features
-- Run this in Supabase SQL Editor after the initial migration

-- Create Notification table for real-time customer action notifications
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL,
  "type" TEXT NOT NULL CHECK ("type" IN ('order', 'payment', 'review', 'rating', 'table', 'customer')),
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "orderId" TEXT,
  "tableNumber" INTEGER,
  "metadata" JSONB,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE
);

-- Create Schedule table for working hours
CREATE TABLE IF NOT EXISTS "Schedule" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL UNIQUE,
  "schedule" JSONB NOT NULL, -- Stores array of ScheduleDay objects
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Schedule_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE
);

-- Create Addon table for product add-ons/modifications
CREATE TABLE IF NOT EXISTS "Addon" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "category" TEXT,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Addon_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE
);

-- Note: MenuCategory table already exists from initial migration
-- We can use it for categories, but if you want custom categories separate from menu categories:
-- CREATE TABLE IF NOT EXISTS "CustomCategory" (
--   "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
--   "restaurantId" TEXT NOT NULL,
--   "name" TEXT NOT NULL,
--   "description" TEXT,
--   "displayOrder" INTEGER NOT NULL DEFAULT 0,
--   "available" BOOLEAN NOT NULL DEFAULT true,
--   "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT "CustomCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE
-- );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Notification_restaurantId_idx" ON "Notification"("restaurantId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type");

CREATE INDEX IF NOT EXISTS "Addon_restaurantId_idx" ON "Addon"("restaurantId");
CREATE INDEX IF NOT EXISTS "Addon_available_idx" ON "Addon"("available");

-- Add menuItemId to OrderItem if it doesn't exist (for better joins)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'OrderItem' AND column_name = 'menuItemId') THEN
    ALTER TABLE "OrderItem" ADD COLUMN "menuItemId" TEXT;
    ALTER TABLE "OrderItem" 
    ADD CONSTRAINT "OrderItem_menuItemId_fkey" 
    FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for OrderItem menuItemId
CREATE INDEX IF NOT EXISTS "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");





