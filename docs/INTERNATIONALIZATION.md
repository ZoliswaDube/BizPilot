# Internationalization (i18n) Guide

## Overview

BizPilot now supports multiple languages with automatic locale detection based on the user's geographic location. The application uses `react-i18next` with custom location-based language detection.

## Supported Languages

### South African Languages (11 Official Languages)
- **English** (en) - Default
- **Afrikaans** (af)
- **Zulu** (zu)
- **Xhosa** (xh)
- **Sotho** (st)
- **Northern Sotho/Sepedi** (nso)
- **Tswana** (tn)
- **Tsonga** (ts)
- **Swati** (ss)
- **Ndebele** (nr)
- **Venda** (ve)

### International Languages
- **Portuguese** (pt)
- **French** (fr)
- **Spanish** (es)
- **German** (de)
- **Arabic** (ar)
- **Chinese** (zh)
- **Hindi** (hi)

## Features

### 1. Location-Based Locale Detection
The application automatically detects your location using IP geolocation and sets the appropriate language:
- Users in South Africa: English (can be changed to any SA language)
- Users in Portugal/Brazil: Portuguese
- Users in France: French
- And so on...

### 2. Language Detection Order
The system checks for language preferences in this order:
1. URL query string (`?lng=en`)
2. Cookie
3. LocalStorage
4. SessionStorage
5. **Location-based detection** (IP geolocation)
6. Browser settings
7. HTML lang attribute

### 3. Language Selector Component
A UI component in the navigation sidebar allows users to change languages at any time. The selection is saved and persists across sessions.

## Usage for Developers

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <p>{t('app.description')}</p>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### Using Specific Namespace

```tsx
import { useTranslation } from 'react-i18next';

function LoginForm() {
  const { t } = useTranslation('auth');

  return (
    <div>
      <h1>{t('login.title')}</h1>
      <p>{t('login.subtitle')}</p>
    </div>
  );
}
```

### Translation with Interpolation

```tsx
// In translation file: "welcome": "Hello, {{name}}!"
const { t } = useTranslation();
<p>{t('messages.welcome', { name: 'John' })}</p>
```

### Changing Language Programmatically

```tsx
import { useTranslation } from 'react-i18next';

function LanguageButton() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return <button onClick={() => changeLanguage('af')}>Afrikaans</button>;
}
```

## Translation File Structure

```
public/
  locales/
    en/
      common.json      - Common translations (navigation, actions, etc.)
      auth.json        - Authentication-related translations
      dashboard.json   - Dashboard translations
      inventory.json   - Inventory translations
      [namespace].json - Other feature-specific translations
    af/
      common.json
      auth.json
      ...
    zu/
      common.json
      auth.json
      ...
```

## Adding New Translations

### 1. Create Translation Files

For each new language, create a directory under `public/locales/`:

```
public/locales/xh/common.json
public/locales/xh/auth.json
```

### 2. Add Translations

```json
{
  "app": {
    "name": "BizPilot",
    "description": "Lawula ishishini lakho ngokulula"
  },
  "actions": {
    "save": "Gcina",
    "cancel": "Rhoxisa"
  }
}
```

### 3. Update Language Selector

The language is already listed in `LanguageSelector.tsx`. If adding a completely new language, update the `languages` array:

```tsx
const languages: Language[] = [
  // ... existing languages
  { code: 'new_lang', name: 'Language Name', nativeName: 'Native Name', flag: '🏳️' },
];
```

## Translation Namespaces

The application uses the following namespaces:

- **common**: Shared translations (navigation, buttons, messages)
- **auth**: Authentication (login, register, password reset)
- **dashboard**: Dashboard page
- **inventory**: Inventory management
- **invoicing**: Invoice generation
- **payments**: Payment processing
- **customers**: Customer management
- **suppliers**: Supplier management
- **settings**: User settings

## Best Practices

### 1. Use Descriptive Keys
```json
// Good
"messages.saveSuccess": "Saved successfully"

// Bad
"msg1": "Saved successfully"
```

### 2. Organize by Feature
Group related translations together and use namespaces for different features.

### 3. Keep Translations Consistent
Use the same terminology across the application for better user experience.

### 4. Handle Plurals Properly
```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

### 5. Test All Languages
Regularly test the application in different languages to ensure proper layout and text rendering.

## Configuration

### i18n Config Location
`src/lib/i18n/config.ts`

### Location Detector
`src/lib/i18n/locationDetector.ts`

### Key Settings

```typescript
// Fallback language if detection fails
fallbackLng: 'en'

// Supported languages
supportedLngs: ['en', 'af', 'zu', ...] 

// Debug mode (only in development)
debug: import.meta.env.MODE === 'development'
```

## Geolocation API

The application uses multiple free geolocation APIs in fallback order:
1. ipapi.co
2. api.country.is
3. ip-api.com
4. ipwhois.app

If all fail, it falls back to browser language detection.

## Troubleshooting

### Translations Not Loading

1. Check browser console for errors
2. Verify translation files exist in `public/locales/[lng]/[namespace].json`
3. Ensure i18n is initialized in `main.tsx`

### Wrong Language Detected

1. Clear browser cache and localStorage
2. Manually set language using URL: `?lng=en`
3. Use the language selector in the UI

### Missing Translations

Missing keys will show the key itself (e.g., "app.name"). Add the translation to the appropriate JSON file.

## Future Enhancements

- [ ] Add more languages (Swahili, Yoruba, etc.)
- [ ] Implement currency localization
- [ ] Add date/time localization
- [ ] RTL support for Arabic and Hebrew
- [ ] Translation management dashboard
- [ ] Crowdsourced translations

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Language Codes (ISO 639-1)](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
