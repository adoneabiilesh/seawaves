-- Enable public read access for Menu related tables
-- This ensures unauthenticated customers can see the menu

-- Product
DROP POLICY IF EXISTS "Public read access for Product" ON "Product";
CREATE POLICY "Public read access for Product" ON "Product" FOR SELECT USING (true);

-- Category
DROP POLICY IF EXISTS "Public read access for Category" ON "Category";
CREATE POLICY "Public read access for Category" ON "Category" FOR SELECT USING (true);

-- Restaurant
DROP POLICY IF EXISTS "Public read access for Restaurant" ON "Restaurant";
CREATE POLICY "Public read access for Restaurant" ON "Restaurant" FOR SELECT USING (true);

-- Table
DROP POLICY IF EXISTS "Public read access for Table" ON "Table";
CREATE POLICY "Public read access for Table" ON "Table" FOR SELECT USING (true);

-- Addon
DROP POLICY IF EXISTS "Public read access for Addon" ON "Addon";
CREATE POLICY "Public read access for Addon" ON "Addon" FOR SELECT USING (true);

-- Owner (Only owners can see owner data, but public doesn't need this)
-- RestaurantRole (Public doesn't need this)

-- Fix Order Permissions (Anyone can create an order)
DROP POLICY IF EXISTS "Public insert access for Order" ON "Order";
CREATE POLICY "Public insert access for Order" ON "Order" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert access for OrderItem" ON "OrderItem";
CREATE POLICY "Public insert access for OrderItem" ON "OrderItem" FOR INSERT WITH CHECK (true);

-- Allow reading own orders (simplified for demo, normally cookie/session based)
DROP POLICY IF EXISTS "Public read access for Order by ID" ON "Order";
CREATE POLICY "Public read access for Order by ID" ON "Order" FOR SELECT USING (true);
