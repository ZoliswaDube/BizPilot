/**
 * Location-based locale detector
 * Uses IP geolocation to determine user's country and map it to appropriate locale
 */

// Country code to locale mapping
const countryLocaleMap: Record<string, string> = {
  // South Africa - Default to English, but support all official languages
  'ZA': 'en', // Can be changed based on user preference
  
  // Portuguese-speaking countries
  'PT': 'pt', // Portugal
  'BR': 'pt', // Brazil
  'AO': 'pt', // Angola
  'MZ': 'pt', // Mozambique
  
  // French-speaking countries
  'FR': 'fr', // France
  'BE': 'fr', // Belgium
  'CH': 'fr', // Switzerland
  'CA': 'fr', // Canada
  'MA': 'fr', // Morocco
  'TN': 'fr', // Tunisia
  'SN': 'fr', // Senegal
  'CI': 'fr', // Côte d'Ivoire
  
  // Spanish-speaking countries
  'ES': 'es', // Spain
  'MX': 'es', // Mexico
  'AR': 'es', // Argentina
  'CO': 'es', // Colombia
  'PE': 'es', // Peru
  'VE': 'es', // Venezuela
  'CL': 'es', // Chile
  
  // German-speaking countries
  'DE': 'de', // Germany
  'AT': 'de', // Austria
  
  // Arabic-speaking countries
  'SA': 'ar', // Saudi Arabia
  'EG': 'ar', // Egypt
  'AE': 'ar', // UAE
  'JO': 'ar', // Jordan
  'LB': 'ar', // Lebanon
  
  // Chinese-speaking countries
  'CN': 'zh', // China
  'TW': 'zh', // Taiwan
  'HK': 'zh', // Hong Kong
  'SG': 'zh', // Singapore
  
  // Hindi-speaking countries
  'IN': 'hi', // India
  
  // English-speaking countries
  'US': 'en',
  'GB': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'NG': 'en',
  'KE': 'en',
  'GH': 'en',
};

// South African languages mapping
const southAfricanLanguages: Record<string, string> = {
  'Afrikaans': 'af',
  'Zulu': 'zu',
  'Xhosa': 'xh',
  'Sotho': 'st',
  'Northern Sotho': 'nso',
  'Tswana': 'tn',
  'Tsonga': 'ts',
  'Swati': 'ss',
  'Ndebele': 'nr',
  'Venda': 've',
  'English': 'en',
};

interface GeolocationResponse {
  country_code?: string;
  country?: string;
  countryCode?: string;
  error?: boolean;
  message?: string;
}

/**
 * Detect locale based on user's location using multiple free IP geolocation APIs
 */
export async function detectLocationBasedLocale(): Promise<string | null> {
  try {
    // Try multiple free geolocation services in order
    const services = [
      'https://ipapi.co/json/',
      'https://api.country.is/',
      'http://ip-api.com/json/',
      'https://ipwhois.app/json/',
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) continue;

        const data: GeolocationResponse = await response.json();
        
        // Check if there's an error in the response
        if (data.error) continue;

        // Extract country code from different response formats
        const countryCode = data.country_code || data.countryCode || data.country;
        
        if (!countryCode) continue;

        // Map country code to locale
        const locale = countryLocaleMap[countryCode.toUpperCase()];
        
        if (locale) {
          console.log(`Location detected: ${countryCode} → Locale: ${locale}`);
          return locale;
        }

        // If country not in our map, return English as fallback
        console.log(`Country ${countryCode} not in locale map, using English`);
        return 'en';

      } catch (serviceError) {
        console.warn(`Geolocation service ${service} failed:`, serviceError);
        continue; // Try next service
      }
    }

    // If all services failed, return null to fall back to other detection methods
    console.warn('All geolocation services failed');
    return null;

  } catch (error) {
    console.error('Location-based locale detection error:', error);
    return null;
  }
}

/**
 * Get available South African languages
 */
export function getSouthAfricanLanguages(): Array<{ code: string; name: string }> {
  return Object.entries(southAfricanLanguages).map(([name, code]) => ({
    code,
    name,
  }));
}

/**
 * Detect user's preferred language from browser settings
 */
export function detectBrowserLocale(): string {
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  if (!browserLang) return 'en';
  
  // Extract the language code (e.g., 'en' from 'en-US')
  const langCode = browserLang.split('-')[0];
  
  return langCode;
}

/**
 * Store user's language preference
 */
export function storeLanguagePreference(locale: string): void {
  localStorage.setItem('userLanguagePreference', locale);
  localStorage.setItem('i18nextLng', locale);
  
  // Update HTML lang attribute
  document.documentElement.lang = locale;
}

/**
 * Get user's stored language preference
 */
export function getStoredLanguagePreference(): string | null {
  return localStorage.getItem('userLanguagePreference');
}

/**
 * Clear stored language preference (use for testing)
 */
export function clearLanguagePreference(): void {
  localStorage.removeItem('userLanguagePreference');
  localStorage.removeItem('i18nextLng');
}
