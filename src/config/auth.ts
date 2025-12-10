/**
 * Centralized Authentication Configuration
 * 
 * This module provides a single source of truth for all authentication-related
 * settings, reducing the likelihood of auth issues from scattered configurations.
 * 
 * @module src/config/auth
 */

/**
 * Authentication status for state machine approach
 */
export type AuthStatus =
  | 'idle'
  | 'initializing'
  | 'authenticating'
  | 'verifying_email'
  | 'exchanging_code'
  | 'authenticated'
  | 'signing_out'
  | 'error';

/**
 * Authentication method types
 */
export type AuthMethod = 'email' | 'oauth_google' | 'oauth_github' | 'magic_link' | 'refresh';

/**
 * Debug mode - enabled via VITE_AUTH_DEBUG=true
 */
export const AUTH_DEBUG = import.meta.env.VITE_AUTH_DEBUG === 'true';

/**
 * Log authentication events when debug mode is enabled
 */
export function logAuth(event: string, data?: unknown): void {
  if (AUTH_DEBUG || import.meta.env.DEV) {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH ${timestamp}] ${event}`, data ?? '');
  }
}

/**
 * Log auth errors (always logs, regardless of debug mode)
 */
export function logAuthError(event: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[AUTH ERROR ${timestamp}] ${event}`, error);
}

/**
 * Centralized authentication configuration
 */
export const authConfig = {
  /**
   * URL Configuration
   */
  urls: {
    /**
     * Get the callback URL for OAuth redirects
     * Uses window.location.origin in production for automatic detection
     */
    getCallbackUrl(): string {
      // Priority: env var > window origin > localhost
      const siteUrl = import.meta.env.VITE_SITE_URL;
      const vercelUrl = import.meta.env.VITE_VERCEL_URL;
      
      if (siteUrl) {
        return this.normalizeUrl(siteUrl);
      }
      
      if (vercelUrl) {
        return this.normalizeUrl(vercelUrl);
      }
      
      if (typeof window !== 'undefined' && window.location.origin) {
        return this.normalizeUrl(window.location.origin);
      }
      
      return 'http://localhost:5173/';
    },
    
    /**
     * Get the full auth callback path
     */
    getAuthCallbackPath(): string {
      return `${this.getCallbackUrl()}auth/callback`;
    },
    
    /**
     * Get the password reset callback path
     */
    getPasswordResetPath(): string {
      return `${this.getCallbackUrl()}auth/reset-password`;
    },
    
    /**
     * Normalize URL to ensure proper format
     */
    normalizeUrl(url: string): string {
      // Ensure https for non-localhost
      if (!url.includes('localhost') && !url.includes('http')) {
        url = `https://${url}`;
      }
      // Ensure trailing slash
      return url.endsWith('/') ? url : `${url}/`;
    },
    
    /**
     * Routes that don't require authentication
     */
    publicRoutes: [
      '/',
      '/auth',
      '/auth/callback',
      '/auth/error',
      '/auth/reset-password',
      '/pricing',
      '/about',
      '/contact',
      '/tip/:id',
    ],
    
    /**
     * Default redirect after login
     */
    defaultAuthenticatedRoute: '/dashboard',
    
    /**
     * Redirect when authentication fails
     */
    authFailedRoute: '/',
    
    /**
     * Error page route
     */
    errorRoute: '/auth/error',
  },
  
  /**
   * Timeout Configuration
   */
  timeouts: {
    /**
     * Maximum time to wait for OAuth flow to complete before resetting state
     * Helps recover from stuck OAuth states
     */
    oauthStuckState: 30 * 1000, // 30 seconds
    
    /**
     * Maximum time to wait for initial auth check
     */
    initialAuthCheck: 15 * 1000, // 15 seconds
    
    /**
     * How often to check/refresh tokens
     */
    tokenRefreshInterval: 5 * 60 * 1000, // 5 minutes
    
    /**
     * Time before token expiry to trigger refresh
     */
    tokenRefreshBuffer: 5 * 60, // 5 minutes (in seconds, matching Supabase)
    
    /**
     * Delay before redirecting after successful auth
     */
    authSuccessRedirectDelay: 500, // 500ms
    
    /**
     * Delay before redirecting after email verification message
     */
    emailVerificationMessageDelay: 2500, // 2.5 seconds
    
    /**
     * Minimum interval between session validations
     */
    minValidationInterval: 60 * 1000, // 1 minute
  },
  
  /**
   * Inactivity Configuration
   */
  inactivity: {
    /**
     * Time of inactivity before auto-logout
     */
    timeoutMs: 3 * 60 * 60 * 1000, // 3 hours
    
    /**
     * Time before timeout to show warning
     */
    warningMs: 10 * 60 * 1000, // 10 minutes
    
    /**
     * How often to check for inactivity
     */
    checkIntervalMs: 60 * 1000, // 1 minute
    
    /**
     * Events that reset the inactivity timer
     */
    activityEvents: [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ],
  },
  
  /**
   * Feature Flags
   */
  features: {
    /**
     * Whether email confirmation is required
     * Should match Supabase config.toml: auth.email.enable_confirmations
     */
    emailConfirmationRequired: true,
    
    /**
     * Whether to track and enforce inactivity timeout
     */
    inactivityTimeoutEnabled: true,
    
    /**
     * Whether to show inactivity warning before logout
     */
    showInactivityWarning: true,
    
    /**
     * Enable automatic session refresh
     */
    autoRefreshSession: true,
    
    /**
     * Enable multi-tab session sync
     */
    multiTabSessionSync: true,
  },
  
  /**
   * Storage Keys
   */
  storageKeys: {
    /**
     * Key for storing auth token in localStorage
     */
    authToken: 'bizpilot-auth-token',
    
    /**
     * Key for tracking OAuth loading state
     */
    oauthLoadingTime: 'oauth_loading_time',
    
    /**
     * Key for auth state persistence
     */
    authState: 'auth-storage',
    
    /**
     * Keys that should be preserved during logout (user preferences)
     */
    preserveOnLogout: [
      'currency-preference',
      'language-preference',
      'theme-preference',
      'i18nextLng',
    ],
  },
  
  /**
   * Error Messages
   */
  errors: {
    generic: 'An authentication error occurred. Please try again.',
    timeout: 'Authentication timed out. Please try again.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    oauthFailed: 'OAuth sign-in failed. Please try again.',
    emailNotVerified: 'Please verify your email address before signing in.',
    invalidCredentials: 'Invalid email or password.',
    userAlreadyExists: 'An account with this email already exists.',
    weakPassword: 'Password is too weak. Please use at least 6 characters.',
    rateLimited: 'Too many attempts. Please wait before trying again.',
    networkError: 'Network error. Please check your connection.',
    
    /**
     * Get user-friendly error message from Supabase error
     */
    fromSupabaseError(error: { message?: string; code?: string }): string {
      const msg = error.message?.toLowerCase() || '';
      const code = error.code?.toLowerCase() || '';
      
      if (code === 'user_already_exists' || msg.includes('already registered')) {
        return this.userAlreadyExists;
      }
      if (msg.includes('email not confirmed')) {
        return this.emailNotVerified;
      }
      if (msg.includes('invalid login credentials')) {
        return this.invalidCredentials;
      }
      if (msg.includes('password') && (msg.includes('weak') || msg.includes('short'))) {
        return this.weakPassword;
      }
      if (msg.includes('rate limit')) {
        return this.rateLimited;
      }
      if (msg.includes('network') || msg.includes('fetch')) {
        return this.networkError;
      }
      if (msg.includes('expired') || msg.includes('jwt')) {
        return this.sessionExpired;
      }
      
      return error.message || this.generic;
    },
  },
  
  /**
   * OAuth Provider Configuration
   */
  providers: {
    google: {
      name: 'Google',
      enabled: true,
      scopes: ['email', 'profile'],
    },
    github: {
      name: 'GitHub',
      enabled: true,
      scopes: ['user:email'],
    },
  },
} as const;

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(path: string): boolean {
  return authConfig.urls.publicRoutes.some(route => {
    // Handle dynamic routes like /tip/:id
    if (route.includes(':')) {
      const pattern = route.replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(path);
    }
    return path === route || path.startsWith(`${route}/`);
  });
}

