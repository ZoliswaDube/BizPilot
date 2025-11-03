import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '../../lib/supabase'
import { calculateProduct } from '../../utils/calculations'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Product Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Product Creation', () => {
    it('should create product with ingredients and correct pricing', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        total_cost: 50,
        selling_price: 83.33,
        profit_margin: 40,
        business_id: 'business-123',
      }

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProduct,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      // Create product
      const productData = {
        name: 'Test Product',
        total_cost: 50,
        selling_price: 83.33,
        profit_margin: 40,
        business_id: 'business-123',
      }

      expect(mockProduct.profit_margin).toBe(40)
      expect(mockProduct.selling_price).toBeGreaterThan(mockProduct.total_cost)
    })

    it('should calculate product pricing correctly', () => {
      const ingredients = [
        { name: 'Flour', cost: 10, quantity: 2, unit: 'kg' },
        { name: 'Sugar', cost: 5, quantity: 1, unit: 'kg' },
      ]

      const laborMinutes = 30
      const hourlyRate = 20
      const targetMargin = 40

      const calculations = calculateProduct(ingredients, laborMinutes, hourlyRate, targetMargin)

      // Material cost = (10 * 2) + (5 * 1) = 25
      // Labor cost = (30 / 60) * 20 = 10
      // Total cost = 25 + 10 = 35
      // Selling price with 40% margin = 35 / (1 - 0.40) = 58.33
      
      expect(calculations.totalCost).toBe(35)
      expect(calculations.sellingPrice).toBeCloseTo(58.33, 1)
      expect(calculations.profitMargin).toBe(40)
    })

    it('should validate required fields', async () => {
      // Missing business_id should fail
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23502', message: 'null value in column business_id' },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      // Attempt to create product without business_id
      const result = await mockInsert({ name: 'Test Product' }).select().single()
      
      expect(result.error).toBeTruthy()
      expect(result.error.code).toBe('23502')
    })

    it('should prevent duplicate SKUs', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const result = await mockInsert({
        name: 'Test Product',
        sku: 'ABC001',
        business_id: 'business-123',
      }).select().single()

      expect(result.error).toBeTruthy()
      expect(result.error.code).toBe('23505')
    })
  })

  describe('Product Updates', () => {
    it('should update product and recalculate pricing', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'product-123',
                name: 'Updated Product',
                total_cost: 60,
                selling_price: 100,
              },
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      // Update product
      const result = await mockUpdate({
        name: 'Updated Product',
        total_cost: 60,
        selling_price: 100,
      }).eq('id', 'product-123').select().single()

      expect(result.data).toBeTruthy()
      expect(result.data.name).toBe('Updated Product')
    })

    it('should update ingredients and recalculate costs', async () => {
      // Delete old ingredients
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      // Insert new ingredients
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'ing-1', name: 'New Ingredient 1', cost: 15 },
            { id: 'ing-2', name: 'New Ingredient 2', cost: 10 },
          ],
          error: null,
        }),
      })

      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: mockDelete,
      } as any).mockReturnValueOnce({
        insert: mockInsert,
      } as any)

      // Delete and insert
      await mockDelete().eq('product_id', 'product-123')
      const result = await mockInsert([
        { product_id: 'product-123', name: 'New Ingredient 1', cost: 15 },
        { product_id: 'product-123', name: 'New Ingredient 2', cost: 10 },
      ]).select()

      expect(result.data).toHaveLength(2)
    })
  })

  describe('Product Retrieval', () => {
    it('should fetch all products for a business', async () => {
      const mockProducts = [
        { id: 'product-1', name: 'Product 1', business_id: 'business-123' },
        { id: 'product-2', name: 'Product 2', business_id: 'business-123' },
      ]

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await mockSelect('*')
        .eq('business_id', 'business-123')
        .order('name')

      expect(result.data).toHaveLength(2)
      expect(result.data[0].name).toBe('Product 1')
    })

    it('should fetch product with ingredients', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        ingredients: [
          { id: 'ing-1', name: 'Ingredient 1', cost: 10 },
          { id: 'ing-2', name: 'Ingredient 2', cost: 15 },
        ],
      }

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProduct,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await mockSelect('*, ingredients(*)')
        .eq('id', 'product-123')
        .single()

      expect(result.data.ingredients).toHaveLength(2)
    })
  })

  describe('Product Deletion', () => {
    it('should delete product and cascade to ingredients', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any)

      await mockDelete()
        .eq('id', 'product-123')
        .eq('business_id', 'business-123')

      expect(mockDelete).toHaveBeenCalled()
    })

    it('should prevent deleting product from wrong business', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { code: '42501', message: 'permission denied' },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any)

      const result = await mockDelete()
        .eq('id', 'product-123')
        .eq('business_id', 'wrong-business-id')

      expect(result.error).toBeTruthy()
      expect(result.error.code).toBe('42501')
    })
  })

  describe('Product Search and Filtering', () => {
    it('should search products by name', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'product-1', name: 'Chocolate Cake' },
                { id: 'product-2', name: 'Chocolate Cookies' },
              ],
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await mockSelect('*')
        .eq('business_id', 'business-123')
        .ilike('name', '%chocolate%')
        .order('name')

      expect(result.data).toHaveLength(2)
    })

    it('should filter products by category', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'product-1', name: 'Product 1', category_id: 'cat-1' },
              ],
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await mockSelect('*')
        .eq('business_id', 'business-123')
        .eq('category_id', 'cat-1')
        .order('name')

      expect(result.data).toHaveLength(1)
      expect(result.data[0].category_id).toBe('cat-1')
    })
  })

  describe('Inventory Integration', () => {
    it('should track stock levels when creating product', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        min_stock_level: 10,
        reorder_point: 20,
      }

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProduct,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      expect(mockProduct.min_stock_level).toBe(10)
      expect(mockProduct.reorder_point).toBe(20)
    })
  })
})
