-- Subscription Plans Migration
-- Run this in Supabase SQL Editor

-- Create SubscriptionPlan table
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    regularPrice DECIMAL(10,2) NOT NULL,
    offerPrice DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    billingPeriod VARCHAR(20) DEFAULT 'monthly',
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    isActive BOOLEAN DEFAULT true,
    sortOrder INTEGER DEFAULT 0,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subscription columns to Restaurant
ALTER TABLE "Restaurant"
ADD COLUMN IF NOT EXISTS "subscriptionPlanId" UUID REFERENCES "SubscriptionPlan"(id),
ADD COLUMN IF NOT EXISTS "subscriptionStatus" VARCHAR(20) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP WITH TIME ZONE;

-- Insert default subscription plans
INSERT INTO "SubscriptionPlan" (name, slug, regularPrice, offerPrice, description, features, limits, sortOrder) VALUES
(
    'Starter',
    'starter',
    29.00,
    10.00,
    'Perfect for small restaurants getting started',
    '["AI Menu Scanner", "Up to 50 products", "5 Tables", "QR Code ordering", "Basic analytics"]',
    '{"maxProducts": 50, "maxTables": 5, "aiScansPerMonth": 10}',
    1
),
(
    'Pro',
    'pro',
    60.00,
    29.00,
    'For growing restaurants with advanced needs',
    '["Everything in Starter", "Unlimited products", "25 Tables", "Advanced AI features", "Full analytics", "Priority support"]',
    '{"maxProducts": -1, "maxTables": 25, "aiScansPerMonth": 100}',
    2
),
(
    'Enterprise',
    'enterprise',
    100.00,
    79.00,
    'Complete solution for multi-location restaurants',
    '["Everything in Pro", "Unlimited tables", "Multi-location", "API access", "Dedicated support", "Custom integrations"]',
    '{"maxProducts": -1, "maxTables": -1, "aiScansPerMonth": -1}',
    3
)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE "SubscriptionPlan" ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON "SubscriptionPlan";
CREATE POLICY "Plans are viewable by everyone" ON "SubscriptionPlan"
    FOR SELECT USING (true);
