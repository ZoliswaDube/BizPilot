# Supabase CLI Guide

## Overview

This guide explains how to use the Supabase CLI to manage your database schema and migrations via command line. The setup includes PowerShell scripts for easy migration management.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a project in the Supabase dashboard
3. **Node.js & npm**: Already installed for the project
4. **PowerShell**: Pre-installed on Windows

## Initial Setup

### Step 1: Install Supabase CLI

The CLI is already installed as a dev dependency. Verify installation:

```powershell
npm run supabase:login
```

This will open a browser window for authentication.

### Step 2: Get Your Credentials

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project Ref/ID** (e.g., `xxxxx` - the subdomain part)
   - **anon public key**
5. Go to **Settings** → **Database**
   - Copy the **Database Password** (or reset it if you don't have it)

### Step 3: Generate Access Token

1. Go to https://app.supabase.com/account/tokens
2. Click **Generate new token**
3. Give it a name (e.g., "BizPilot CLI")
4. Copy the token (you won't see it again!)

### Step 4: Configure Environment Variables

Update your `.env` file with the credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase CLI Configuration
SUPABASE_ACCESS_TOKEN=your_access_token_here
SUPABASE_PROJECT_ID=xxxxx
SUPABASE_DB_PASSWORD=your_database_password
```

⚠️ **Important**: Never commit your `.env` file to git!

### Step 5: Link to Your Project

```powershell
npm run supabase:link
```

Or manually:

```powershell
npx supabase link --project-ref YOUR_PROJECT_ID
```

## Usage

### Creating a New Migration

To create a new SQL migration file:

```powershell
npm run supabase:new-migration -- -Name create_products_table
```

Or use the script directly:

```powershell
.\scripts\supabase-create-migration.ps1 -Name create_products_table
```

This creates a timestamped file: `supabase/migrations/20241029120000_create_products_table.sql`

**Migration naming conventions:**
- Use lowercase
- Use underscores (no spaces or hyphens)
- Be descriptive
- Examples:
  - `create_users_table`
  - `add_email_to_customers`
  - `update_inventory_constraints`

### Writing Migration SQL

Edit the generated migration file:

```sql
-- Migration: create_products_table
-- Created: 2024-10-29 12:00:00
-- Description: Create products table with basic fields

-- ============================================
-- UP Migration
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_products_business_id ON products(business_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view products from their business"
  ON products FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================

-- DROP TABLE IF EXISTS products CASCADE;
-- DROP INDEX IF EXISTS idx_products_business_id;
```

### Pushing Migrations to Supabase

#### Dry Run (Preview Changes)

```powershell
.\scripts\supabase-push-migrations.ps1 -DryRun
```

#### Push Migrations

```powershell
npm run supabase:push
```

Or:

```powershell
.\scripts\supabase-push-migrations.ps1
```

#### Force Push (Overwrite Remote Changes)

⚠️ **Warning**: This will overwrite any changes made directly in the database!

```powershell
.\scripts\supabase-push-migrations.ps1 -Force
```

### Pulling Current Schema

To pull the current database schema from your remote Supabase project:

```powershell
npm run supabase:pull
```

Or:

```powershell
.\scripts\supabase-pull-schema.ps1
```

This creates a `supabase/schema.sql` file with your current database structure.

### Checking Migration Status

To see the difference between your local migrations and remote database:

```powershell
npm run supabase:status
```

Or:

```powershell
npx supabase db diff
```

### Local Development & Testing

#### Reset Local Database

To reset your local database to match migrations:

```powershell
npm run supabase:reset
```

This will:
1. Drop the local database
2. Recreate it
3. Run all migrations in order

## Available NPM Scripts

### Migration Commands

| Command | Description |
|---------|-------------|
| `npm run supabase:login` | Authenticate with Supabase |
| `npm run supabase:link` | Link to your Supabase project |
| `npm run supabase:new-migration` | Create a new migration file |
| `npm run supabase:push` | Push migrations to remote database |
| `npm run supabase:pull` | Pull current schema from remote |
| `npm run supabase:status` | Check migration status/diff |
| `npm run supabase:reset` | Reset local database |

### Seeding Commands

| Command | Description |
|---------|-------------|
| `npm run db:seed` | Seed remote database (production) |
| `npm run db:seed:local` | Seed local database (development) |
| `npm run db:create-seed` | Create a new seed SQL file |

**See [DATABASE_SEEDING.md](./DATABASE_SEEDING.md) for complete seeding guide.**

## Migration Best Practices

### 1. Use Transactions

Wrap your migrations in transactions for atomicity:

```sql
BEGIN;

-- Your migration code here

COMMIT;
```

### 2. Make Migrations Idempotent

Use `IF EXISTS` and `IF NOT EXISTS`:

```sql
CREATE TABLE IF NOT EXISTS users (...);
DROP TABLE IF EXISTS old_table;
ALTER TABLE products ADD COLUMN IF NOT EXISTS new_field TEXT;
```

### 3. Always Add Rollback Statements

Include `DOWN` migration statements for easy rollback:

```sql
-- DOWN Migration
DROP TABLE IF EXISTS products CASCADE;
```

### 4. Test Locally First

Always test migrations locally before pushing to production:

```powershell
npm run supabase:reset  # Test migration
npm run supabase:push   # Push after testing
```

### 5. Version Control

Commit migration files to git:

```powershell
git add supabase/migrations/
git commit -m "Add products table migration"
```

### 6. Never Edit Deployed Migrations

Once a migration is pushed to production, never edit it. Create a new migration instead.

### 7. Use Descriptive Names

Make migration names self-documenting:

```
✅ 20241029120000_add_email_verification_to_users.sql
❌ 20241029120000_update.sql
```

## Common Migration Patterns

### Creating a Table with RLS

```sql
-- Create table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view customers from their business"
  ON customers FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert customers to their business"
  ON customers FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));
```

### Adding a Column

```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID 
REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category 
ON products(category_id);
```

### Creating an Index

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_customer_id 
ON invoices(customer_id);
```

### Adding a Foreign Key

```sql
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id) 
REFERENCES customers(id) 
ON DELETE CASCADE;
```

## Troubleshooting

### Error: "Failed to link to Supabase project"

**Solution:**
1. Verify `SUPABASE_ACCESS_TOKEN` is set correctly in `.env`
2. Check that `SUPABASE_PROJECT_ID` matches your project
3. Ensure you've run `npm run supabase:login`

### Error: "new row violates row-level security policy"

**Solution:**
Check your RLS policies. The user might not have permission to insert/update. Temporarily disable RLS for testing:

```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Error: "relation already exists"

**Solution:**
Use `IF NOT EXISTS` in your CREATE statements:

```sql
CREATE TABLE IF NOT EXISTS table_name (...);
```

### Error: "permission denied for schema public"

**Solution:**
Make sure your database user has the correct permissions:

```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

## Advanced Usage

### Generating Migration from Schema Diff

```powershell
npx supabase db diff -f migration_name
```

This compares your local database to your migrations and creates a new migration file with the differences.

### Running Specific Migration

```powershell
psql $DATABASE_URL -f supabase/migrations/20241029120000_create_products.sql
```

### Seeding Data

Create seed files in `supabase/migrations/` with descriptive names like:

```
20251028000000_seed_south_african_data.sql
```

## Security Considerations

1. **Never commit credentials**: Always use `.env` files (gitignored)
2. **Use RLS**: Always enable Row Level Security for production tables
3. **Limit permissions**: Grant minimum required permissions
4. **Audit migrations**: Review all migrations before pushing to production
5. **Backup first**: Always backup your database before major migrations

## Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Dashboard](https://app.supabase.com)

## Quick Reference

```powershell
# Setup
npm run supabase:login
npm run supabase:link

# Development Workflow
npm run supabase:new-migration -- -Name my_migration
# Edit migration file
npm run supabase:push

# Check status
npm run supabase:status

# Pull remote schema
npm run supabase:pull

# Reset local DB
npm run supabase:reset
```
