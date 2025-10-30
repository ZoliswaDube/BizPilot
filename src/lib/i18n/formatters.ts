/**
 * Financial Formatting Utilities
 * Format currency, numbers, dates, and percentages based on locale
 */

import { getCurrencyConfig, getStoredCurrencyPreference, DEFAULT_CURRENCY } from './currencyConfig';

/**
 * Format currency amount
 * 
 * @param amount - The numeric amount to format
 * @param currencyCode - Optional currency code (defaults to stored preference or ZAR)
 * @param options - Optional formatting options
 * 
 * @example
 * formatCurrency(1234.56, 'ZAR') // "R 1 234,56"
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 * formatCurrency(1234.56, 'EUR') // "1.234,56 €"
 */
export function formatCurrency(
  amount: number | string,
  currencyCode?: string,
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }

  const currency = currencyCode || getStoredCurrencyPreference() || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(currency);
  
  // Use native Intl.NumberFormat for accurate formatting
  try {
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: options?.minimumFractionDigits ?? config.decimalPlaces,
      maximumFractionDigits: options?.maximumFractionDigits ?? config.decimalPlaces,
    });
    
    let formatted = formatter.format(numAmount);
    
    // Add currency code if requested
    if (options?.showCode) {
      formatted = `${formatted} ${config.code}`;
    }
    
    // Remove symbol if not wanted
    if (options?.showSymbol === false) {
      formatted = formatted.replace(config.symbol, '').trim();
    }
    
    return formatted;
  } catch (error) {
    // Fallback to manual formatting
    return manualFormatCurrency(numAmount, config, options);
  }
}

/**
 * Manual currency formatting (fallback)
 */
function manualFormatCurrency(
  amount: number,
  config: ReturnType<typeof getCurrencyConfig>,
  options?: { showSymbol?: boolean; showCode?: boolean }
): string {
  // Format the number
  const fixedAmount = amount.toFixed(config.decimalPlaces);
  const [integerPart, decimalPart] = fixedAmount.split('.');
  
  // Add thousands separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
  
  // Combine integer and decimal parts
  let formatted = decimalPart 
    ? `${formattedInteger}${config.decimalSeparator}${decimalPart}`
    : formattedInteger;
  
  // Add currency symbol
  if (options?.showSymbol !== false) {
    if (config.symbolPosition === 'before') {
      formatted = config.symbolSpacing 
        ? `${config.symbol} ${formatted}` 
        : `${config.symbol}${formatted}`;
    } else {
      formatted = config.symbolSpacing 
        ? `${formatted} ${config.symbol}` 
        : `${formatted}${config.symbol}`;
    }
  }
  
  // Add currency code
  if (options?.showCode) {
    formatted = `${formatted} ${config.code}`;
  }
  
  return formatted;
}

/**
 * Format number with locale-specific separators
 * 
 * @example
 * formatNumber(1234.56, 'en-ZA') // "1 234,56"
 * formatNumber(1234.56, 'en-US') // "1,234.56"
 */
export function formatNumber(
  value: number | string,
  locale?: string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }

  const currencyCode = getStoredCurrencyPreference() || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(currencyCode);
  const localeToUse = locale || config.locale;
  
  try {
    const formatter = new Intl.NumberFormat(localeToUse, {
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    });
    
    return formatter.format(numValue);
  } catch (error) {
    return numValue.toFixed(options?.maximumFractionDigits ?? 2);
  }
}

/**
 * Format percentage
 * 
 * @example
 * formatPercentage(0.15) // "15%"
 * formatPercentage(0.1534, 1) // "15.3%"
 */
export function formatPercentage(
  value: number,
  decimalPlaces: number = 0
): string {
  const percentage = value * 100;
  return `${percentage.toFixed(decimalPlaces)}%`;
}

/**
 * Format date for financial reports
 * 
 * @example
 * formatFinancialDate(new Date()) // "29 Oct 2024" (for en-ZA)
 * formatFinancialDate(new Date(), 'short') // "29/10/2024"
 */
export function formatFinancialDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale?: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }

  const currencyCode = getStoredCurrencyPreference() || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(currencyCode);
  const localeToUse = locale || config.locale;
  
  try {
    const options: Intl.DateTimeFormatOptions = 
      format === 'short' 
        ? { year: 'numeric', month: '2-digit', day: '2-digit' }
        : format === 'long'
        ? { year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'short', day: 'numeric' };
    
    return new Intl.DateTimeFormat(localeToUse, options).format(dateObj);
  } catch (error) {
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format date and time for financial reports
 */
export function formatFinancialDateTime(
  date: Date | string,
  locale?: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }

  const currencyCode = getStoredCurrencyPreference() || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(currencyCode);
  const localeToUse = locale || config.locale;
  
  try {
    return new Intl.DateTimeFormat(localeToUse, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    return dateObj.toLocaleString();
  }
}

/**
 * Parse currency string to number
 * 
 * @example
 * parseCurrency("R 1 234,56") // 1234.56
 * parseCurrency("$1,234.56") // 1234.56
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove all non-numeric characters except decimal separator
  const cleaned = value.replace(/[^\d.,\-]/g, '');
  
  // Detect decimal separator (last occurrence of . or ,)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  let normalized: string;
  
  if (lastComma > lastDot) {
    // Comma is decimal separator (European style)
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Dot is decimal separator (US/UK style)
    normalized = cleaned.replace(/,/g, '');
  }
  
  return parseFloat(normalized) || 0;
}

/**
 * Format compact number (e.g., 1.2K, 1.5M)
 * 
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 */
export function formatCompactNumber(value: number, locale?: string): string {
  const currencyCode = getStoredCurrencyPreference() || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(currencyCode);
  const localeToUse = locale || config.locale;
  
  try {
    return new Intl.NumberFormat(localeToUse, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);
  } catch (error) {
    // Fallback
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }
}

/**
 * Format currency for compact display (with K, M suffixes)
 */
export function formatCompactCurrency(
  amount: number,
  currencyCode?: string,
  locale?: string
): string {
  const currency = currencyCode || getStoredCurrencyPreference() || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(currency);
  const localeToUse = locale || config.locale;
  
  try {
    return new Intl.NumberFormat(localeToUse, {
      style: 'currency',
      currency: config.code,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch (error) {
    const compactNumber = formatCompactNumber(amount, localeToUse);
    return `${config.symbol}${compactNumber}`;
  }
}
