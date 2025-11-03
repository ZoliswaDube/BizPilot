# BizPilot Mobile - Testing Guide

## Overview

This comprehensive testing guide covers all aspects of the BizPilot mobile application, from unit tests to end-to-end user acceptance testing.

## 🧪 Testing Strategy

### Testing Pyramid
1. **Unit Tests (70%)** - Individual component and function testing
2. **Integration Tests (20%)** - Service and API integration testing  
3. **E2E Tests (10%)** - Complete user workflow testing

### Testing Environments
- **Development** - Local development with Expo Go
- **Staging** - TestFlight (iOS) / Internal Testing (Android)
- **Production** - App Store releases

## 📱 Device Testing Matrix

### iOS Testing
| Device | iOS Version | Screen Size | Notes |
|--------|-------------|-------------|-------|
| iPhone 15 Pro | 17.0+ | 6.1" | Primary test device |
| iPhone 14 | 16.0+ | 6.1" | Current generation |
| iPhone SE (3rd) | 15.0+ | 4.7" | Small screen testing |
| iPad Pro 12.9" | 16.0+ | 12.9" | Tablet optimization |
| iPad Air | 15.0+ | 10.9" | Standard tablet |

### Android Testing
| Device | Android Version | Screen Size | API Level |
|--------|----------------|-------------|-----------|
| Pixel 8 | 14 | 6.2" | 34 |
| Samsung Galaxy S23 | 13 | 6.1" | 33 |
| Samsung Galaxy A54 | 13 | 6.4" | 33 |
| OnePlus 11 | 13 | 6.7" | 33 |
| Tablet Samsung Tab S9 | 13 | 11.0" | 33 |

## 🔧 Testing Setup

### Prerequisites
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/jest-native
npm install --save-dev jest-expo
npm install --save-dev detox
```

### Jest Configuration
Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
};
```

### Detox Configuration
Create `.detoxrc.js`:
```javascript
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    'ios.sim.debug': {
      device: 'ios.simulator',
      app: 'ios.debug'
    },
    'android.emu.debug': {
      device: 'android.emulator',
      app: 'android.debug'
    }
  }
};
```

## 📋 Test Cases

### 1. Authentication Testing

#### 1.1 Login Functionality
**Test Case**: Valid Login
```
GIVEN user has valid credentials
WHEN user enters email and password
AND taps "Sign In"
THEN user should be logged in
AND redirected to dashboard
```

**Test Case**: Invalid Login
```
GIVEN user has invalid credentials
WHEN user enters wrong email/password
AND taps "Sign In"
THEN error message should display
AND user remains on login screen
```

**Test Case**: Biometric Authentication
```
GIVEN user has biometric auth enabled
WHEN user taps "Use Biometric Authentication"
AND provides valid biometric
THEN user should be logged in
```

#### 1.2 Registration Functionality
**Test Case**: Valid Registration
```
GIVEN user provides valid registration data
WHEN user fills all required fields
AND taps "Create Account"
THEN account should be created
AND user should be logged in
```

**Test Case**: Password Confirmation
```
GIVEN user provides mismatched passwords
WHEN user taps "Create Account"
THEN error message should display
AND registration should fail
```

### 2. Dashboard Testing

#### 2.1 Data Display
**Test Case**: Dashboard Metrics
```
GIVEN user is logged in
WHEN dashboard loads
THEN all key metrics should display
AND data should be current
```

**Test Case**: Pull to Refresh
```
GIVEN user is on dashboard
WHEN user pulls down to refresh
THEN loading indicator should show
AND data should be updated
```

#### 2.2 Navigation
**Test Case**: Tab Navigation
```
GIVEN user is on dashboard
WHEN user taps any tab icon
THEN corresponding screen should load
AND tab should be highlighted
```

### 3. Order Management Testing

#### 3.1 Order Creation
**Test Case**: Create Basic Order
```
GIVEN user is on orders screen
WHEN user taps "New Order"
AND fills required order details
AND adds at least one item
AND taps "Create Order"
THEN order should be created
AND appear in orders list
```

