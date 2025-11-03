# Complete Signup Flow & Business Hierarchy System

## Overview

BizPilot implements a complete user signup and business ownership system where:
- ✅ Every user who signs up becomes an **Admin/Owner** of their own business
- ✅ Clear visual feedback during signup process
- ✅ Proper email verification flow (when enabled)
- ✅ Automatic redirection to business setup
- ✅ One business per user, one owner per business

## User Signup Flow

### With Email Confirmation ENABLED (Current Config)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User visits /auth and clicks "Sign Up" tab              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User fills in:                                           │
│    - Full Name                                              │
│    - Email                                                  │
│    - Password                                               │
│    - Confirm Password                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User clicks "Create Account"                            │
│    ➜ Supabase creates user account (email_confirmed=false) │
│    ➜ Sends verification email                              │
│    ➜ NO session created yet                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ✅ SUCCESS MESSAGE DISPLAYED (stays visible)             │
│                                                             │
│   "✅ Account created successfully!                         │
│                                                             │
│    📧 Please check your email inbox for [email]            │
│    and click the verification link to activate your        │
│    account.                                                 │
│                                                             │
│    After verification, you'll be able to sign in           │
│    and set up your business profile."                      │
│                                                             │
│   [Email field still populated for convenience]            │
│   [Password fields cleared]                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ (after 8 seconds)
┌─────────────────────────────────────────────────────────────┐
│ 5. AUTO-SWITCH TO SIGNIN TAB                               │
│    User can now enter their credentials                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ (User clicks verification link in email)
┌─────────────────────────────────────────────────────────────┐
│ 6. EMAIL VERIFICATION                                       │
│    ➜ Redirected to /auth/callback?type=signup&token_hash=..│
│    ➜ Supabase verifies email                               │
│    ➜ Sets email_confirmed=true                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. POST-VERIFICATION OPTIONS:                              │
│                                                             │
│    Option A: Auto-signed in (session created)              │
│    ➜ Redirect to /business/new                             │
│                                                             │
│    Option B: Needs manual signin                           │
│    ➜ Redirect to /auth with success message                │
│    ➜ User signs in → checks business → redirects           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. BUSINESS SETUP (/business/new)                          │
│    User fills in business details:                         │
│    - Business Name (required)                              │
│    - Description                                           │
│    - Address                                               │
│    - Phone                                                 │
│    - Email                                                 │
│    - Website                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. BUSINESS CREATED + USER ASSIGNED AS ADMIN               │
│                                                             │
│    Database operations:                                    │
│    ✅ Insert into `businesses` table                        │
│       - created_by = user.id                               │
│                                                             │
│    ✅ Insert into `business_users` table                    │
│       - business_id = new business                         │
│       - user_id = current user                             │
│       - role = 'admin' (ADMIN/OWNER)                       │
│       - is_active = true                                   │
│                                                             │
│    ✅ Update `user_profiles` table                          │
│       - business_id = new business                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. REDIRECT TO DASHBOARD                                  │
│     User now has full admin access to their business       │
└─────────────────────────────────────────────────────────────┘
```

### With Email Confirmation DISABLED

```
┌─────────────────────────────────────────────────────────────┐
│ 1-3. Same as above (fill form, click create account)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ✅ INSTANT SUCCESS                                        │
│    ➜ Supabase creates user AND session                     │
│    ➜ User is automatically authenticated                   │
│                                                             │
│    Message: "✅ Account created successfully!               │
│    Redirecting to business setup..."                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ (after 1.5 seconds)
┌─────────────────────────────────────────────────────────────┐
│ 5. AUTO-REDIRECT TO /business/new                          │
│    Continue from step 8 above                              │
└─────────────────────────────────────────────────────────────┘
```

## Business Hierarchy System

### Role Structure

```
Business Owner/Admin (role='admin')
├─ Full control over business
├─ Can create/edit/delete ALL resources
├─ Can manage other users
├─ Can assign roles to other users
└─ ONLY ONE admin per business

Manager (role='manager')
├─ Can edit inventory
├─ Can view/edit products
├─ Can manage orders
└─ Limited user management

