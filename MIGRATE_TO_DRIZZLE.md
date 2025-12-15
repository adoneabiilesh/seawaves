# Migrate from Prisma to Drizzle ORM

## Quick Migration Guide

### Step 1: Install Drizzle

```bash
npm install drizzle-orm drizzle-kit postgres
npm install -D @types/pg
```

### Step 2: Create Database Connection

Create `lib/db.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Disable prepared statements for Supabase pooler
const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client, { schema });
```

### Step 3: Convert Schema

Create `lib/schema.ts` from your Prisma schema:
```typescript
import { pgTable, text, integer, boolean, timestamp, jsonb, doublePrecision } from 'drizzle-orm/pg-core';

export const restaurants = pgTable('Restaurant', {
  id: text('id').primaryKey(),
  subdomain: text('subdomain').notNull().unique(),
  name: text('name').notNull(),
  // ... other fields
});

export const menuItems = pgTable('MenuItem', {
  id: text('id').primaryKey(),
  restaurantId: text('restaurantId').notNull(),
  // ... other fields
});

// ... rest of your tables
```

### Step 4: Setup Migrations

Create `drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Step 5: Generate and Run Migrations

```bash
# Generate migration from schema
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate
```

### Step 6: Update Your Code

Replace Prisma calls:
```typescript
// Before (Prisma)
const user = await prisma.user.findUnique({ where: { id } });

// After (Drizzle)
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
```

## Benefits

- ✅ No connection pooling issues
- ✅ Faster queries
- ✅ Better TypeScript inference
- ✅ Simpler migrations
- ✅ Works perfectly with Supabase





