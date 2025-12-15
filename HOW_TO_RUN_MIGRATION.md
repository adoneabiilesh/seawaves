# How to Run Migration in Supabase SQL Editor

## Step-by-Step Instructions

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project

### Step 2: Open SQL Editor
1. Click on **SQL Editor** in the left sidebar
2. Click **New query**

### Step 3: Copy and Paste Migration
1. Open the file `SUPABASE_MIGRATION.sql` in your project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor

### Step 4: Run the Migration
1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for it to complete
3. You should see "Migration completed successfully!" message

### Step 5: Verify Tables Were Created
1. Go to **Table Editor** in Supabase
2. You should see these new tables:
   - `TableSession`
   - `Rating`
   - `Review`
3. Check that `Restaurant` table has new columns:
   - `latitude`
   - `longitude`
   - `locationRadius`
4. Check that `Order` table has new column:
   - `tableSessionId`

## What This Migration Does

✅ Creates `TableSession` table for tracking table sessions  
✅ Creates `Rating` table for menu item ratings  
✅ Creates `Review` table for order reviews  
✅ Adds location fields to `Restaurant` table  
✅ Adds `tableSessionId` to `Order` table  
✅ Creates indexes for better performance  
✅ Sets up foreign key relationships  

## After Migration

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Test the API:**
   - All API routes now use raw SQL instead of Prisma
   - No more connection issues!

3. **You're done!** 🎉

## Troubleshooting

If you get errors:
- Make sure you're running it in the correct database
- Check that existing tables (`Restaurant`, `MenuItem`, `Order`) exist
- The migration uses `IF NOT EXISTS` so it's safe to run multiple times





