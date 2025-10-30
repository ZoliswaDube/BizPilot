# Database Seeding Guide

## Overview

This guide explains how to seed your Supabase database with test or production data using npm commands. Database seeding is useful for:

- **Development**: Populate your local database with test data
- **Testing**: Create consistent test scenarios
- **Production**: Initialize new databases with default data
- **Demos**: Set up sample data for demonstrations

## Quick Start

### Seed Remote Database (Production)

```powershell
npm run db:seed
```

### Seed Local Database (Development)

```powershell
npm run db:seed:local
```

### Create New Seed File

```powershell
npm run db:create-seed -- -Name my_seed_data
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:seed` | Seed remote Supabase database (production) |
| `npm run db:seed:local` | Seed local database (development) |
| `npm run db:create-seed` | Create a new seed SQL file |

## How It Works

### Seed Files

Seed files are SQL files stored in `supabase/migrations/` with "seed" in their filename:

```
supabase/
  migrations/
    20251028000000_seed_south_african_data.sql  ✅ Will be used for seeding
    20250727000000_payment_and_invoicing_system.sql  ❌ Regular migration (no "seed")
```

### Seeding Process

1. **Local Seeding**: Runs `npx supabase db reset` which:
   - Drops the local database
   - Recreates it
   - Runs ALL migrations (including seed files)

2. **Remote Seeding**: Runs `npx supabase db push` which:
   - Links to your remote project
   - Pushes all pending migrations (including seed files)

## Creating Seed Files

### Method 1: Using npm Command

```powershell
npm run db:create-seed -- -Name customers_data
```

This creates: `supabase/migrations/20241029123456_seed_customers_data.sql`

### Method 2: Manual Creation

Create a file in `supabase/migrations/` with format:
```
YYYYMMDDHHMMSS_seed_your_description.sql
```

## Seed File Structure

```sql
-- =====================================================
-- SEED DATA: Description
-- =====================================================
-- Created: 2024-10-29
-- Description: Seed customers and products
-- =====================================================

-- Insert data
INSERT INTO customers (business_id, name, email, phone) VALUES
  ((SELECT id FROM businesses LIMIT 1), 'John Doe', 'john@example.com', '+27 11 123 4567'),
  ((SELECT id FROM businesses LIMIT 1), 'Jane Smith', 'jane@example.com', '+27 21 456 7890');

-- Conditional insert (only if table is empty)
INSERT INTO categories (name, description)
SELECT 'Electronics', 'Electronic goods'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics');

-- =====================================================
-- END OF SEED
-- =====================================================
```

## Example: Your Existing Seed File

You already have a seed file with South African data:

**File**: `supabase/migrations/20251028000000_seed_south_african_data.sql`

**Content**: 
- South African customers (Johannesburg, Cape Town, Durban)
- Products with ZAR pricing
- Sample invoices and payments
- Realistic business data

### To Use This Seed:

```powershell
# For local development
npm run db:seed:local

# For production
npm run db:seed
```

## Best Practices

### 1. Use Conditional Inserts

Prevent duplicate data when re-running seeds:

```sql
-- Only insert if doesn't exist
INSERT INTO categories (name, description)
SELECT 'Category Name', 'Description'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Category Name');
```

### 2. Reference Existing Data

Use subqueries to reference existing records:

```sql
INSERT INTO products (business_id, name, price) VALUES
  ((SELECT id FROM businesses LIMIT 1), 'Product 1', 99.99);
```

### 3. Use Transactions

Wrap seeds in transactions for atomicity:

```sql
BEGIN;

-- Your insert statements here

COMMIT;
```

### 4. Handle Dependencies

Insert data in the correct order:

```sql
-- 1. First, insert businesses
INSERT INTO businesses (name) VALUES ('My Business');

-- 2. Then, insert customers (depends on business)
INSERT INTO customers (business_id, name) VALUES
  ((SELECT id FROM businesses WHERE name = 'My Business'), 'Customer 1');
```

### 5. Add Comments

Document what your seed does:

```sql
-- =====================================================
-- SEED: Demo Data for Testing
-- =====================================================
-- Creates:
-- - 3 businesses
-- - 10 customers per business
-- - 20 products
-- - 5 sample invoices
-- =====================================================
```

## Common Patterns

### Pattern 1: Seed Categories

```sql
INSERT INTO categories (name, description, icon) VALUES
  ('Electronics', 'Electronic devices', '⚡'),
  ('Furniture', 'Home and office furniture', '🪑'),
  ('Clothing', 'Apparel and accessories', '👔')
ON CONFLICT (name) DO NOTHING;  -- Skip if exists
```

### Pattern 2: Seed Products with Categories

```sql
-- First ensure categories exist
INSERT INTO categories (name) VALUES ('Electronics')
ON CONFLICT (name) DO NOTHING;

-- Then insert products
INSERT INTO products (business_id, name, category_id, price, stock) VALUES
  (
    (SELECT id FROM businesses LIMIT 1),
    'Laptop',
    (SELECT id FROM categories WHERE name = 'Electronics'),
    15000.00,
    10
  );
```

### Pattern 3: Seed Customers with Addresses