**Test Case**: Barcode Scanning
```
GIVEN user is creating an order
WHEN user taps camera icon
AND scans a valid barcode
THEN product should be identified
AND added to order items
```

#### 3.2 Order Management
**Test Case**: Update Order Status
```
GIVEN user has pending order
WHEN user selects order
AND changes status to "Confirmed"
THEN order status should update
AND reflect in orders list
```

**Test Case**: Order Search
```
GIVEN user has multiple orders
WHEN user types in search field
THEN orders should filter by search term
AND display relevant results
```

### 4. Customer Management Testing

#### 4.1 Customer Creation
**Test Case**: Manual Customer Creation
```
GIVEN user is on customers screen
WHEN user taps "Add Customer"
AND fills customer details
AND taps "Save"
THEN customer should be created
AND appear in customer list
```

**Test Case**: Contact Import
```
GIVEN user grants contact permission
WHEN user taps "Import from Contacts"
AND selects a contact
THEN customer should be created
WITH contact information
```

#### 4.2 Customer Interaction
**Test Case**: Call Customer
```
GIVEN customer has phone number
WHEN user taps call button
THEN phone app should open
WITH customer's number
```

**Test Case**: Email Customer
```
GIVEN customer has email address
WHEN user taps email button
THEN email app should open
WITH customer's email
```

### 5. Financial Management Testing

#### 5.1 Expense Tracking
**Test Case**: Manual Expense Entry
```
GIVEN user is on financial screen
WHEN user taps "Add Expense"
AND fills expense details
AND taps "Save"
THEN expense should be recorded
AND appear in expenses list
```

**Test Case**: Receipt Capture
```
GIVEN user wants to add expense
WHEN user taps camera icon
AND captures receipt photo
THEN image should be attached
AND expense details extracted
```

#### 5.2 Financial Reporting
**Test Case**: Report Generation
```
GIVEN user has financial data
WHEN user views financial overview
THEN all metrics should display
AND calculations should be accurate
```

### 6. Offline Functionality Testing

#### 6.1 Offline Operations
**Test Case**: Create Order Offline
```
GIVEN device is offline
WHEN user creates an order
THEN order should be queued
AND user notified it's pending sync
```

**Test Case**: Auto-Sync
```
GIVEN user has offline operations
WHEN device comes back online
THEN operations should sync automatically
AND user should be notified of success
```

#### 6.2 Cached Data
**Test Case**: Offline Data Access
```
GIVEN user was recently online
WHEN device goes offline
THEN cached data should be available
AND user can view recent information
```

### 7. Performance Testing

#### 7.1 App Launch
**Test Case**: Cold Start Performance
```
GIVEN app is not in memory
WHEN user launches app
THEN app should load within 3 seconds
AND splash screen should display
```

**Test Case**: Hot Start Performance
```
GIVEN app is in background
WHEN user returns to app
THEN app should resume within 1 second
```

#### 7.2 List Performance
**Test Case**: Large Data Sets
```
GIVEN user has 1000+ orders
WHEN user views orders list
THEN list should load smoothly
AND scrolling should be fluid
```

### 8. Security Testing

#### 8.1 Data Protection
**Test Case**: Biometric Lock
```
GIVEN app is backgrounded for 5 minutes
WHEN user returns to app
THEN biometric auth should be required
```

**Test Case**: Secure Storage
```
GIVEN user logs out
WHEN examining device storage
THEN no sensitive data should remain
```

#### 8.2 Network Security
**Test Case**: SSL/TLS Verification
```
GIVEN app makes API calls
WHEN monitoring network traffic
THEN all calls should use HTTPS
AND certificates should be valid
```

### 9. Accessibility Testing

#### 9.1 Screen Reader Support
**Test Case**: VoiceOver/TalkBack
```
GIVEN user enables screen reader
WHEN navigating the app
THEN all elements should be announced
AND navigation should be possible
```

