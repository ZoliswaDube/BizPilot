# BizPilot Mobile App

A React Native mobile application built with Expo for comprehensive business management.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Studio (for emulators)
- Physical device with Expo Go app (recommended for testing)

### Installation

1. **Clone and Navigate**
   ```bash
   cd BizPilotMobile
   ```

2. **Install Dependencies**
   ```bash
   # Remove any existing node_modules and lock files
   rm -rf node_modules package-lock.json yarn.lock
   
   # Install all dependencies
   npm install
   
   # Install Expo-specific dependencies
   npx expo install --fix
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your actual values
   # EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   # EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Start Development Server**
   ```bash
   npx expo start
   ```

5. **Run on Device**
   - Install Expo Go on your phone
   - Scan QR code from terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## 🔧 Troubleshooting Module Errors

If you encounter "Cannot find module" errors:

1. **Clean Install**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npx expo install --fix
   ```

2. **Check Node Version**
   ```bash
   node --version  # Should be 18+
   ```

3. **Clear Metro Cache**
   ```bash
   npx expo start --clear
   ```

4. **Ensure TypeScript Config**
   ```bash
   npx tsc --noEmit  # Check for TypeScript errors
   ```

## 📱 Features

### Core Functionality
- ✅ **Authentication**: Login/signup with biometric authentication
- ✅ **Dashboard**: Business metrics and quick actions
- ✅ **Orders**: Order management with barcode scanning
- ✅ **Customers**: Customer management with contact integration
- ✅ **Financial**: Expense tracking with receipt capture
- ✅ **Settings**: User profile and app configuration

### Mobile-Specific Features
- 📱 **Camera Integration**: Receipt capture and barcode scanning
- 👤 **Contact Import**: Import customers from device contacts
- 🔐 **Biometric Auth**: Fingerprint/Face ID authentication
- 📳 **Haptic Feedback**: Enhanced user experience
- 🔄 **Offline Support**: Queue operations when offline
- 🔔 **Push Notifications**: Business-critical alerts

## 🛠 Development

### Project Structure
```
BizPilotMobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   ├── auth.tsx           # Authentication screen
│   ├── index.tsx          # Entry point
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic services
│   ├── store/            # Zustand state management
│   └── styles/           # Theme and styling
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

### Key Technologies
- **Expo SDK 50+**: React Native framework
- **TypeScript**: Type safety
- **Zustand**: State management
- **React Navigation**: Navigation system
- **Expo Router**: File-based routing
- **AsyncStorage**: Local data persistence
- **Expo SecureStore**: Secure token storage

## 🔗 Database Integration

### MCP Server Integration
All database operations use the Supabase MCP Server pattern:

```typescript
// Example usage in hooks
const result = await mcp_supabase_execute_sql({
  query: 'SELECT * FROM orders WHERE business_id = $1',
  params: [businessId]
});
```

### Required Tables
- `orders` & `order_items` - Order management
- `customers` - Customer database
- `expenses` & `expense_categories` - Financial tracking
- `financial_reports` - Automated reporting
- `businesses` & `business_users` - Multi-tenant support

## 📦 Build & Deploy

### Development Build
```bash
npx expo build:ios
npx expo build:android
```

### Production Build with EAS
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build profiles
eas build:configure

# Build for production
eas build --platform all --profile production
```

### App Store Submission
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## ⚙️ Configuration

### Environment Variables
Create `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### App Configuration
Key settings in `app.json`:
- App name, version, and identifiers
- Permissions for camera, contacts, biometrics
- Splash screen and icon configuration
- Platform-specific settings

### Permissions Required
- **Camera**: Receipt capture and barcode scanning
- **Contacts**: Customer import functionality
- **Biometrics**: Secure authentication
- **Notifications**: Business alerts
- **Network**: Online/offline detection

## 🎨 Design System

### Theme Configuration
The app uses a consistent design system matching the web application:

```typescript
// Primary colors
primary: {
  500: '#a78bfa',  // Main brand color
  600: '#9333ea',  // Hover states
}

// Dark theme
dark: {
  950: '#020617',  // Background
  900: '#0f172a',  // Cards
  800: '#1e293b',  // Inputs
}
```

### Component Library
- `Button`: Primary, secondary, danger variants
- `Card`: Elevated containers with consistent styling
- `Input`: Form inputs with validation support
- All components support dark theme and accessibility

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Manual Testing Checklist
- [ ] Authentication flow (login/signup/biometric)
- [ ] Camera permissions and barcode scanning
- [ ] Contact import functionality
- [ ] Offline mode and sync
- [ ] Push notifications
- [ ] Cross-platform compatibility (iOS/Android)

## 🔧 Common Issues

### Module Resolution Errors
```bash
# Solution 1: Clean reinstall
rm -rf node_modules package-lock.json
npm install
npx expo install --fix

# Solution 2: Check TypeScript config
npx tsc --noEmit

# Solution 3: Clear Metro cache
npx expo start --clear
```

### Metro Bundler Issues
```bash
npx expo start --clear
```

### iOS Build Failures
- Ensure Xcode is updated
- Check provisioning profiles
- Verify bundle identifier

### Android Build Failures
- Update Android SDK
- Check Gradle version compatibility
- Verify signing configuration

## 📋 Development Scripts

### Available Scripts
```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm test           # Run unit tests
npm run lint       # Run ESLint
npm run type-check # Run TypeScript compiler check
```

### Deployment Scripts
```bash
# Make scripts executable
chmod +x scripts/deploy.sh scripts/test.sh

# Run comprehensive tests
./scripts/test.sh all

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
VERSION=1.0.0 ./scripts/deploy.sh production --submit
```

## 📞 Support

### Getting Help
1. Check the troubleshooting section above
2. Review Expo documentation: https://docs.expo.dev/
3. Check React Native documentation: https://reactnative.dev/
4. Ensure all dependencies are installed correctly

### Common Solutions
- Always run `npx expo install --fix` after adding new dependencies
- Use `npx expo start --clear` to clear Metro cache
- Check that Node.js version is 18 or higher
- Verify that all required permissions are declared in app.json

---

**Note**: This mobile app maintains feature parity with the web application while providing mobile-optimized user experience and hardware integration capabilities. 