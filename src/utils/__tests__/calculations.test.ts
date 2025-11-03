import { describe, it, expect } from 'vitest'
import {
  calculateProfitMargin,
  calculateMarkup,
  calculateSellingPrice,
  calculateCostFromMargin,
  calculateCostFromMarkup,
  formatPercentage,
  formatCurrency,
} from '../calculations'

describe('Calculations Utilities', () => {
  describe('calculateProfitMargin', () => {
    it('should calculate profit margin correctly', () => {
      expect(calculateProfitMargin(100, 150)).toBe(33.33)
      expect(calculateProfitMargin(50, 100)).toBe(50)
      expect(calculateProfitMargin(80, 100)).toBe(20)
    })

    it('should return 0 for zero selling price', () => {
      expect(calculateProfitMargin(100, 0)).toBe(0)
    })

    it('should return 0 for negative values', () => {
      expect(calculateProfitMargin(-100, 150)).toBe(0)
      expect(calculateProfitMargin(100, -150)).toBe(0)
    })

    it('should handle equal cost and selling price', () => {
      expect(calculateProfitMargin(100, 100)).toBe(0)
    })
  })

  describe('calculateMarkup', () => {
    it('should calculate markup correctly', () => {
      expect(calculateMarkup(100, 150)).toBe(50)
      expect(calculateMarkup(50, 100)).toBe(100)
      expect(calculateMarkup(80, 100)).toBe(25)
    })

    it('should return 0 for zero cost', () => {
      expect(calculateMarkup(0, 150)).toBe(0)
    })

    it('should return 0 for negative values', () => {
      expect(calculateMarkup(-100, 150)).toBe(0)
      expect(calculateMarkup(100, -150)).toBe(0)
    })
  })

  describe('calculateSellingPrice', () => {
    it('should calculate selling price from cost and margin', () => {
      expect(calculateSellingPrice(100, 50)).toBe(200)
      expect(calculateSellingPrice(100, 33.33)).toBeCloseTo(149.99, 1)
      expect(calculateSellingPrice(80, 20)).toBe(100)
    })

    it('should handle 0% margin', () => {
      expect(calculateSellingPrice(100, 0)).toBe(100)
    })

    it('should handle negative cost', () => {
      expect(calculateSellingPrice(-100, 50)).toBe(0)
    })

    it('should handle 100% margin', () => {
      expect(calculateSellingPrice(100, 100)).toBe(Infinity)
    })
  })

  describe('calculateCostFromMargin', () => {
    it('should calculate cost from selling price and margin', () => {
      expect(calculateCostFromMargin(200, 50)).toBe(100)
      expect(calculateCostFromMargin(150, 33.33)).toBeCloseTo(100.01, 1)
      expect(calculateCostFromMargin(100, 20)).toBe(80)
    })

    it('should handle 0% margin', () => {
      expect(calculateCostFromMargin(100, 0)).toBe(100)
    })

    it('should return 0 for negative selling price', () => {
      expect(calculateCostFromMargin(-100, 50)).toBe(0)
    })
  })

  describe('calculateCostFromMarkup', () => {
    it('should calculate cost from selling price and markup', () => {
      expect(calculateCostFromMarkup(150, 50)).toBe(100)
      expect(calculateCostFromMarkup(200, 100)).toBe(100)
      expect(calculateCostFromMarkup(125, 25)).toBe(100)
    })

    it('should handle 0% markup', () => {
      expect(calculateCostFromMarkup(100, 0)).toBe(100)
    })

    it('should return 0 for negative selling price', () => {
      expect(calculateCostFromMarkup(-100, 50)).toBe(0)
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(50)).toBe('50.00%')
      expect(formatPercentage(33.33)).toBe('33.33%')
      expect(formatPercentage(0)).toBe('0.00%')
      expect(formatPercentage(100)).toBe('100.00%')
    })

    it('should handle negative percentages', () => {
      expect(formatPercentage(-10)).toBe('-10.00%')
    })

    it('should handle decimal places', () => {
      expect(formatPercentage(12.3456)).toBe('12.35%')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with default settings', () => {
      // formatCurrency from calculations uses hardcoded USD format
      expect(formatCurrency(1000)).toContain('1,000.00')
      expect(formatCurrency(1234.56)).toContain('1,234.56')
      expect(formatCurrency(0)).toContain('0.00')
    })

    it('should handle negative values', () => {
      expect(formatCurrency(-500)).toContain('500.00')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toContain('1,000,000.00')
      expect(formatCurrency(1234567.89)).toContain('1,234,567.89')
    })

    it('should handle decimal precision', () => {
      expect(formatCurrency(10.999)).toContain('11.00')
      expect(formatCurrency(10.001)).toContain('10.00')
    })
  })
})
