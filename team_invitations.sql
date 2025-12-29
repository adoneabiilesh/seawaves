-- Team Invitation Columns Migration
-- Run this in Supabase SQL Editor

-- Add invitation columns to RestaurantRole table
ALTER TABLE "RestaurantRole"
ADD COLUMN IF NOT EXISTS "invitedEmail" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "invitedBy" UUID REFERENCES "User"(id),
ADD COLUMN IF NOT EXISTS "inviteToken" TEXT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update status column to include 'pending' if not already
-- (status should allow: pending, accepted, rejected, inactive)
