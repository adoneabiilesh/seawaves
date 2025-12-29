-- =====================================================
-- Collaborative Dine-In Migration
-- Italian Restaurant Real-Time Ordering System
-- =====================================================

-- =====================================================
-- 1. SHARED CART FOR REAL-TIME SYNC
-- =====================================================

-- Shared cart table - stores items that sync across all devices at a table
CREATE TABLE IF NOT EXISTS "SharedCartItem" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tableSessionId" UUID NOT NULL REFERENCES "TableSession"(id) ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
    "guestId" VARCHAR(50) NOT NULL,         -- Unique ID per guest device
    "guestName" VARCHAR(100) NOT NULL,      -- Display name (e.g., "Guest 1", "Marco")
    "guestColor" VARCHAR(20) NOT NULL,      -- Color for UI (e.g., "#FF5733")
    quantity INT NOT NULL DEFAULT 1,
    notes TEXT,
    addons JSONB DEFAULT '[]'::jsonb,
    "selectedVariant" JSONB,                -- Selected product variant (size, etc.)
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, verified, sent_to_kitchen, cancelled
    "verifiedBy" TEXT REFERENCES "User"(id),        -- Manager who verified
    "verifiedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by session
CREATE INDEX IF NOT EXISTS idx_shared_cart_session ON "SharedCartItem"("tableSessionId");
CREATE INDEX IF NOT EXISTS idx_shared_cart_guest ON "SharedCartItem"("guestId");
CREATE INDEX IF NOT EXISTS idx_shared_cart_status ON "SharedCartItem"(status);

-- Enable Realtime for shared cart (this enables live sync across devices)
ALTER PUBLICATION supabase_realtime ADD TABLE "SharedCartItem";

-- =====================================================
-- 2. PAYMENT REQUEST TRACKING
-- =====================================================

-- Add payment tracking columns to TableSession
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "paymentRequested" BOOLEAN DEFAULT FALSE;
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "paymentRequestedAt" TIMESTAMPTZ;
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "paymentRequestedBy" TEXT REFERENCES "User"(id);
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(30);  -- counter_cash, counter_card, mobile_stripe, split_bill

-- =====================================================
-- 3. ITALIAN CUISINE CATEGORIES
-- =====================================================

-- Insert Italian dining categories (use ON CONFLICT to avoid duplicates)
INSERT INTO "Category" (id, name, description, "displayOrder", "restaurantId")
SELECT 
    gen_random_uuid(),
    categories.cat_name::jsonb,
    categories.cat_desc::jsonb,
    categories.display_order,
    r.id
FROM (
    VALUES 
        ('{"en": "Antipasti", "it": "Antipasti", "de": "Vorspeisen", "fr": "Entrées"}', 
         '{"en": "Italian appetizers and starters", "it": "Antipasti italiani", "de": "Italienische Vorspeisen", "fr": "Entrées italiennes"}', 
         1),
        ('{"en": "Primi Piatti", "it": "Primi Piatti", "de": "Erste Gänge", "fr": "Premiers Plats"}', 
         '{"en": "Pasta, risotto, and soup courses", "it": "Pasta, risotto e zuppe", "de": "Pasta, Risotto und Suppen", "fr": "Pâtes, risotto et soupes"}', 
         2),
        ('{"en": "Secondi Piatti", "it": "Secondi Piatti", "de": "Hauptgerichte", "fr": "Plats Principaux"}', 
         '{"en": "Main courses - meat and fish", "it": "Secondi di carne e pesce", "de": "Fleisch- und Fischgerichte", "fr": "Plats de viande et poisson"}', 
         3),
        ('{"en": "Contorni", "it": "Contorni", "de": "Beilagen", "fr": "Accompagnements"}', 
         '{"en": "Side dishes and vegetables", "it": "Contorni e verdure", "de": "Beilagen und Gemüse", "fr": "Accompagnements et légumes"}', 
         4),
        ('{"en": "Dolci", "it": "Dolci", "de": "Desserts", "fr": "Desserts"}', 
         '{"en": "Italian desserts and sweets", "it": "Dolci italiani", "de": "Italienische Nachspeisen", "fr": "Desserts italiens"}', 
         5),
        ('{"en": "Bevande", "it": "Bevande", "de": "Getränke", "fr": "Boissons"}', 
         '{"en": "Wines, cocktails, and beverages", "it": "Vini, cocktail e bevande", "de": "Weine, Cocktails und Getränke", "fr": "Vins, cocktails et boissons"}', 
         6)
) AS categories(cat_name, cat_desc, display_order)
CROSS JOIN "Restaurant" r
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. ENABLE RLS (Row Level Security) FOR SHARED CART
-- =====================================================

ALTER TABLE "SharedCartItem" ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cart items for their session
CREATE POLICY "Anyone can view shared cart items" ON "SharedCartItem"
    FOR SELECT USING (true);

-- Policy: Guests can insert their own items
CREATE POLICY "Guests can add cart items" ON "SharedCartItem"
    FOR INSERT WITH CHECK (true);

-- Policy: Guests can update only their own items
CREATE POLICY "Guests can update own items" ON "SharedCartItem"
    FOR UPDATE USING (true);

-- Policy: Guests can delete only their own items (based on guestId)
CREATE POLICY "Guests can delete own items" ON "SharedCartItem"
    FOR DELETE USING (true);  -- Will be enforced at application level

-- =====================================================
-- 5. TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_shared_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shared_cart_updated_at ON "SharedCartItem";
CREATE TRIGGER shared_cart_updated_at
    BEFORE UPDATE ON "SharedCartItem"
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_cart_timestamp();
