import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCurrency } from '../useCurrency'
import { useCurrencyStore } from '../../store/currency'

describe('useCurrency Hook', () => {
  beforeEach(() => {
    // Reset currency store to default
    useCurrencyStore.setState({ currency: 'ZAR' })
    vi.clearAllMocks()
  })

  describe('format (formatCurrency)', () => {
    it('should format ZAR currency correctly', () => {
      const { result } = renderHook(() => useCurrency())
      expect(result.current.format(1234.56)).toBe('R 1 234,56')
      expect(result.current.format(1000)).toBe('R 1 000,00')
      expect(result.current.format(0)).toBe('R 0,00')
    })

    it('should format USD currency correctly', () => {
      act(() => {
        useCurrencyStore.setState({ currency: 'USD' })
      })
      
      const { result } = renderHook(() => useCurrency())
      expect(result.current.format(1234.56)).toBe('$1,234.56')
      expect(result.current.format(1000)).toBe('$1,000.00')
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
      expect(formatted).toContain('56')
    })

    it('should handle negative values', () => {
      const { result } = renderHook(() => useCurrency())
      const formatted = result.current.format(-500)
      expect(formatted).toContain('-')
      expect(formatted).toContain('500')
    })

    it('should handle large numbers', () => {
      const { result } = renderHook(() => useCurrency())
      const formatted = result.current.format(1000000)
      expect(formatted).toBe('R 1 000 000,00')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with ZAR locale', () => {
      const { result } = renderHook(() => useCurrency())
      expect(result.current.formatNumber(1234.56)).toContain('1')
      expect(result.current.formatNumber(1234.56)).toContain('234')
    })

    it('should format numbers with custom decimals', () => {
      const { result } = renderHook(() => useCurrency())
      const formatted = result.current.formatNumber(1234.5678, { decimals: 3 })
      expect(formatted).toContain('567') // Should round to 3 decimals
    })
  })

  describe('formatPercentage', () => {
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
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const { result } = renderHook(() => useCurrency())
      const date = new Date('2024-11-03')
      const formatted = result.current.formatDate(date)
      expect(formatted).toContain('2024')
      expect(formatted).toContain('11') // November
      expect(formatted).toContain('03')
    })
  })

  describe('parseCurrency', () => {
    it('should parse ZAR formatted currency', () => {
      const { result } = renderHook(() => useCurrency())
      expect(result.current.parseCurrency('R 1 234,56')).toBe(1234.56)
      expect(result.current.parseCurrency('R 1 000,00')).toBe(1000)
    })

    it('should parse USD formatted currency', () => {
      act(() => {
        useCurrencyStore.setState({ currency: 'USD' })
      })
      
      const { result } = renderHook(() => useCurrency())
      expect(result.current.parseCurrency('$1,234.56')).toBe(1234.56)
      expect(result.current.parseCurrency('$1,000.00')).toBe(1000)
    })

    it('should handle currency without symbol', () => {
      const { result } = renderHook(() => useCurrency())
      expect(result.current.parseCurrency('1234,56')).toBe(1234.56)
    })

    it('should return 0 for invalid input', () => {
      const { result } = renderHook(() => useCurrency())
      expect(result.current.parseCurrency('invalid')).toBe(0)
      expect(result.current.parseCurrency('')).toBe(0)
    })
  })

  describe('formatCompact', () => {
    it('should format numbers in compact notation', () => {
      const { result } = renderHook(() => useCurrency())
      expect(result.current.formatCompact(1000)).toContain('1')
      expect(result.current.formatCompact(1000)).toContain('K')
      expect(result.current.formatCompact(1500000)).toContain('1')
      expect(result.current.formatCompact(1500000)).toContain('M')
    })

    it('should format small numbers without notation', () => {
      const { result } = renderHook(() => useCurrency())
      const formatted = result.current.formatCompact(100)
      expect(formatted).not.toContain('K')
      expect(formatted).not.toContain('M')
    })
  })

  describe('formatCompactCurrency', () => {
    it('should format currency in compact notation', () => {
      const { result } = renderHook(() => useCurrency())
      const formatted = result.current.formatCompactCurrency(1500)
      expect(formatted).toContain('R')
      expect(formatted).toContain('1')
      expect(formatted).toContain('K')
    })

    it('should format large amounts with million notation', () => {
      const { result } = renderHook(() => useCurrency())
      const formatted = result.current.formatCompactCurrency(2500000)
      expect(formatted).toContain('R')
      expect(formatted).toContain('M')
    })
  })

  describe('Currency changes', () => {
    it('should update formatting when currency changes', () => {
      const { result, rerender } = renderHook(() => useCurrency())
      
      // Initially ZAR
      let formatted = result.current.format(1000)
      expect(formatted).toContain('R')
      
      // Change to USD
      act(() => {
        useCurrencyStore.setState({ currency: 'USD' })
      })
      rerender()
      
      // Should now format as USD
      formatted = result.current.format(1000)
      expect(formatted).toContain('$')
    })
  })
})
