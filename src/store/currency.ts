/**
 * Global Currency Store
 * Manages currency state globally for reactive updates across all components
 */

import { create } from 'zustand'
import {
  getCurrencyOrDetect,
  getCurrencyConfig,
  getAvailableCurrencies,
  storeCurrencyPreference,
  getStoredCurrencyPreference,
  DEFAULT_CURRENCY,
} from '../lib/i18n/currencyConfig'
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatFinancialDate,
  formatFinancialDateTime,
  parseCurrency,
  formatCompactNumber,
  formatCompactCurrency,
} from '../lib/i18n/formatters'

interface CurrencyState {
  // State
  currency: string
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setCurrency: (currency: string) => void
  initializeCurrency: () => Promise<void>
  
  // Computed values (getters)
  getConfig: () => ReturnType<typeof getCurrencyConfig>
  getAvailableCurrencies: () => ReturnType<typeof getAvailableCurrencies>
  
  // Formatting functions
  format: (amount: number | string, options?: Parameters<typeof formatCurrency>[2]) => string
  formatNumber: (value: number | string, options?: Parameters<typeof formatNumber>[2]) => string
  formatPercentage: (value: number, decimalPlaces?: number) => string
  formatDate: (date: Date | string, format?: Parameters<typeof formatFinancialDate>[1]) => string
  formatDateTime: (date: Date | string) => string
  parseCurrency: (value: string) => number | null
  formatCompact: (value: number) => string
  formatCompactCurrency: (amount: number) => string
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  // Initial state
  currency: getStoredCurrencyPreference() || DEFAULT_CURRENCY,
  isLoading: false,
  isInitialized: false,

  // Set currency and persist
  setCurrency: (newCurrency: string) => {
    console.log('[CurrencyStore] Setting currency to:', newCurrency)
    storeCurrencyPreference(newCurrency)
    set({ currency: newCurrency })
    
    // Trigger a custom event for any listeners
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: newCurrency }))
  },

  // Initialize currency (detect or use stored)
  initializeCurrency: async () => {
    const state = get()
    if (state.isInitialized) return
    
    console.log('[CurrencyStore] Initializing currency...')
    set({ isLoading: true })
    
    try {
      const detectedCurrency = await getCurrencyOrDetect()
      console.log('[CurrencyStore] Detected currency:', detectedCurrency)
      set({ 
        currency: detectedCurrency, 
        isLoading: false, 
        isInitialized: true 
      })
    } catch (error) {
      console.error('[CurrencyStore] Failed to initialize currency:', error)
      set({ 
        currency: DEFAULT_CURRENCY, 
        isLoading: false, 
        isInitialized: true 
      })
    }
  },

  // Get current config
  getConfig: () => {
    const { currency } = get()
    return getCurrencyConfig(currency)
  },

  // Get available currencies
  getAvailableCurrencies: () => {
    return getAvailableCurrencies()
  },

  // Formatting functions that use current currency
  format: (amount, options) => {
    const { currency } = get()
    return formatCurrency(amount, currency, options)
  },

  formatNumber: (value, options) => {
    const { currency } = get()
    const config = getCurrencyConfig(currency)
    return formatNumber(value, config.locale, options)
  },

  formatPercentage: (value, decimalPlaces) => {
    return formatPercentage(value, decimalPlaces)
  },

  formatDate: (date, format) => {
    const { currency } = get()
    const config = getCurrencyConfig(currency)
    return formatFinancialDate(date, format, config.locale)
  },

  formatDateTime: (date) => {
    const { currency } = get()
    const config = getCurrencyConfig(currency)
    return formatFinancialDateTime(date, config.locale)
  },

  parseCurrency: (value) => {
    return parseCurrency(value)
  },

  formatCompact: (value) => {
    const { currency } = get()
    const config = getCurrencyConfig(currency)
    return formatCompactNumber(value, config.locale)
  },

  formatCompactCurrency: (amount) => {
    const { currency } = get()
    const config = getCurrencyConfig(currency)
    return formatCompactCurrency(amount, currency, config.locale)
  },
}))

// Initialize on store creation
useCurrencyStore.getState().initializeCurrency()
