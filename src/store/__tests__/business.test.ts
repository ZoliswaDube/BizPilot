import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBusinessStore } from '../business'
import { supabase } from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          maybeSingle: vi.fn(() => ({ data: null, error: null })),
        })),
        order: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
  },
}))

describe('Business Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBusinessStore.setState({
      business: null,
      users: [],
      roles: [],
      permissions: [],
      loading: false,
      error: null,
      lastFetched: null,
    })
    vi.clearAllMocks()
  })

  describe('setBusiness', () => {
    it('should set business data', () => {
      const mockBusiness = {
        id: 'business-123',
        name: 'Test Business',
        description: 'Test Description',
        created_at: '2024-01-01',
      }

      const { setBusiness } = useBusinessStore.getState()
      setBusiness(mockBusiness as any)

      const state = useBusinessStore.getState()
      expect(state.business).toEqual(mockBusiness)
    })

    it('should clear business data when null', () => {
      const mockBusiness = { id: 'business-123', name: 'Test Business' }
      useBusinessStore.setState({ business: mockBusiness as any })

      const { setBusiness } = useBusinessStore.getState()
      setBusiness(null)

      const state = useBusinessStore.getState()
      expect(state.business).toBeNull()
    })
  })

  describe('setUsers', () => {
    it('should set users list', () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ]

      const { setUsers } = useBusinessStore.getState()
      setUsers(mockUsers as any)

      const state = useBusinessStore.getState()
      expect(state.users).toEqual(mockUsers)
    })

    it('should clear users list', () => {
      useBusinessStore.setState({ users: [{ id: 'user-1' }] as any })

      const { setUsers } = useBusinessStore.getState()
      setUsers([])

      const state = useBusinessStore.getState()
      expect(state.users).toEqual([])
    })
  })

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { setLoading } = useBusinessStore.getState()
      setLoading(true)

      let state = useBusinessStore.getState()
      expect(state.loading).toBe(true)

      setLoading(false)
      state = useBusinessStore.getState()
      expect(state.loading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to load business'
      const { setError } = useBusinessStore.getState()
      setError(errorMessage)

      const state = useBusinessStore.getState()
      expect(state.error).toBe(errorMessage)
    })

    it('should clear error message', () => {
      useBusinessStore.setState({ error: 'Some error' })

      const { setError } = useBusinessStore.getState()
      setError(null)

      const state = useBusinessStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('Cache Management', () => {
    it('should track last fetched timestamp', () => {
      const { updateLastFetched } = useBusinessStore.getState()
      const beforeUpdate = Date.now()
      
      updateLastFetched()
      
      const state = useBusinessStore.getState()
      expect(state.lastFetched).toBeGreaterThanOrEqual(beforeUpdate)
      expect(state.lastFetched).toBeLessThanOrEqual(Date.now())
    })

    it('should determine if cache is stale', () => {
      const { isCacheStale, updateLastFetched } = useBusinessStore.getState()
      
      // No fetch yet - cache is stale
      expect(isCacheStale()).toBe(true)
      
      // Just fetched - cache is fresh
      updateLastFetched()
      expect(isCacheStale()).toBe(false)
      
      // Simulate old fetch (6 minutes ago)
      const sixMinutesAgo = Date.now() - (6 * 60 * 1000)
      useBusinessStore.setState({ lastFetched: sixMinutesAgo })
      expect(isCacheStale()).toBe(true)
    })

    it('should use 5 minute cache timeout', () => {
      const { isCacheStale } = useBusinessStore.getState()
      
      // 4 minutes ago - still fresh
      const fourMinutesAgo = Date.now() - (4 * 60 * 1000)
      useBusinessStore.setState({ lastFetched: fourMinutesAgo })
      expect(isCacheStale()).toBe(false)
      
      // 6 minutes ago - stale
      const sixMinutesAgo = Date.now() - (6 * 60 * 1000)
      useBusinessStore.setState({ lastFetched: sixMinutesAgo })
      expect(isCacheStale()).toBe(true)
    })
  })

  describe('State Reset', () => {
    it('should reset all state to initial values', () => {
      // Set some state
      useBusinessStore.setState({
        business: { id: 'business-123' } as any,
        users: [{ id: 'user-1' }] as any,
        roles: [{ id: 'role-1' }] as any,
        permissions: [{ id: 'perm-1' }] as any,
        loading: true,
        error: 'Some error',
        lastFetched: Date.now(),
      })

      const { reset } = useBusinessStore.getState()
      reset()

      const state = useBusinessStore.getState()
      expect(state.business).toBeNull()
      expect(state.users).toEqual([])
      expect(state.roles).toEqual([])
      expect(state.permissions).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.lastFetched).toBeNull()
    })
  })

  describe('Role and Permission Management', () => {
    it('should set roles', () => {
      const mockRoles = [
        { id: 'role-1', name: 'admin' },
        { id: 'role-2', name: 'manager' },
      ]

      const { setRoles } = useBusinessStore.getState()
      setRoles(mockRoles as any)

      const state = useBusinessStore.getState()
      expect(state.roles).toEqual(mockRoles)
    })

    it('should set permissions', () => {
      const mockPermissions = [
        { id: 'perm-1', name: 'edit_inventory' },
        { id: 'perm-2', name: 'view_reports' },
      ]

      const { setPermissions } = useBusinessStore.getState()
      setPermissions(mockPermissions as any)

      const state = useBusinessStore.getState()
      expect(state.permissions).toEqual(mockPermissions)
    })
  })
})
