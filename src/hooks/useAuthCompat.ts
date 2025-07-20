// Compatibility hook to ease migration from React Context to Zustand
// This provides the same interface as the old useAuth hook
import { useAuthStore } from '../store/auth'

export function useAuth() {
  return useAuthStore()
}
