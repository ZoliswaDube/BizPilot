import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getURL } from '../supabase'

describe('Supabase Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    delete import.meta.env.VITE_SITE_URL
    delete import.meta.env.VITE_VERCEL_URL
  })

  describe('getURL', () => {
    it('should use VITE_SITE_URL if set', () => {
      import.meta.env.VITE_SITE_URL = 'https://production.com'
      const url = getURL()
      expect(url).toBe('https://production.com/')
    })

    it('should use VITE_VERCEL_URL if VITE_SITE_URL is not set', () => {
      import.meta.env.VITE_VERCEL_URL = 'myapp.vercel.app'
      const url = getURL()
      expect(url).toBe('https://myapp.vercel.app/')
    })

    it('should use window.location.origin in browser', () => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://profitpilotpro.net' },
        writable: true,
      })

      const url = getURL()
      expect(url).toBe('https://profitpilotpro.net/')
    })

    it('should fallback to localhost in development', () => {
      // Mock window as undefined (SSR scenario)
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const url = getURL()
      expect(url).toBe('http://localhost:5173/')

      // Restore window
      global.window = originalWindow
    })

    it('should add https:// to URLs without protocol', () => {
      import.meta.env.VITE_SITE_URL = 'example.com'
      const url = getURL()
      expect(url).toBe('https://example.com/')
    })

    it('should preserve existing http/https protocol', () => {
      import.meta.env.VITE_SITE_URL = 'http://localhost:3000'
      const url = getURL()
      expect(url).toBe('http://localhost:3000/')
    })

    it('should add trailing slash if missing', () => {
      import.meta.env.VITE_SITE_URL = 'https://example.com'
      const url = getURL()
      expect(url).toBe('https://example.com/')
    })

    it('should not add extra trailing slash', () => {
      import.meta.env.VITE_SITE_URL = 'https://example.com/'
      const url = getURL()
      expect(url).toBe('https://example.com/')
    })
  })
})
