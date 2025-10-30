# Database Seeding - Setup Complete! ✅

## Overview

You can now easily seed your Supabase database with test or production data using simple npm commands.

## 🚀 Quick Start

### Seed Your Database

```powershell
# Seed remote/production database
npm run db:seed

# Seed local development database
npm run db:seed:local
```

### Create New Seed File

```powershell
npm run db:create-seed -- -Name customers_data
```

This creates: `supabase/migrations/TIMESTAMP_seed_customers_data.sql`

## 📦 What Was Added

### New NPM Scripts

```json
{
  "db:seed": "Seed remote database",
  "db:seed:local": "Seed local database",
  "db:create-seed": "Create new seed file"
}
```

### New PowerShell Scripts

```
scripts/
  supabase-seed.ps1          - Main seeding script
  create-seed-file.ps1       - Create new seed files
```

### Existing Seed Data

You already have South African seed data ready to use:

**File**: `supabase/migrations/20251028000000_seed_south_african_data.sql`

**Contains**:
- South African customers (Johannesburg, Cape Town, Durban)
- Products with ZAR pricing
- Sample business data
- Realistic test data

## 💡 Usage Examples

### Example 1: Seed Local Database for Development

```powershell
# Reset and seed local database with all data
npm run db:seed:local
```

### Example 2: Create Custom Seed

```powershell
# Create seed file
npm run db:create-seed -- -Name demo_products

# Edit: supabase/migrations/TIMESTAMP_seed_demo_products.sql
# Add your INSERT statements

# Run it locally to test
npm run db:seed:local
```

### Example 3: Seed Production

```powershell
# After testing locally, seed production
npm run db:seed
```

## 📝 Seed File Structure

```sql
-- =====================================================
-- SEED DATA: Your Description
-- =====================================================

-- Insert customers
INSERT INTO customers (business_id, name, email) VALUES
  ((SELECT id FROM businesses LIMIT 1), 'John Doe', 'john@example.com'),
  ((SELECT id FROM businesses LIMIT 1), 'Jane Smith', 'jane@example.com');

-- Insert products
INSERT INTO products (business_id, name, price) VALUES
  ((SELECT id FROM businesses LIMIT 1), 'Product 1', 99.99),
  ((SELECT id FROM businesses LIMIT 1), 'Product 2', 149.99);

-- =====================================================
-- END OF SEED
-- =====================================================
```

## 🎯 Common Use Cases

### Use Case 1: Development Environment

```powershell
# Quick setup for new developers
npm run db:seed:local
```

This gives them a fully populated database to work with.

### Use Case 2: Testing

```powershell
# Reset to known state before tests
npm run db:seed:local
```

Consistent seed data ensures predictable tests.

### Use Case 3: Demos

```powershell
# Populate demo environment
npm run db:seed
```

Show realistic data in demos and presentations.

### Use Case 4: Production Defaults

```powershell
# Initialize new production database with defaults
npm run db:seed
```

Set up categories, settings, or reference data.

## 🔄 How It Works

### For Local Database (`npm run db:seed:local`)

1. Runs `npx supabase db reset`
2. Drops local database
3. Recreates it from migrations
4. Runs ALL migrations including seed files

### For Remote Database (`npm run db:seed`)

1. Links to your Supabase project
2. Runs `npx supabase db push`
3. Pushes pending migrations including seed files

### Seed File Detection

Any SQL file with "seed" in the filename is considered a seed:

```
✅ 20241029_seed_customers.sql        - Will seed
✅ 20241029_seed_demo_data.sql        - Will seed
❌ 20241029_create_tables.sql         - Won't seed (no "seed")
```

## 🛠️ Advanced Usage

### Seed Specific File

```powershell
# Local
.\scripts\supabase-seed.ps1 -Local -SeedFile "20251028000000_seed_south_african_data.sql"

# Remote
.\scripts\supabase-seed.ps1 -SeedFile "20251028000000_seed_south_african_data.sql"
```

### Seed Different Project

```powershell
.\scripts\supabase-seed.ps1 -ProjectId "your-other-project-id"
```

## 📚 Best Practices

### 1. Use Conditional Inserts

Prevent duplicates when re-seeding:

```sql
INSERT INTO categories (name) VALUES ('Electronics')
ON CONFLICT (name) DO NOTHING;
```

### 2. Reference Existing Data

Use subqueries to link data:

```sql
INSERT INTO products (business_id, name) VALUES
  ((SELECT id FROM businesses WHERE name = 'My Business'), 'Product 1');
```

### 3. Order Matters

Insert parent records first:

```sql
-- 1. First, businesses
INSERT INTO businesses (name) VALUES ('Business A');

-- 2. Then, customers (depends on businesses)
INSERT INTO customers (business_id, name) VALUES
  ((SELECT id FROM businesses WHERE name = 'Business A'), 'Customer 1');
```

### 4. Test Locally First

Always test seeds locally before running on production:

```powershell
npm run db:seed:local  # Test
npm run db:seed        # Deploy
```

## 🐛 Troubleshooting

### No seed files found

**Solution**: Create a seed file with "seed" in the name:
```powershell
npm run db:create-seed -- -Name my_data
```

### Access token not set

**Solution**: Add to `.env`:
```env
SUPABASE_ACCESS_TOKEN=your_token
SUPABASE_PROJECT_ID=your_project_id
```

### Duplicate key errors

**Solution**: Use `ON CONFLICT`:
```sql
INSERT INTO table (id, name) VALUES (1, 'Name')
ON CONFLICT (id) DO NOTHING;
```

### Foreign key violations

**Solution**: Insert parent records first, children second.

## 📖 Complete Documentation

For complete details, see:
- **[DATABASE_SEEDING.md](./docs/DATABASE_SEEDING.md)** - Full seeding guide with examples
- **[SUPABASE_CLI_GUIDE.md](./docs/SUPABASE_CLI_GUIDE.md)** - Complete Supabase CLI guide
- **[QUICK_START.md](./docs/QUICK_START.md)** - Quick start guide

## ✅ Ready to Use!

The seeding system is fully set up and ready. You already have one seed file with South African data. Just run:

```powershell
# Test it locally
npm run db:seed:local

# Or seed production
npm run db:seed
```

Happy seeding! 🌱