Employee (role='employee')
├─ Read-only access to most resources
├─ Can view inventory
├─ Can view products
└─ Limited editing capabilities
```

### Key Rules

1. **First User = Admin/Owner**
   - User who creates the business automatically becomes admin
   - Set in `BusinessOnboarding.tsx` line 87: `role: 'admin'`
   - Tracked in `businesses.created_by` field

2. **One Business Per User**
   - Checked in `BusinessOnboarding.tsx` lines 47-60
   - Prevents users from creating multiple businesses
   - Prevents users from joining multiple businesses

3. **One Admin Per Business**
   - Only the creator is assigned 'admin' role
   - System prevents changing admin to another user
   - Additional users must be invited with manager/employee roles

4. **Admin Can Create Other Users**
   - Admin can invite users via `UserManagement` component
   - Admin assigns roles: manager or employee
   - New users receive invitations (not automatic admin)

## Authentication Check & Redirect Logic

### After Signin/Signup (`AuthForm.tsx`)

```typescript
const handleAuthSuccess = async () => {
  // Get current user from store
  const { user } = useAuthStore.getState()
  
  if (user) {
    // Check if user has a business
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
    
    if (businessUser?.business_id) {
      // User has business → Dashboard
      navigate('/dashboard')
    } else {
      // User has NO business → Business Setup
      navigate('/business/new')
    }
  }
}
```

### Dashboard Auto-Redirect

If user somehow reaches dashboard without a business:

```typescript
// Dashboard.tsx shows business setup prompt
if (!business && !businessLoading) {
  return (
    <div>
      <h1>Welcome to BizPilot!</h1>
      <button onClick={() => navigate('/business/new')}>
        Set Up Your Business
      </button>
    </div>
  )
}
```

## Visual Feedback Improvements

### Success Message Features

1. **Clear Visual Indicators**
   - ✅ Checkmark emoji for success
   - 📧 Email emoji for verification instructions
   - Green border/background

2. **Persistent Display**
   - Success message stays visible (no auto-hide for email confirmation)
   - Auto-switches to signin tab after 8 seconds
   - Email field kept populated for convenience

3. **Multi-line Formatting**
   - Clear instructions
   - Email address shown
   - Next steps explained

### Error Handling

```typescript
// Common signup errors handled:
- "User already registered" → Suggest signin
- "Email not confirmed" → Show resend verification button
- "Invalid email" → Clear validation message
- "Password too weak" → Strength requirements
- "Passwords don't match" → Validation message
```

## Testing the Complete Flow

### Test Signup with Email Confirmation

1. **Clear browser data** (Ctrl+Shift+Delete)
2. **Visit** `http://localhost:5173/auth`
3. **Click** "Sign Up" tab
4. **Fill form**:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
   - Confirm: password123
5. **Click** "Create Account"
6. **Verify**:
   - ✅ Green success message appears
   - ✅ "Please check your email..." message visible
   - ✅ Email field still populated
   - ✅ Password fields cleared
7. **Wait** 8 seconds
   - ✅ Auto-switches to "Sign In" tab
8. **Check email** inbox
9. **Click** verification link
10. **Verify**:
    - ✅ Redirected to business setup OR signin
    - ✅ Can sign in if needed
11. **After signin**:
    - ✅ Redirected to /business/new
12. **Fill business form**
13. **Submit**
    - ✅ Business created
    - ✅ User assigned as admin
    - ✅ Redirected to dashboard

### Test Signin After Verification

1. **Visit** `/auth`
2. **Enter** verified email and password
3. **Click** "Sign In"
4. **Verify**:
   - ✅ Check if user has business
   - ✅ If yes → Dashboard
   - ✅ If no → Business setup

## Database Schema

### Tables Involved

```sql
-- businesses table
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id), -- Tracks owner
  ...
);

-- business_users table (joins users to businesses)
CREATE TABLE business_users (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL, -- 'admin', 'manager', 'employee'
  is_active BOOLEAN DEFAULT true,
  ...
);

-- user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  full_name TEXT,
  ...
);
```

## Configuration Options

### Enable/Disable Email Confirmation

**File**: `supabase/config.toml`

```toml
[auth.email]
enable_confirmations = true  # Change to false to disable
```

**Impact**:
- `true`: Users must verify email before signing in
- `false`: Users auto-authenticated after signup

### Customize Signup Success Messages

**File**: `src/components/auth/EmailAuthForm.tsx`

Lines 101-105 (email confirmation message)
Lines 94 (auto-authenticated message)

## Files Modified

1. ✅ `src/components/auth/EmailAuthForm.tsx`
   - Improved success messages
   - Better visual feedback
   - Auto-switch to signin tab
   - Keep email populated

2. ✅ `src/components/auth/AuthForm.tsx`
   - Check business status after auth
   - Smart redirection logic
   - Redirect to business setup if needed

3. ✅ `src/components/auth/AuthCallback.tsx`
   - Handle email verification
   - Check session after verification
   - Smart redirection

4. ✅ `src/components/business/BusinessOnboarding.tsx`
   - Create business
   - Assign user as admin (role='admin')
   - One business per user check

## Summary

The complete system ensures:

✅ **Clear Visual Feedback**: Users always know what's happening
✅ **Proper Email Flow**: Verification works smoothly with clear instructions
✅ **Smart Redirects**: Users go to business setup or dashboard as needed
✅ **Admin Hierarchy**: First user = admin, can create other users with roles
✅ **One Owner Per Business**: System enforces business ownership rules
✅ **Seamless Experience**: No confusion, clear next steps at every stage
