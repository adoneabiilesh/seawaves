-- Table Sessions Migration - CLEAN VERSION
-- Run this in Supabase SQL Editor

-- Step 1: Drop the old table if it exists (CLEAN START)
DROP TABLE IF EXISTS "TableSession" CASCADE;

-- Step 2: Create fresh TableSession table (restaurantId as TEXT to match Restaurant.id)
CREATE TABLE "TableSession" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "restaurantId" TEXT REFERENCES "Restaurant"(id) ON DELETE CASCADE,
  "tableNumber" INT NOT NULL,
  "sessionToken" VARCHAR(32) UNIQUE NOT NULL,
  "sessionStatus" VARCHAR(20) DEFAULT 'active',
  "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "closedAt" TIMESTAMP WITH TIME ZONE,
  "totalAmount" DECIMAL(10,2) DEFAULT 0,
  "paidAmount" DECIMAL(10,2) DEFAULT 0,
  "guestCount" INT DEFAULT 1,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add indexes
CREATE INDEX idx_table_session_restaurant ON "TableSession"("restaurantId");
CREATE INDEX idx_table_session_token ON "TableSession"("sessionToken");
CREATE INDEX idx_table_session_status ON "TableSession"("sessionStatus");

-- Step 4: Add tableSessionId to Order table (if not exists)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "tableSessionId" UUID REFERENCES "TableSession"(id);
CREATE INDEX IF NOT EXISTS idx_order_session ON "Order"("tableSessionId");

-- Step 5: Enable RLS and create policies
ALTER TABLE "TableSession" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage table sessions" ON "TableSession"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view sessions" ON "TableSession"
  FOR SELECT USING (true);

-- Step 6: Grant permissions
GRANT ALL ON "TableSession" TO authenticated;
GRANT SELECT ON "TableSession" TO anon;

-- Step 7: Create trigger function
CREATE OR REPLACE FUNCTION update_session_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."tableSessionId" IS NOT NULL THEN
    UPDATE "TableSession"
    SET "totalAmount" = "totalAmount" + COALESCE(NEW.total, 0),
        "updatedAt" = NOW()
    WHERE id = NEW."tableSessionId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_session_total_trigger ON "Order";
CREATE TRIGGER order_session_total_trigger
  AFTER INSERT ON "Order"
  FOR EACH ROW
  EXECUTE FUNCTION update_session_total();
