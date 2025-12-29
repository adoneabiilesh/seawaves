-- Fix Orders RLS (Safe version - handles existing policies)
-- Run this in Supabase SQL Editor

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Anyone can insert orders" ON "Order";
DROP POLICY IF EXISTS "Anyone can view orders" ON "Order";
DROP POLICY IF EXISTS "Anyone can update orders" ON "Order";
DROP POLICY IF EXISTS "Anyone can insert order items" ON "OrderItem";
DROP POLICY IF EXISTS "Anyone can view order items" ON "OrderItem";

-- Enable RLS
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

-- Create policies for Order
CREATE POLICY "Anyone can insert orders" ON "Order"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view orders" ON "Order"
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update orders" ON "Order"
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create policies for OrderItem
CREATE POLICY "Anyone can insert order items" ON "OrderItem"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view order items" ON "OrderItem"
  FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON "Order" TO anon, authenticated;
GRANT SELECT, INSERT ON "OrderItem" TO anon, authenticated;