/**
 * Clear auth-related storage items while preserving user preferences
 */
export function clearAuthStorage(): void {
  const { storageKeys } = authConfig;
  
  // Items to clear
  const authItems = [
    storageKeys.authToken,
    storageKeys.oauthLoadingTime,
    storageKeys.authState,
    'sb-ecqtlekrdhtaxhuvgsyo-auth-token', // Supabase default
    'supabase.auth.token',
  ];
  
  authItems.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      logAuthError(`Failed to remove ${key} from localStorage`, e);
    }
  });
  
  // Clear session storage
  try {
    sessionStorage.clear();
  } catch (e) {
    logAuthError('Failed to clear sessionStorage', e);
  }
  
  // Clear Supabase IndexedDB
  if ('indexedDB' in window) {
    try {
      indexedDB.deleteDatabase('supabase-auth-token');
    } catch (e) {
      logAuthError('Failed to delete IndexedDB', e);
    }
  }
  
  logAuth('Auth storage cleared, user preferences preserved');
}

/**
 * Check if OAuth is currently in progress (stuck state detection)
 */
export function isOAuthStuck(): boolean {
  const oauthLoadingTime = localStorage.getItem(authConfig.storageKeys.oauthLoadingTime);
  
  if (!oauthLoadingTime) {
    return false;
  }
  
  const timeDiff = Date.now() - parseInt(oauthLoadingTime, 10);
  return timeDiff > authConfig.timeouts.oauthStuckState;
}

/**
 * Reset stuck OAuth state
 */
export function resetOAuthState(): void {
  localStorage.removeItem(authConfig.storageKeys.oauthLoadingTime);
  logAuth('OAuth stuck state reset');
}

/**
 * Mark OAuth as in progress
 */
export function markOAuthStarted(): void {
  localStorage.setItem(authConfig.storageKeys.oauthLoadingTime, Date.now().toString());
  logAuth('OAuth flow started');
}

/**
 * Mark OAuth as completed
 */
export function markOAuthCompleted(): void {
  localStorage.removeItem(authConfig.storageKeys.oauthLoadingTime);
  logAuth('OAuth flow completed');
}

export default authConfig;