```sql
INSERT INTO customers (
  business_id,
  name,
  email,
  phone,
  address
) VALUES
(
  (SELECT id FROM businesses LIMIT 1),
  'Alice Johnson',
  'alice@example.com',
  '+27 11 111 2222',
  '{"street": "123 Main St", "city": "Johannesburg", "postal_code": "2000", "country": "South Africa"}'::jsonb
);
```

### Pattern 4: Seed with Timestamps

```sql
INSERT INTO orders (
  business_id,
  customer_id,
  total_amount,
  status,
  created_at
) VALUES
(
  (SELECT id FROM businesses LIMIT 1),
  (SELECT id FROM customers LIMIT 1),
  1500.00,
  'completed',
  NOW() - INTERVAL '30 days'  -- Order from 30 days ago
);
```

## Seeding Strategies

### Strategy 1: Separate Seed Files

Create separate seed files for different data types:

```
20241029120000_seed_categories.sql
20241029120001_seed_products.sql
20241029120002_seed_customers.sql
20241029120003_seed_invoices.sql
```

They'll run in order (sorted by timestamp).

### Strategy 2: Single Comprehensive Seed

Create one large seed file with all data:

```
20241029120000_seed_complete_demo_data.sql
```

### Strategy 3: Environment-Specific Seeds

Create different seeds for different environments:

```
20241029120000_seed_development_data.sql
20241029120001_seed_staging_data.sql
20241029120002_seed_production_defaults.sql
```

Use only the appropriate seed for each environment.

## Advanced Usage

### Run Specific Seed File

```powershell
# Seed remote with specific file
.\scripts\supabase-seed.ps1 -SeedFile "20251028000000_seed_south_african_data.sql"

# Seed local with specific file
.\scripts\supabase-seed.ps1 -Local -SeedFile "20251028000000_seed_south_african_data.sql"
```

### Seed with Project ID Override

```powershell
.\scripts\supabase-seed.ps1 -ProjectId "your-project-id"
```

## Troubleshooting

### Error: "No seed files found"

**Solution**: Create a seed file with "seed" in the filename:
```powershell
npm run db:create-seed -- -Name my_data
```

### Error: "SUPABASE_ACCESS_TOKEN not set"

**Solution**: Add your access token to `.env`:
```env
SUPABASE_ACCESS_TOKEN=your_token_here
```

### Error: "Foreign key constraint violation"

**Solution**: Insert data in the correct order (parent tables first):
```sql
-- 1. First, businesses
INSERT INTO businesses ...

-- 2. Then, customers (references businesses)
INSERT INTO customers ...
```

### Error: "Duplicate key value violates unique constraint"

**Solution**: Use conditional inserts or `ON CONFLICT`:
```sql
INSERT INTO categories (name) VALUES ('Electronics')
ON CONFLICT (name) DO NOTHING;
```

### Seed Not Running

**Solution**: Ensure filename contains "seed":
```
✅ 20241029_seed_data.sql
❌ 20241029_data.sql
```

## Example Workflow

### Development Workflow

```powershell
# 1. Create seed file
npm run db:create-seed -- -Name demo_data

# 2. Edit the seed file
# Add your INSERT statements

# 3. Test locally
npm run db:seed:local

# 4. Verify in Supabase Studio
# http://localhost:54323

# 5. If good, seed production
npm run db:seed
```

### Reset and Re-seed Local Database

```powershell
# This will drop, recreate, and seed your local database
npm run db:seed:local
```

### Update Seed Data

1. Edit existing seed file in `supabase/migrations/`
2. Run seeding command again:
   ```powershell
   npm run db:seed:local  # For local
   npm run db:seed        # For production
   ```

## Performance Tips

### 1. Use Batch Inserts

Instead of:
```sql
INSERT INTO products (name) VALUES ('Product 1');
INSERT INTO products (name) VALUES ('Product 2');
INSERT INTO products (name) VALUES ('Product 3');
```

Use:
```sql
INSERT INTO products (name) VALUES
  ('Product 1'),
  ('Product 2'),
  ('Product 3');
```

### 2. Disable Triggers (If Safe)

For large seeds, temporarily disable triggers:
```sql
ALTER TABLE products DISABLE TRIGGER ALL;
-- Your inserts here
ALTER TABLE products ENABLE TRIGGER ALL;
```

### 3. Use COPY (For Very Large Datasets)

For thousands of rows, use PostgreSQL's COPY command:
```sql
COPY products (name, price) FROM STDIN WITH CSV;
Product 1,99.99
Product 2,149.99
Product 3,199.99
\.
```

## Security Considerations

1. **Never commit sensitive data** in seed files
2. **Use environment variables** for sensitive values
3. **Don't seed production with test data** accidentally
4. **Review seed files** before running on production
5. **Backup database** before seeding production

## Resources

- [PostgreSQL INSERT Documentation](https://www.postgresql.org/docs/current/sql-insert.html)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [SQL Best Practices](https://www.postgresql.org/docs/current/sql-syntax.html)

## Quick Reference

```powershell
# Create seed file
npm run db:create-seed -- -Name my_seed

# Seed local database
npm run db:seed:local

# Seed production database
npm run db:seed

# Reset local database (includes seeding)
npm run supabase:reset
```
