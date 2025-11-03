import { renderHook, act } from '@testing-library/react-hooks';
import { useOrders } from '../../hooks/useOrders';

// Mock the MCP client
jest.mock('../../services/mcpClient', () => ({
  mcp_supabase_execute_sql: jest.fn(),
}));

// Mock the auth store
jest.mock('../../store/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' },
    business: { id: 'business-1' },
  }),
}));

const mockMCPExecute = require('../../services/mcpClient').mcp_supabase_execute_sql;

describe('useOrders Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with loading state', () => {
    mockMCPExecute.mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useOrders());

    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('fetches orders successfully', async () => {
    const mockOrders = [
      {
        id: '1',
        order_number: 'ORD-000001',
        status: 'pending',
        total_amount: 100,
        customer_name: 'John Doe',
        items: [],
      },
    ];

    mockMCPExecute.mockResolvedValue({
      success: true,
      data: mockOrders,
    });

    const { result, waitForNextUpdate } = renderHook(() => useOrders());

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    mockMCPExecute.mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    const { result, waitForNextUpdate } = renderHook(() => useOrders());

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch orders');
  });

  it('creates order successfully', async () => {
    mockMCPExecute
      .mockResolvedValueOnce({
        success: true,
        data: [{ next_number: 1 }],
      })
      .mockResolvedValueOnce({
        success: true,
        data: [{ id: 'order-1' }],
      })
      .mockResolvedValue({
        success: true,
        data: [],
      });

    const { result } = renderHook(() => useOrders());

    await act(async () => {
      await result.current.createOrder({
        items: [
          {
            product_id: 'product-1',
            quantity: 2,
            unit_price: 50,
          },
        ],
      });
    });

    expect(mockMCPExecute).toHaveBeenCalledTimes(3);
  });

  it('updates order status successfully', async () => {
    mockMCPExecute.mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useOrders());

    await act(async () => {
      await result.current.updateOrderStatus('order-1', 'confirmed');
    });

    expect(mockMCPExecute).toHaveBeenCalledWith({
      query: expect.stringContaining('UPDATE orders'),
      params: ['confirmed', 'order-1', 'business-1'],
    });
  });
}); 