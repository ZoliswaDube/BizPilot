# Google OAuth Setup Guide

## Problem: "This site can't be found" after Google login

If you're experiencing an error where clicking "Continue with Google" redirects you to a Supabase URL like:
```
https://ecqtlekrdhtaxhuvgsyo.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://profitpilotpro.net/auth/callback
```
And then you get a "This site can't be found" error, this is a **redirect URL configuration issue**.

## Root Cause

The OAuth redirect URL is not properly configured in your Supabase project. When you authenticate with Google, Supabase tries to redirect you back to your application, but if that URL isn't in the allowed list, the redirect fails.

## Solution: Configure Redirect URLs in Supabase

### Step 1: Identify Your Application URL

Your application URL is the domain where your app is hosted. Examples:
- **Production**: `https://yourdomain.com` or `https://profitpilotpro.net`
- **Staging**: `https://staging.yourdomain.com`
- **Netlify**: `https://your-app.netlify.app`
- **Vercel**: `https://your-app.vercel.app`
- **Development**: `http://localhost:5173`

You can find your current URL by opening your browser's console and running:
```javascript
console.log(window.location.origin)
```

### Step 2: Configure Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project (`ecqtlekrdhtaxhuvgsyo`)

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "URL Configuration"

3. **Add Redirect URLs**
   
   In the "Redirect URLs" section, add the following URLs:
   
   **For Production:**
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/**
   ```
   
   **For Development (if testing locally):**
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/**
   ```
   
   **For Multiple Environments:**
   Add each environment separately:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/**
   https://staging.yourdomain.com/auth/callback
   https://staging.yourdomain.com/**
   http://localhost:5173/auth/callback
   http://localhost:5173/**
   ```

4. **Update Site URL**
   
   In the same "URL Configuration" section, update the "Site URL" to your primary production URL:
   ```
   https://yourdomain.com
   ```

5. **Save Changes**
   - Click "Save" at the bottom of the page
   - Wait a few seconds for changes to propagate

### Step 3: Verify Configuration

1. **Clear Browser Cache**
   - Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
   - Clear cached images and files
   - Clear cookies and site data

2. **Test OAuth Flow**
   - Go to your application
   - Click "Continue with Google"
   - Complete Google authentication
   - You should be redirected back to your app successfully

### Step 4: Check Browser Console

Open your browser's developer console (F12) and look for logs:

**Successful OAuth:**
```
🌐 getURL() final URL: https://yourdomain.com/
⚠️ IMPORTANT: Ensure this URL is added to Supabase Auth -> URL Configuration -> Redirect URLs
🔐 useAuthStore: Initiating OAuth flow { provider: 'google', redirectUrl: 'https://yourdomain.com/auth/callback' }
🔐 AuthCallback: PKCE code detected, exchanging immediately
🔐 AuthCallback: Session created successfully, redirecting
```

**Failed OAuth (Missing Redirect URL):**
```
🌐 getURL() final URL: https://yourdomain.com/
🔐 useAuthStore: Initiating OAuth flow { provider: 'google', redirectUrl: 'https://yourdomain.com/auth/callback' }
🔐 AuthCallback: OAuth error detected { error: 'unauthorized_client', errorDescription: 'Redirect URI not whitelisted' }
```

## Common Issues

### Issue 1: Wrong Domain in Redirect

**Problem:** The app redirects to `profitpilotpro.net` but you're accessing it via a different URL.

**Solution:** 
- Set the `VITE_SITE_URL` environment variable to your actual domain
- Or ensure `window.location.origin` matches your configured Supabase redirect URLs

**Add to `.env` file:**
```bash
VITE_SITE_URL=https://yourdomain.com
```

### Issue 2: Multiple Deployments

**Problem:** You have multiple deployments (production, staging, preview) and OAuth only works on one.

**Solution:** Add ALL deployment URLs to Supabase redirect URLs:
```
https://production.yourdomain.com/auth/callback
https://production.yourdomain.com/**
https://staging.yourdomain.com/auth/callback
https://staging.yourdomain.com/**
https://preview-123.netlify.app/auth/callback
https://preview-123.netlify.app/**
```

### Issue 3: Wildcard Not Working

**Problem:** Added `https://yourdomain.com/**` but it's still not working.

**Solution:** 
- Make sure to add BOTH the specific callback URL AND the wildcard
- Format should be: `https://yourdomain.com/auth/callback` (specific) and `https://yourdomain.com/**` (wildcard)
- No trailing slash on the domain before `/**`

### Issue 4: localhost Not Working

**Problem:** OAuth works in production but not locally.

**Solution:** Add localhost URLs to Supabase:
```
http://localhost:5173/auth/callback
http://localhost:5173/**
```

Note: Use `http://` (not `https://`) for localhost.

## Environment Variables

For consistent OAuth behavior across environments, set these environment variables:

**Production (`.env.production`):**
```bash
VITE_SITE_URL=https://yourdomain.com
VITE_SUPABASE_URL=https://ecqtlekrdhtaxhuvgsyo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Development (`.env.local`):**
```bash
VITE_SITE_URL=http://localhost:5173
VITE_SUPABASE_URL=https://ecqtlekrdhtaxhuvgsyo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Netlify/Vercel (Environment Variables UI):**
```bash
VITE_SITE_URL=https://yourdomain.com
VITE_SUPABASE_URL=https://ecqtlekrdhtaxhuvgsyo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Troubleshooting Checklist

- [ ] Redirect URL is added to Supabase Dashboard → Authentication → URL Configuration
- [ ] Both specific URL (`/auth/callback`) and wildcard (`/**`) are added
- [ ] Site URL is set to your primary domain
- [ ] Browser cache is cleared
- [ ] Environment variables are set correctly
- [ ] No trailing slashes in redirect URLs (except for `/**`)
- [ ] Protocol matches (http vs https)
- [ ] Domain matches exactly (no www. vs with www. mismatch)

## Testing OAuth Flow

### Manual Test:

1. Open browser console (F12)
2. Go to your app's auth page
3. Click "Continue with Google"
4. Check console logs for the redirect URL being used
5. Verify it matches what's in your Supabase configuration
6. Complete Google authentication
7. You should be redirected back successfully

### Automated Test:

```bash
# Check current redirect URL
curl -I https://yourdomain.com/auth/callback

# Should return 200 OK or redirect to login, not 404
```

## Getting Help

If you're still experiencing issues:

1. **Check Console Logs:** Open browser console (F12) and look for errors
2. **Verify URLs Match:** Ensure the URL in console logs matches Supabase config exactly
3. **Check Supabase Logs:** Go to Supabase Dashboard → Logs → Auth Logs
4. **Contact Support:** Provide the following information:
   - Current URL you're accessing the app from
   - Redirect URL shown in console logs
   - Supabase redirect URLs configuration (screenshot)
   - Error message from browser/console

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [OAuth Redirect URIs](https://supabase.com/docs/guides/auth/redirect-urls)
