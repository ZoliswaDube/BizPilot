/**
 * Currency Hook
 * React hook that connects components to the global currency store
 * Ensures reactive updates when currency changes
 */

import { useCurrencyStore } from '../store/currency';

export function useCurrency() {
  // Get all state and actions from the global store
  const {
    currency,
    isLoading,
    setCurrency,
    getConfig,
    getAvailableCurrencies,
    format,
    formatNumber,
    formatPercentage,
    formatDate,
    formatDateTime,
    parseCurrency,
    formatCompact,
    formatCompactCurrency,
  } = useCurrencyStore();

  // Get computed values
  const config = getConfig();
  const availableCurrencies = getAvailableCurrencies();

  return {
    // Current state
    currency,
    config,
    isLoading,

    // Actions
    setCurrency,

    // Available options
    availableCurrencies,

    // Formatting functions (all reactive to currency changes)
    format,            // Format currency: format(1234.56) => "R 1 234,56"
    formatNumber,      // Format number: formatNumber(1234.56) => "1 234,56"
    formatPercentage,  // Format percentage: formatPercentage(0.15) => "15%"
    formatDate,        // Format date: formatDate(new Date()) => "29 Oct 2024"
    formatDateTime,    // Format date+time: formatDateTime(new Date()) => "29 Oct 2024, 14:30"
    parseCurrency,     // Parse currency string: parseCurrency("R 1 234,56") => 1234.56
    formatCompact,     // Format compact: formatCompact(1234567) => "1.2M"
    formatCompactCurrency, // Format compact currency: formatCompactCurrency(1234567) => "R1.2M"
  };
}
