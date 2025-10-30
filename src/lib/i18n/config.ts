import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { detectLocationBasedLocale } from './locationDetector';

// Language detector plugin with custom location detection
const locationDetector = new LanguageDetector();
locationDetector.addDetector({
  name: 'locationBased',
  lookup: async () => {
    try {
      const locale = await detectLocationBasedLocale();
      return locale;
    } catch (error) {
      console.error('Location-based locale detection failed:', error);
      return null;
    }
  },
  cacheUserLanguage: (lng: string) => {
    localStorage.setItem('i18nextLng', lng);
  },
});

// Initialize i18next
i18n
  .use(Backend) // Load translations using http backend
  .use(locationDetector) // Detect user language with custom location detection
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'af', 'zu', 'xh', 'st', 'nso', 'tn', 'ts', 'ss', 'nr', 've', 'pt', 'fr', 'es', 'de', 'ar', 'zh', 'hi'],
    
    // Language detection order
    detection: {
      order: [
        'querystring',      // Check URL query string (?lng=en)
        'cookie',           // Check cookie
        'localStorage',     // Check localStorage
        'sessionStorage',   // Check sessionStorage
        'locationBased',    // Custom location-based detection
        'navigator',        // Check browser settings
        'htmlTag',          // Check html lang attribute
        'path',            // Check URL path
        'subdomain'        // Check subdomain
      ],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
    },

    // Backend configuration for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
    },

    // Namespace configuration
    ns: ['common', 'dashboard', 'inventory', 'invoicing', 'payments', 'customers', 'suppliers', 'auth', 'settings'],
    defaultNS: 'common',

    // React-specific options
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'b', 'u', 'em'],
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
    },

    // Debug mode (only in development)
    debug: import.meta.env.MODE === 'development',

    // Load languages synchronously
    load: 'languageOnly', // en instead of en-US

    // Preload languages
    preload: ['en'],

    // Key separator
    keySeparator: '.',

    // Namespace separator
    nsSeparator: ':',

    // Return empty string if key is missing
    returnEmptyString: true,

    // Return null if key is missing
    returnNull: false,

    // Automatically save missing keys
    saveMissing: import.meta.env.MODE === 'development',
    saveMissingTo: 'current',

    // Update missing keys
    updateMissing: import.meta.env.MODE === 'development',
  });

export default i18n;
