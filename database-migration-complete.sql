-- CLEAN DATABASE MIGRATION
-- WARNING: This will DELETE ALL existing data
-- Only run this if you want to start fresh

-- Step 1: Drop all existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Table" CASCADE;
DROP TABLE IF EXISTS "Addon" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "RestaurantRole" CASCADE;
DROP TABLE IF EXISTS "Owner" CASCADE;
DROP TABLE IF EXISTS "Restaurant" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- Step 2: Create ENUM types
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'waiter', 'kitchen');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Step 3: Create tables
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Restaurant" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    "logoUrl" TEXT,
    address TEXT,
    phone VARCHAR(50),
    currency VARCHAR(10) DEFAULT '$',
    "taxRate" DECIMAL(5,2) DEFAULT 10.00,
    "openingHours" VARCHAR(100),
    "stripeAccountId" VARCHAR(255),
    "stripeConnected" BOOLEAN DEFAULT FALSE,
    "commissionRate" DECIMAL(5,4) DEFAULT 0.03,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Owner" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "restaurantId")
);

CREATE TABLE "RestaurantRole" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    status VARCHAR(20) DEFAULT 'accepted',
    "invitedBy" TEXT REFERENCES "User"(id),
    "invitedAt" TIMESTAMP,
    "acceptedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "restaurantId")
);

CREATE TABLE "Session" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Category" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    description JSONB,
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Product" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "categoryId" TEXT REFERENCES "Category"(id) ON DELETE SET NULL,
    name JSONB NOT NULL,
    description JSONB,
    recipe JSONB,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    "imageUrl" TEXT,
    nutrition JSONB,
    allergens TEXT[],
    ingredients TEXT[],
    stock INTEGER DEFAULT 0,
    "isAiGenerated" BOOLEAN DEFAULT FALSE,
    available BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Table" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "tableNumber" INTEGER NOT NULL,
    capacity INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available',
    "qrCode" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("restaurantId", "tableNumber")
);

CREATE TABLE "Order" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "tableId" TEXT REFERENCES "Table"(id) ON DELETE SET NULL,
    "tableNumber" INTEGER,
    "customerName" VARCHAR(255),
    status order_status DEFAULT 'pending',
    "paymentMode" VARCHAR(20) DEFAULT 'counter',
    "specialRequests" TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "preparedAt" TIMESTAMP,
    "deliveredAt" TIMESTAMP
);

CREATE TABLE "OrderItem" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    customizations JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Payment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "orderId" TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
    "stripePaymentId" VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'usd',
    "platformFee" DECIMAL(10,2) DEFAULT 0,
    "restaurantPayout" DECIMAL(10,2),
    "paymentMethod" VARCHAR(50),
    status payment_status DEFAULT 'pending',
    "refundAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    "resourceType" VARCHAR(50),
    "resourceId" VARCHAR(255),
    changes JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Addon" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create Indexes
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_restaurant_subdomain ON "Restaurant"(subdomain);
CREATE INDEX idx_owner_user ON "Owner"("userId");
CREATE INDEX idx_owner_restaurant ON "Owner"("restaurantId");
CREATE INDEX idx_role_user ON "RestaurantRole"("userId");
CREATE INDEX idx_role_restaurant ON "RestaurantRole"("restaurantId");
CREATE INDEX idx_product_restaurant ON "Product"("restaurantId");
CREATE INDEX idx_order_restaurant ON "Order"("restaurantId");
CREATE INDEX idx_order_status ON "Order"(status);
CREATE INDEX idx_payment_order ON "Payment"("orderId");
CREATE INDEX idx_audit_restaurant ON "AuditLog"("restaurantId");

-- Step 5: Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_updated_at BEFORE UPDATE ON "Restaurant"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_updated_at BEFORE UPDATE ON "Product"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_updated_at BEFORE UPDATE ON "Order"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON "Payment"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable RLS and create policies
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Restaurant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RestaurantRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Allow all access for service role (for API calls)
CREATE POLICY "Service role has full access to User" ON "User" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Restaurant" ON "Restaurant" FOR ALL USING (true);
CREATE POLICY "Service role has full access to RestaurantRole" ON "RestaurantRole" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Product" ON "Product" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Order" ON "Order" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Payment" ON "Payment" FOR ALL USING (true);

-- Step 7: Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Success!
SELECT 'Database migration completed successfully!' as message;
