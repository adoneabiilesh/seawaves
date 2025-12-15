# Should You Run SQL for New Features?

## ✅ YES - You Should Run the SQL Migration

The new dashboard features require additional database tables that don't exist yet.

## What New Tables Are Needed?

### 1. **Notification Table** ✅ Required
- Stores real-time notifications for customer actions
- Used by: `NotificationCenter` component
- Tracks: orders, payments, reviews, ratings, table events

### 2. **Schedule Table** ✅ Required  
- Stores working hours schedule
- Used by: `ScheduleManager` component
- Stores: daily hours, breaks, open/close times

### 3. **Addon Table** ✅ Required
- Stores product add-ons/modifications
- Used by: `ProductCustomization` component
- Stores: extra items, modifications with prices

### 4. **OrderItem.menuItemId** ✅ Recommended
- Adds foreign key for better joins
- Improves query performance
- Used by: trending/most-liked queries

## How to Run the Migration

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project

### Step 2: Open SQL Editor
1. Click **SQL Editor** in the left sidebar
2. Click **New query**

### Step 3: Run the Migration
1. Open the file: `SUPABASE_MIGRATION_NEW_FEATURES.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**

### Step 4: Verify Tables Were Created
Go to **Table Editor** and verify you see:
- ✅ `Notification` table
- ✅ `Schedule` table  
- ✅ `Addon` table
- ✅ `OrderItem` has `menuItemId` column

## What Happens If You Don't Run It?

The new features will **not work** because:
- ❌ Notifications won't be saved
- ❌ Schedule won't persist
- ❌ Add-ons won't be stored
- ❌ Some queries may fail

## Migration Order

1. ✅ **First**: Run `SUPABASE_MIGRATION.sql` (if you haven't already)
   - Creates: TableSession, Rating, Review tables
   - Adds location fields to Restaurant
   - Adds tableSessionId to Order

2. ✅ **Second**: Run `SUPABASE_MIGRATION_NEW_FEATURES.sql` (this one)
   - Creates: Notification, Schedule, Addon tables
   - Adds menuItemId to OrderItem

## Safe to Run Multiple Times?

Yes! The migration uses `IF NOT EXISTS` checks, so it's safe to run multiple times. It will:
- Skip creating tables that already exist
- Skip adding columns that already exist
- Only create what's missing

## Summary

**YES, you should run the SQL migration** for the new features to work properly. The migration is safe and idempotent (can be run multiple times).





