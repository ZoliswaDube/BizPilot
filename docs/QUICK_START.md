# Quick Start: Internationalization & Supabase CLI

This guide gets you up and running with the new internationalization features and Supabase database migration tools.

## 🌍 Internationalization Quick Start

### 1. The Language Selector is Already Available!

Look at the bottom of the navigation sidebar (left side of the app) - you'll see a language selector with a globe icon 🌐.

### 2. Change Language

Click the language selector and choose from:
- **South African languages**: English, Afrikaans, Zulu, Xhosa, and 7 more
- **International languages**: Portuguese, French, Spanish, German, Arabic, Chinese, Hindi

### 3. Language Persists

Your language choice is automatically saved and will be remembered next time you visit.

### 4. Automatic Detection

First-time visitors get their language automatically detected based on location:
- South Africa → English (default)
- Brazil/Portugal → Portuguese
- France → French
- Germany → German
- etc.

## 💻 For Developers: Using Translations

### Quick Example

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('app.name')}</h1>
      <button>{t('actions.save')}</button>
      <p>{t('messages.saveSuccess')}</p>
    </div>
  );
}
```

### Add New Translations

1. Open `public/locales/en/common.json`
2. Add your translation key:
   ```json
   {
     "myFeature": {
       "title": "My Feature",
       "description": "Feature description"
     }
   }
   ```
3. Copy to other language files (e.g., `af/common.json`, `zu/common.json`)
4. Translate the text

### Full Documentation
See [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) for complete details.

---

## 🗄️ Supabase CLI Quick Start

### Step 1: Get Your Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API** and copy:
   - Project URL
   - Project ID (the subdomain)
   - Anon Key
4. Go to **Settings** → **Database** and copy/reset:
   - Database Password

### Step 2: Get Access Token

1. Go to https://app.supabase.com/account/tokens
2. Generate a new token
3. Copy it immediately (you won't see it again!)

### Step 3: Update .env File

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Supabase CLI Configuration
SUPABASE_ACCESS_TOKEN=your_access_token
SUPABASE_PROJECT_ID=xxxxx
SUPABASE_DB_PASSWORD=your_db_password
```

### Step 4: Login & Link

```powershell
npm run supabase:login
npm run supabase:link
```

### Step 5: Create Your First Migration

```powershell
npm run supabase:new-migration -- -Name create_my_table
```

This creates: `supabase/migrations/20241029XXXXXX_create_my_table.sql`

### Step 6: Edit the Migration

Open the generated file and add your SQL:

```sql
-- UP Migration
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
```

### Step 7: Push to Supabase

```powershell
# Preview first (dry run)
.\scripts\supabase-push-migrations.ps1 -DryRun

# Actually push
npm run supabase:push
```

### Common Commands

```powershell
# Create new migration
npm run supabase:new-migration -- -Name migration_name

# Push migrations to remote
npm run supabase:push

# Pull current schema
npm run supabase:pull

# Check migration status
npm run supabase:status

# Reset local database (for testing)
npm run supabase:reset

# Seed database with data
npm run db:seed              # Remote/production
npm run db:seed:local        # Local/development

# Create seed file
npm run db:create-seed -- -Name my_seed_data
```

### Full Documentation
See [SUPABASE_CLI_GUIDE.md](./SUPABASE_CLI_GUIDE.md) for complete details.
See [DATABASE_SEEDING.md](./DATABASE_SEEDING.md) for seeding guide.

---

## 🎯 Common Workflows

### Adding a New Feature with Translations

1. **Create the component**:
   ```tsx
   import { useTranslation } from 'react-i18next';
   
   function NewFeature() {
     const { t } = useTranslation();
     return <h1>{t('newFeature.title')}</h1>;
   }
   ```

2. **Add translations** to `public/locales/en/common.json`:
   ```json
   {
     "newFeature": {
       "title": "New Feature",
       "description": "Description here"
     }
   }
   ```

3. **Copy to other languages** and translate

### Creating a Database Table with Migrations

1. **Create migration**:
   ```powershell
   npm run supabase:new-migration -- -Name create_products_table
   ```

2. **Write SQL**:
   ```sql
   CREATE TABLE IF NOT EXISTS products (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     price DECIMAL(10,2),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   ALTER TABLE products ENABLE ROW LEVEL SECURITY;
   ```

3. **Test locally** (optional):
   ```powershell
   npm run supabase:reset
   ```

4. **Push to production**:
   ```powershell
   npm run supabase:push
   ```

5. **Verify** in Supabase Dashboard → Database → Tables

---

## 🚨 Troubleshooting

### i18n Issues

**Translations not showing?**
- Clear browser cache and localStorage
- Check browser console for errors
- Verify JSON files have no syntax errors

**Wrong language detected?**
- Use the language selector to manually change
- Or add `?lng=en` to the URL

### Supabase CLI Issues

**Can't login?**
- Check that `SUPABASE_ACCESS_TOKEN` is set in `.env`
- Regenerate token if needed

**Migrations fail?**
- Check SQL syntax
- Verify table names don't conflict
- Review RLS policies

**Can't connect?**
- Verify `SUPABASE_PROJECT_ID` is correct
- Check network connection
- Try `npm run supabase:link` again

---

## 📚 Next Steps

1. **Read the full guides**:
   - [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md)
   - [SUPABASE_CLI_GUIDE.md](./SUPABASE_CLI_GUIDE.md)

2. **Explore examples**:
   - Check `src/components/examples/TranslationExample.tsx`
   - Review existing migrations in `supabase/migrations/`

3. **Start translating**:
   - Add translations for your language
   - Contribute to the project!

4. **Create migrations**:
   - Practice with test tables locally
   - Use `supabase:reset` to experiment safely

---

## 🎉 You're Ready!

Both features are now set up and ready to use. Happy coding! 🚀
