import { renderHook, act } from '@testing-library/react'
import type { CreateOrderRequest, OrderStatus } from '../../types/orders'
import { vi } from 'vitest'

// Mock the MCP client
const mockMcpClient = {
  execute_sql: jest.fn()
}

// Mock window.mcpClient
Object.defineProperty(window, 'mcpClient', {
  value: mockMcpClient,
  writable: true
})

// Mock auth store and business hook before importing the hook
vi.mock('../../store/auth', () => ({
  useAuthStore: () => ({ user: { id: 'user-123' } })
}))
vi.mock('../useBusiness', () => ({
  useBusiness: () => ({ business: { id: 'business-123' } })
}))

// Dynamically import the hook after mocks are in place
const importHook = async () => (await import('../useOrders')).useOrders

describe('useOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchOrders', () => {
    it('should fetch orders successfully', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_number: 'ORD-001',
          status: 'pending',
          total_amount: 100.00,
          customer_name: 'John Doe'
        }
      ]

      mockMcpClient.execute_sql.mockResolvedValue({
        data: mockOrders
      })

      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      // Wait for initial load
      await act(async () => {
        await result.current.refreshOrders()
      })

      expect(result.current.orders).toEqual(mockOrders)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle fetch errors', async () => {
      mockMcpClient.execute_sql.mockResolvedValue({
        error: { message: 'Database error' }
      })

      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      await act(async () => {
        await result.current.refreshOrders()
      })

      expect(result.current.orders).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Database error')
    })
  })

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const mockOrder = {
        id: 'order-new',
        order_number: 'ORD-002',
        status: 'pending',
        total_amount: 150.00
      }

      const mockInventory = {
        current_quantity: 10,
        low_stock_alert: 2,
        name: 'Test Product'
      }

      // Mock inventory validation
      mockMcpClient.execute_sql
        .mockResolvedValueOnce({ data: [mockInventory] }) // inventory check
        .mockResolvedValueOnce({ data: [mockOrder] }) // create order
        .mockResolvedValueOnce({ data: [] }) // create order items
        .mockResolvedValueOnce({ data: [] }) // update inventory
        .mockResolvedValueOnce({ data: [] }) // create transaction
        .mockResolvedValueOnce({ data: [] }) // create status history
        .mockResolvedValueOnce({ data: [mockOrder] }) // refresh orders

      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      const orderData: CreateOrderRequest = {
        items: [
          {
            inventory_id: 'inv-1',
            product_name: 'Test Product',
            quantity: 2,
            unit_price: 50.00
          }
        ],
        notes: 'Test order'
      }

      await act(async () => {
        const createdOrder = await result.current.createOrder(orderData)
        expect(createdOrder).toEqual(mockOrder)
      })

      expect(mockMcpClient.execute_sql).toHaveBeenCalledTimes(7)
    })

    it('should validate inventory before creating order', async () => {
      const mockInventory = {
        current_quantity: 1,
        low_stock_alert: 2,
        name: 'Test Product'
      }

      mockMcpClient.execute_sql.mockResolvedValue({ data: [mockInventory] })

      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      const orderData: CreateOrderRequest = {
        items: [
          {
            inventory_id: 'inv-1',
            product_name: 'Test Product',
            quantity: 5, // More than available
            unit_price: 50.00
          }
        ]
      }

      await act(async () => {
        await expect(result.current.createOrder(orderData)).rejects.toThrow(
          'Inventory validation failed'
        )
      })
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status and create history entry', async () => {
      mockMcpClient.execute_sql
        .mockResolvedValueOnce({ data: [{ id: 'order-1' }] }) // update order
        .mockResolvedValueOnce({ data: [] }) // create history
        .mockResolvedValueOnce({ data: [] }) // refresh orders

      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      await act(async () => {
        await result.current.updateOrderStatus('order-1', 'confirmed', 'Order confirmed by customer')
      })

      expect(mockMcpClient.execute_sql).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('INSERT INTO order_status_history'),
          params: ['order-1', 'confirmed', 'user-123', 'Order confirmed by customer']
        })
      )
    })
  })

  describe('validateInventory', () => {
    it('should return valid for sufficient inventory', async () => {
      const mockInventory = {
        current_quantity: 10,
        low_stock_alert: 2,
        name: 'Test Product'
      }

      mockMcpClient.execute_sql.mockResolvedValue({ data: [mockInventory] })

      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      await act(async () => {
        const validation = await result.current.validateInventory([
          {
            inventory_id: 'inv-1',
            product_name: 'Test Product',
            quantity: 5,
            unit_price: 10.00
          }
        ])

        expect(validation.isValid).toBe(true)
        expect(validation.errors).toHaveLength(0)
      })
    })

    it('should return invalid for insufficient inventory', async () => {
      const mockInventory = {
        current_quantity: 2,
        low_stock_alert: 2,
        name: 'Test Product'
      }

      mockMcpClient.execute_sql.mockResolvedValue({ data: [mockInventory] })

      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      await act(async () => {
        const validation = await result.current.validateInventory([
          {
            inventory_id: 'inv-1',
            product_name: 'Test Product',
            quantity: 5,
            unit_price: 10.00
          }
        ])

        expect(validation.isValid).toBe(false)
        expect(validation.errors).toHaveLength(1)
        expect(validation.errors[0].message).toContain('Insufficient stock')
      })
    })

    it('should return warnings for low stock after order', async () => {
      const mockInventory = {
        current_quantity: 5,
        low_stock_alert: 3,
        name: 'Test Product'
      }

      mockMcpClient.execute_sql.mockResolvedValue({ data: [mockInventory] })

      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      await act(async () => {
        const validation = await result.current.validateInventory([
          {
            inventory_id: 'inv-1',
            product_name: 'Test Product',
            quantity: 3,
            unit_price: 10.00
          }
        ])

        expect(validation.isValid).toBe(true)
        expect(validation.warnings).toHaveLength(1)
        expect(validation.warnings[0].message).toContain('will be low on stock')
      })
    })
  })

  describe('calculateOrderTotal', () => {
    it('should calculate totals correctly', async () => {
      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      await act(async () => {
        const totals = await result.current.calculateOrderTotal([
          { product_name: 'Item 1', quantity: 2, unit_price: 50.00 },
          { product_name: 'Item 2', quantity: 1, unit_price: 30.00 }
        ], 10.00) // $10 discount

        expect(totals.subtotal).toBe(130.00)
        expect(totals.tax_amount).toBe(13.00) // 10% tax
        expect(totals.discount_amount).toBe(10.00)
        expect(totals.total_amount).toBe(133.00) // 130 + 13 - 10
      })
    })

    it('should ensure total is not negative', async () => {
      const useOrders = await importHook()
      const { result } = renderHook(() => useOrders())

      await act(async () => {
        const totals = await result.current.calculateOrderTotal([
          { product_name: 'Item 1', quantity: 1, unit_price: 10.00 }
        ], 50.00) // Large discount

        expect(totals.total_amount).toBe(0) // Should not be negative
      })
    })
  })
})