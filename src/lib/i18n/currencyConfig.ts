/**
 * Currency and Financial Internationalization Configuration
 * Handles currency formatting, number formatting, and financial display based on locale
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
  symbolSpacing: boolean;
}

// Currency configurations for different countries
export const currencyConfigs: Record<string, CurrencyConfig> = {
  // South Africa
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    locale: 'en-ZA',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    symbolPosition: 'before',
    symbolSpacing: true,
  },
  
  // United States
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    symbolSpacing: false,
  },
  
  // European Union
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    symbolPosition: 'after',
    symbolSpacing: true,
  },
  
  // United Kingdom
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    symbolSpacing: false,
  },
  
  // Japan
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '',
    symbolPosition: 'before',
    symbolSpacing: false,
  },
  
  // China
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    locale: 'zh-CN',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    symbolSpacing: false,
  },
  
  // India
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    symbolSpacing: true,
  },
  
  // Brazil
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    locale: 'pt-BR',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    symbolPosition: 'before',
    symbolSpacing: true,
  },
  
  // Canada
  CAD: {
    code: 'CAD',
    symbol: '$',
    name: 'Canadian Dollar',
    locale: 'en-CA',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    symbolSpacing: false,
  },
  
  // Australia
  AUD: {
    code: 'AUD',
    symbol: '$',
    name: 'Australian Dollar',
    locale: 'en-AU',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    symbolSpacing: false,
  },
  
  // Switzerland
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    locale: 'de-CH',
    decimalPlaces: 2,
    thousandsSeparator: "'",
    decimalSeparator: '.',
    symbolPosition: 'before',
    symbolSpacing: true,
  },
};

// Country to currency mapping
export const countryToCurrency: Record<string, string> = {
  ZA: 'ZAR', // South Africa
  US: 'USD', // United States
  GB: 'GBP', // United Kingdom
  DE: 'EUR', // Germany
  FR: 'EUR', // France
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  NL: 'EUR', // Netherlands
  BE: 'EUR', // Belgium
  AT: 'EUR', // Austria
  PT: 'EUR', // Portugal
  JP: 'JPY', // Japan
  CN: 'CNY', // China
  IN: 'INR', // India
  BR: 'BRL', // Brazil
  CA: 'CAD', // Canada
  AU: 'AUD', // Australia
  CH: 'CHF', // Switzerland
  MX: 'MXN', // Mexico
  AR: 'ARS', // Argentina
  CL: 'CLP', // Chile
  CO: 'COP', // Colombia
  PE: 'PEN', // Peru
};

// Default currency (South African Rand)
export const DEFAULT_CURRENCY = 'ZAR';

/**
 * Get currency config by code
 */
export function getCurrencyConfig(currencyCode: string): CurrencyConfig {
  return currencyConfigs[currencyCode] || currencyConfigs[DEFAULT_CURRENCY];
}

/**
 * Get currency by country code
 */
export function getCurrencyByCountry(countryCode: string): string {
  return countryToCurrency[countryCode.toUpperCase()] || DEFAULT_CURRENCY;
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies(): Array<{ code: string; name: string; symbol: string }> {
  return Object.entries(currencyConfigs).map(([code, config]) => ({
    code,
    name: config.name,
    symbol: config.symbol,
  }));
}

/**
 * Detect currency based on user's location
 */
export async function detectCurrency(): Promise<string> {
  try {
    // Try multiple geolocation services
    const services = [
      'https://ipapi.co/json/',
      'https://api.country.is/',
      'http://ip-api.com/json/',
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        if (!response.ok) continue;

        const data = await response.json();
        const countryCode = data.country_code || data.countryCode || data.country;
        
        if (countryCode) {
          const currency = getCurrencyByCountry(countryCode);
          console.log(`Detected country: ${countryCode} → Currency: ${currency}`);
          return currency;
        }
      } catch (err) {
        console.warn(`Geolocation service ${service} failed:`, err);
        continue;
      }
    }

    // Fallback to default
    return DEFAULT_CURRENCY;
  } catch (error) {
    console.error('Currency detection error:', error);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Store user's currency preference
 */
export function storeCurrencyPreference(currencyCode: string): void {
  localStorage.setItem('userCurrency', currencyCode);
}

/**
 * Get stored currency preference
 */
export function getStoredCurrencyPreference(): string | null {
  return localStorage.getItem('userCurrency');
}

/**
 * Get currency or detect it
 */
export async function getCurrencyOrDetect(): Promise<string> {
  // Check stored preference first
  const stored = getStoredCurrencyPreference();
  if (stored && currencyConfigs[stored]) {
    return stored;
  }

  // Detect based on location
  const detected = await detectCurrency();
  
  // Store the detected currency
  storeCurrencyPreference(detected);
  
  return detected;
}
