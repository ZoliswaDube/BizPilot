# BizPilot Test Suite

## Overview

Comprehensive unit tests for BizPilot's authentication system and core features.

## Test Coverage

### 1. Authentication Tests (`src/store/__tests__/auth.test.ts`)

**Covers**: Auth Store (Zustand)

**Test Cases**:
- ✅ **Sign Up**
  - Successful user signup
  - Signup error handling (duplicate email, weak password)
  - Email confirmation requirement
  
- ✅ **Sign In**
  - Successful user signin
  - Invalid credentials error
  - Email not confirmed error
  
- ✅ **OAuth (Google/GitHub)**
  - Initiating OAuth flow
  - OAuth error handling
  - Preventing concurrent requests
  
- ✅ **Sign Out**
  - Successful signout with state clearing
  - Graceful failure handling
  
- ✅ **Password Reset**
  - Sending reset email
  - Error handling
  
- ✅ **Email Verification**
  - Resending verification email
  
- ✅ **State Management**
  - User state updates
  - Session state updates
  - Loading state management
  - Inactivity warning state
  
- ✅ **Inactivity Tracking**
  - Starting tracking
  - Stopping tracking
  - Session extension

**Total**: 25+ test cases

### 2. UI Component Tests (`src/components/auth/__tests__/EmailAuthForm.test.tsx`)

**Covers**: EmailAuthForm Component

**Test Cases**:
- ✅ **Signup Mode**
  - Form rendering
  - Field validation (name, email, password)
  - Password match validation
  - Successful signup
  - Error display
  
- ✅ **Signin Mode**
  - Form rendering
  - Successful signin
  - Invalid credentials
  
- ✅ **Reset Mode**
  - Form rendering
  - Password reset request

**Total**: 12+ test cases

### 3. Calculation Utilities (`src/utils/__tests__/calculations.test.ts`)

**Covers**: Business calculations

**Test Cases**:
- ✅ **Profit Margin Calculation**
  - Correct calculations
  - Edge cases (zero, negative values)
  
- ✅ **Markup Calculation**
  - Correct calculations
  - Edge cases
  
- ✅ **Selling Price Calculation**
  - From cost and margin
  - Edge cases (0%, 100% margin)
  
- ✅ **Cost Calculation**
  - From selling price and margin
  - From selling price and markup
  
- ✅ **Formatting**
  - Percentage formatting
  - Currency formatting

**Total**: 15+ test cases

### 4. Inventory Hook Tests (`src/hooks/__tests__/useInventory.test.ts`)

**Covers**: useInventory Hook

**Test Cases**:
- ✅ Successful inventory fetching
- ✅ Error handling
- ✅ Empty state handling (no business)

**Total**: 3+ test cases

### 5. Currency Hook Tests (`src/hooks/__tests__/useCurrency.test.ts`)

**Covers**: useCurrency Hook (i18n)

**Test Cases**:
- ✅ **Format Currency**
  - ZAR, USD, EUR formatting
  - Negative values
  - Large numbers
  
- ✅ **Format Numbers**
  - Locale-specific formatting
  - Custom decimals
  
- ✅ **Format Percentage**
  - Decimal percentages
  
- ✅ **Parse Currency**
  - Parse ZAR, USD formats
  - Invalid input handling
  
- ✅ **Compact Notation**
  - K, M notation
  - Currency with compact notation
  
- ✅ **Dynamic Updates**
  - Currency changes reflection

**Total**: 15+ test cases

### 6. Business Store Tests (`src/store/__tests__/business.test.ts`)

**Covers**: Business Store (Zustand)

**Test Cases**:
- ✅ **State Management**
  - Set/clear business
  - Set/clear users
  - Loading state
  - Error state
  
- ✅ **Cache Management**
  - Last fetched tracking
  - Cache staleness (5-minute timeout)
  
- ✅ **State Reset**
  - Complete state reset
  
- ✅ **Roles & Permissions**
  - Set roles
  - Set permissions

**Total**: 10+ test cases

### 7. Supabase Utilities (`src/lib/__tests__/supabase.test.ts`)

**Covers**: getURL() function

**Test Cases**:
- ✅ Environment variable priority
  - VITE_SITE_URL
  - VITE_VERCEL_URL
  - window.location.origin
  - Localhost fallback
  
- ✅ URL Formatting
  - Add https://
  - Preserve protocol
  - Add trailing slash

**Total**: 8+ test cases

## Total Test Coverage

**Total Test Suites**: 7
**Total Test Cases**: 88+

## Test Categories

### 🔐 Authentication (40% of tests)
- User signup/signin
- OAuth flows
- Password management
- Session management
- Inactivity tracking

### 💼 Business Logic (30% of tests)
- Profit calculations
- Currency formatting
- Inventory management
- Business state management

### 🎨 UI Components (15% of tests)
- Form validation
- Error display
- User interactions

### 🛠️ Utilities (15% of tests)
- URL generation
- Currency i18n
- Calculations

## Running Tests

### Run All Tests
```bash
pnpm test
```

### Run Specific Test Suite
```bash
pnpm test auth.test
pnpm test EmailAuthForm.test
pnpm test calculations.test
```

### Run with Coverage
```bash
pnpm test --coverage
```

### Watch Mode (Development)
```bash
pnpm test --watch
```

## Test Configuration

**Framework**: Vitest
**Test Environment**: jsdom (browser simulation)
**Setup**: `src/setupTests.ts`

**Features**:
- Component testing with React Testing Library
- Mock Supabase client
- Mock Zustand stores
- Mock router hooks
- Canvas/Chart.js mocking

## Test Quality Standards

All tests follow these standards:
- ✅ **Isolated**: Each test is independent
- ✅ **Descriptive**: Clear test names
- ✅ **Fast**: No network calls
- ✅ **Reliable**: No flaky tests
- ✅ **Maintainable**: Easy to update

## Coverage Goals

Target coverage:
- **Authentication**: 90%+ (Critical path)
- **Business Logic**: 85%+ (Core features)
- **UI Components**: 70%+ (User-facing)
- **Utilities**: 90%+ (Reusable functions)

## Next Steps

### Additional Tests to Add:
1. ProtectedRoute component tests
2. AuthCallback component tests
3. Business onboarding tests
4. Inventory form tests
5. Order management tests
6. Invoice generation tests
7. Payment processing tests

### Integration Tests:
1. Complete signup → business creation flow
2. OAuth → dashboard redirect flow
3. Inventory → order creation flow
4. Invoice → payment flow

## CI/CD Integration

Tests should run on:
- ✅ Every commit
- ✅ Pull requests
- ✅ Before deployment
- ✅ Scheduled daily runs

## Troubleshooting

### Common Issues:

**Supabase mocks not working**:
```typescript
vi.mock('../../lib/supabase', () => ({
  supabase: { /* mock implementation */ }
}))
```

**Component tests failing**:
- Check if router is mocked in setupTests.ts
- Ensure all store states are reset in beforeEach

**Async tests timing out**:
- Use `waitFor()` from @testing-library/react
- Increase timeout if needed: `{ timeout: 5000 }`

## Documentation

- Test files: `**/__tests__/*.test.ts(x)`
- Setup: `src/setupTests.ts`
- Config: `vite.config.js`
