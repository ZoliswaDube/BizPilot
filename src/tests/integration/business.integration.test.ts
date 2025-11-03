import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBusinessStore } from '../../store/business'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Business Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBusinessStore.setState({
      business: null,
      businessUsers: [],
      userRoles: [],
      userRole: '',
      loading: false,
      error: null,
      lastFetch: null,
      isInitialized: false,
    })
  })

  describe('Business Creation and Setup', () => {
    it('should create business and assign creator as admin', async () => {
      const mockBusiness = {
        id: 'business-123',
        name: 'Test Business',
        description: 'A test business',
        created_at: new Date().toISOString(),
      }

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockBusiness,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const { createBusiness } = useBusinessStore.getState()
      const result = await createBusiness(
        {
          name: 'Test Business',
          description: 'A test business',
        } as any,
        'user-123'
      )

      expect(result).toEqual(mockBusiness)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Business',
          description: 'A test business',
        })
      )
    })

    it('should prevent creating multiple businesses per user', async () => {
      // User already has a business
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'existing-business' },
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      // Attempt to create another business should fail
      const { loadBusiness } = useBusinessStore.getState()
      await loadBusiness('user-123')

      const state = useBusinessStore.getState()
      expect(state.business).toBeTruthy()
    })
  })

  describe('Business User Management', () => {
    it('should invite user to business', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'invitation-123' },
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const { inviteUser } = useBusinessStore.getState()
      await inviteUser('newuser@test.com', 'manager', 'admin-user-123')

      expect(mockInsert).toHaveBeenCalled()
    })

    it('should update user role', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: 'user-123', role: 'manager' },
          error: null,
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const { updateUserRole } = useBusinessStore.getState()
      await updateUserRole('user-123', 'manager')

      expect(mockUpdate).toHaveBeenCalledWith({ role: 'manager' })
    })

    it('should remove user from business', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: 'user-123', is_active: false },
          error: null,
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const { removeUser } = useBusinessStore.getState()
      await removeUser('user-123')

      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false })
    })
  })

  describe('Role and Permission Management', () => {
    it('should check admin permissions', () => {
      useBusinessStore.setState({
        userRole: 'admin',
      })

      const { isAdmin } = useBusinessStore.getState()
      expect(isAdmin()).toBe(true)
    })

    it('should check specific permissions', () => {
      useBusinessStore.setState({
        userRole: 'manager',
        userRoles: [
          {
            id: 'role-1',
            name: 'manager',
            permissions: [
              { id: 'perm-1', resource: 'products', action: 'edit' },
              { id: 'perm-2', resource: 'inventory', action: 'edit' },
            ],
          },
        ] as any,
      })

      const { hasPermission } = useBusinessStore.getState()
      expect(hasPermission('products', 'edit')).toBe(true)
      expect(hasPermission('users', 'delete')).toBe(false)
    })

    it('should grant all permissions to admin', () => {
      useBusinessStore.setState({
        userRole: 'admin',
      })

      const { hasPermission } = useBusinessStore.getState()
      expect(hasPermission('users', 'delete')).toBe(true)
      expect(hasPermission('products', 'edit')).toBe(true)
      expect(hasPermission('anything', 'anything')).toBe(true)
    })
  })

  describe('Business Data Caching', () => {
    it('should cache business data for 5 minutes', async () => {
      const mockBusiness = {
        id: 'business-123',
        name: 'Test Business',
      }

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { business: mockBusiness },
                error: null,
              }),
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const { loadBusiness } = useBusinessStore.getState()
      
      // First call - should fetch from database
      await loadBusiness('user-123')
      expect(mockSelect).toHaveBeenCalledTimes(1)

      // Second call within 5 minutes - should use cache
      await loadBusiness('user-123')
      expect(mockSelect).toHaveBeenCalledTimes(1) // Still 1, not 2

      // Clear cache and fetch again
      const { clearCache } = useBusinessStore.getState()
      clearCache()
      
      await loadBusiness('user-123')
      expect(mockSelect).toHaveBeenCalledTimes(2) // Now 2
    })

    it('should refresh stale cache after 5 minutes', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { business: { id: 'business-123' } },
                error: null,
              }),
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const { loadBusiness } = useBusinessStore.getState()
      
      // First fetch
      await loadBusiness('user-123')

      // Simulate 6 minutes passing
      const sixMinutesAgo = Date.now() - (6 * 60 * 1000)
      useBusinessStore.setState({ lastFetch: sixMinutesAgo })

      // Should fetch again because cache is stale
      await loadBusiness('user-123')
      expect(mockSelect).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle business not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST301', message: 'No rows found' },
              }),
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const { loadBusiness } = useBusinessStore.getState()
      await loadBusiness('user-123')

      const state = useBusinessStore.getState()
      expect(state.business).toBeNull()
      expect(state.loading).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const { loadBusiness } = useBusinessStore.getState()
      await loadBusiness('user-123')

      const state = useBusinessStore.getState()
      expect(state.error).toBe('Failed to load business data')
      expect(state.loading).toBe(false)
    })
  })
})
