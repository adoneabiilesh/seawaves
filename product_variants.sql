-- Product Variants Migration
-- Run this in Supabase SQL Editor to add product variants support
-- This allows products to have size options like 33ml/66ml, Small/Medium/Large

-- Add variants column to Product table (JSONB for flexibility)
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';

-- Example of how variants data looks:
-- [
--   { "id": "v1", "name": "33ml", "priceModifier": 0, "isDefault": true, "available": true },
--   { "id": "v2", "name": "66ml", "priceModifier": 1.50, "isDefault": false, "available": true }
-- ]

-- Add selectedVariant to OrderItem to track which variant was ordered
ALTER TABLE "OrderItem"
ADD COLUMN IF NOT EXISTS "selectedVariant" JSONB DEFAULT NULL;

-- Comment explaining the variants structure
COMMENT ON COLUMN "Product".variants IS 'Product variants for size options. Array of {id, name, priceModifier, isDefault, available}';
COMMENT ON COLUMN "OrderItem"."selectedVariant" IS 'The variant selected when this item was ordered. Contains {id, name, priceModifier}';