#### 9.2 Visual Accessibility
**Test Case**: High Contrast Mode
```
GIVEN user enables high contrast
WHEN using the app
THEN all text should be readable
AND UI elements should be distinguishable
```

### 10. Integration Testing

#### 10.1 Camera Integration
**Test Case**: Camera Permission
```
GIVEN user hasn't granted camera access
WHEN feature requires camera
THEN permission prompt should appear
AND graceful fallback provided
```

#### 10.2 Contact Integration
**Test Case**: Contact Permission
```
GIVEN user grants contact access
WHEN importing contacts
THEN contacts should load correctly
AND privacy should be maintained
```

## 🚀 Automated Testing Scripts

### Unit Test Example
```typescript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../src/components/ui/Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button title="Test Button" onPress={() => {}} loading={true} />
    );
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### E2E Test Example
```typescript
// e2e/auth.e2e.js
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login with valid credentials', async () => {
    // Wait for login screen
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Enter credentials
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');

    // Tap login button
    await element(by.id('login-button')).tap();

    // Verify dashboard appears
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.text('Invalid email or password')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## 📊 Test Execution

### Running Tests
```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (iOS)
npm run e2e:ios

# E2E tests (Android)
npm run e2e:android

# Performance tests
npm run test:performance
```

### Test Reports
- **Coverage Report**: `coverage/lcov-report/index.html`
- **E2E Results**: `e2e/reports/`
- **Performance Metrics**: `performance/reports/`

## 🐛 Bug Reporting Template

### Bug Report Format
```
**Title**: Brief description of the issue

**Environment**:
- Device: [iPhone 15 Pro / Pixel 8]
- OS Version: [iOS 17.0 / Android 14]
- App Version: [1.0.0]
- Build: [Production/Staging/Dev]

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**:
Description of expected behavior

**Actual Result**:
Description of what actually happened

**Screenshots/Videos**:
Attach relevant media

**Logs**:
Relevant error logs or console output

**Priority**: [Critical/High/Medium/Low]
**Severity**: [Blocker/Major/Minor/Trivial]
```

## ✅ Pre-Release Checklist

### Functional Testing
- [ ] All authentication flows work
- [ ] All CRUD operations function correctly
- [ ] Camera and barcode scanning work
- [ ] Contact import functions properly
- [ ] Offline mode and sync work
- [ ] Push notifications are received
- [ ] Biometric authentication works
- [ ] All navigation flows are smooth

### Performance Testing
- [ ] App launches in under 3 seconds
- [ ] No memory leaks detected
- [ ] Smooth scrolling in all lists
- [ ] Image loading is optimized
- [ ] Network requests are efficient

### Compatibility Testing
- [ ] Works on minimum iOS version (14.0)
- [ ] Works on minimum Android version (API 24)
- [ ] Supports various screen sizes
- [ ] Works in portrait and landscape
- [ ] Dark mode functions correctly

### Security Testing
- [ ] No sensitive data in logs
- [ ] Secure storage implementation verified
- [ ] Network traffic is encrypted
- [ ] App locks after timeout
- [ ] Biometric data is secure

### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] Large text mode support
- [ ] Voice control compatibility
- [ ] Switch control support

### Store Compliance
- [ ] App follows platform guidelines
- [ ] All required permissions are justified
- [ ] Privacy policy is accessible
- [ ] Terms of service are included
- [ ] App rating is appropriate

## 📈 Quality Metrics

### Success Criteria
- **Test Coverage**: >80% code coverage
- **Bug Density**: <2 bugs per 1000 lines of code
- **Performance**: App launch <3 seconds
- **Crash Rate**: <0.1% of sessions
- **User Rating**: >4.5 stars average

### Monitoring
- **Crash Reporting**: Sentry integration
- **Performance**: React Native Performance
- **Analytics**: Custom event tracking
- **User Feedback**: In-app feedback system

This comprehensive testing guide ensures the BizPilot mobile app meets the highest quality standards before release. 