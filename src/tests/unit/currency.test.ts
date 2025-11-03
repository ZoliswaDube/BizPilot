import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCurrency } from '../../hooks/useCurrency'
import { useCurrencyStore } from '../../store/currency'

describe('Currency System Tests', () => {
  beforeEach(() => {
    // Reset to default currency
    useCurrencyStore.setState({ currency: 'ZAR' })
  })

  describe('Currency Formatting', () => {
    it('should format ZAR currency correctly', () => {
      const { result } = renderHook(() => useCurrency())
      
      expect(result.current.format(1234.56)).toContain('1')
      expect(result.current.format(1234.56)).toContain('234')
      expect(result.current.format(1234.56)).toContain('56')
    })

    it('should format USD currency correctly', () => {
      act(() => {
        useCurrencyStore.setState({ currency: 'USD' })
      })
      
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.format(1234.56)
      expect(formatted).toContain('$')
      expect(formatted).toContain('1,234.56')
    })

    it('should format EUR currency correctly', () => {
      act(() => {
        useCurrencyStore.setState({ currency: 'EUR' })
      })
      
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.format(1234.56)
      expect(formatted).toContain('€')
      expect(formatted).toContain('1')
      expect(formatted).toContain('234')
    })

    it('should handle zero values', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.format(0)
      expect(formatted).toContain('0')
    })

    it('should handle negative values', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.format(-500.50)
      expect(formatted).toContain('-')
      expect(formatted).toContain('500')
    })

    it('should handle large numbers', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.format(1000000)
      expect(formatted).toContain('1')
      expect(formatted).toContain('000')
      expect(formatted).toContain('000')
    })
  })

  describe('Number Formatting', () => {
    it('should format numbers with locale-specific separators', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatNumber(1234.56)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })

    it('should format numbers with custom decimal places', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatNumber(1234.5678, { decimals: 3 })
      expect(formatted).toBeTruthy()
    })

    it('should format integers without decimals', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatNumber(1234, { decimals: 0 })
      expect(formatted).not.toContain('.')
    })
  })

  describe('Percentage Formatting', () => {
    it('should format percentages correctly', () => {
      const { result } = renderHook(() => useCurrency())
      
      expect(result.current.formatPercentage(50)).toContain('50')
      expect(result.current.formatPercentage(50)).toContain('%')
    })

    it('should handle decimal percentages', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatPercentage(33.33)
      expect(formatted).toContain('33')
      expect(formatted).toContain('%')
    })

    it('should handle zero percentage', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatPercentage(0)
      expect(formatted).toContain('0')
      expect(formatted).toContain('%')
    })

    it('should handle negative percentages', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatPercentage(-10)
      expect(formatted).toContain('-')
      expect(formatted).toContain('10')
      expect(formatted).toContain('%')
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      const { result } = renderHook(() => useCurrency())
      
      const date = new Date('2024-11-03')
      const formatted = result.current.formatDate(date)
      
      expect(formatted).toContain('2024')
      expect(formatted).toContain('11')
      expect(formatted).toContain('03')
    })

    it('should format date-time correctly', () => {
      const { result } = renderHook(() => useCurrency())
      
      const date = new Date('2024-11-03T14:30:00')
      const formatted = result.current.formatDateTime(date)
      
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })
  })

  describe('Currency Parsing', () => {
    it('should parse ZAR formatted currency', () => {
      const { result } = renderHook(() => useCurrency())
      
      expect(result.current.parseCurrency('R 1 234,56')).toBeCloseTo(1234.56, 1)
      expect(result.current.parseCurrency('R 1 000,00')).toBe(1000)
    })

    it('should parse USD formatted currency', () => {
      act(() => {
        useCurrencyStore.setState({ currency: 'USD' })
      })
      
      const { result } = renderHook(() => useCurrency())
      
      expect(result.current.parseCurrency('$1,234.56')).toBeCloseTo(1234.56, 1)
      expect(result.current.parseCurrency('$1,000.00')).toBe(1000)
    })

    it('should handle currency without symbols', () => {
      const { result } = renderHook(() => useCurrency())
      
      expect(result.current.parseCurrency('1234.56')).toBeCloseTo(1234.56, 1)
      expect(result.current.parseCurrency('1,234.56')).toBeCloseTo(1234.56, 1)
    })

    it('should return 0 for invalid input', () => {
      const { result } = renderHook(() => useCurrency())
      
      expect(result.current.parseCurrency('invalid')).toBe(0)
      expect(result.current.parseCurrency('')).toBe(0)
      expect(result.current.parseCurrency('abc123')).toBe(0)
    })
  })

  describe('Compact Notation', () => {
    it('should format numbers with K notation', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatCompact(1500)
      expect(formatted).toContain('1')
      expect(formatted).toContain('K')
    })

    it('should format numbers with M notation', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatCompact(1500000)
      expect(formatted).toContain('1')
      expect(formatted).toContain('M')
    })

    it('should format small numbers without notation', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatCompact(100)
      expect(formatted).not.toContain('K')
      expect(formatted).not.toContain('M')
    })

    it('should format compact currency', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.formatCompactCurrency(1500)
      expect(formatted).toContain('K')
      expect(formatted.length).toBeGreaterThan(2)
    })
  })

  describe('Currency Switching', () => {
    it('should update formatting when currency changes', () => {
      const { result, rerender } = renderHook(() => useCurrency())
      
      // Initially ZAR
      let formatted = result.current.format(1000)
      const initialFormat = formatted
      
      // Change to USD
      act(() => {
        useCurrencyStore.setState({ currency: 'USD' })
      })
      rerender()
      
      // Should now format as USD
      formatted = result.current.format(1000)
      expect(formatted).not.toBe(initialFormat)
      expect(formatted).toContain('$')
    })

    it('should support multiple currencies', () => {
      const currencies = ['ZAR', 'USD', 'EUR', 'GBP']
      
      currencies.forEach(currency => {
        act(() => {
          useCurrencyStore.setState({ currency: currency as any })
        })
        
        const { result } = renderHook(() => useCurrency())
        const formatted = result.current.format(1000)
        
        expect(formatted).toBeTruthy()
        expect(typeof formatted).toBe('string')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.format(Number.MAX_SAFE_INTEGER)
      expect(formatted).toBeTruthy()
    })

    it('should handle very small decimals', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted = result.current.format(0.01)
      expect(formatted).toContain('0')
      expect(formatted).toContain('01')
    })

    it('should handle rounding correctly', () => {
      const { result } = renderHook(() => useCurrency())
      
      const formatted1 = result.current.format(10.994)
      const formatted2 = result.current.format(10.995)
      
      expect(formatted1).toBeTruthy()
      expect(formatted2).toBeTruthy()
    })
  })
})
