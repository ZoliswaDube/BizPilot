import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useInventory } from '../useInventory'
import { supabase } from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock auth store
vi.mock('../../store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-123' },
    businessUser: { business_id: 'business-123', role: 'admin' },
  })),
}))

describe('useInventory Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch inventory items successfully', async () => {
    const mockInventory = [
      {
        id: 'inv-1',
        name: 'Product 1',
        sku: 'SKU001',
        current_quantity: 100,
        unit_cost: 50,
        business_id: 'business-123',
      },
      {
        id: 'inv-2',
        name: 'Product 2',
        sku: 'SKU002',
        current_quantity: 50,
        unit_cost: 75,
        business_id: 'business-123',
      },
    ]

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockInventory,
          error: null,
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any)

    const { result } = renderHook(() => useInventory())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.inventory).toEqual(mockInventory)
    expect(result.current.error).toBe('')
  })

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error' }

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any)

    const { result } = renderHook(() => useInventory())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.inventory).toEqual([])
    expect(result.current.error).toBe('Failed to load inventory')
  })

  it('should return empty inventory when no business user', async () => {
    vi.mocked(require('../../store/auth').useAuthStore).mockReturnValue({
      user: { id: 'user-123' },
      businessUser: null,
    })

    const { result } = renderHook(() => useInventory())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.inventory).toEqual([])
  })
})
