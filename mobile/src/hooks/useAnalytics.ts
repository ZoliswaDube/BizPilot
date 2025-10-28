import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { analyticsService, trackScreen, trackUserAction } from '../services/analyticsService';

// Hook for screen tracking
export function useScreenTracking(screenName: string, properties?: Record<string, any>) {
  const screenRef = useRef(screenName);

  useFocusEffect(() => {
    trackScreen(screenName, properties);
  });

  useEffect(() => {
    screenRef.current = screenName;
  }, [screenName]);
}

// Hook for user action tracking
export function useActionTracking() {
  const trackAction = (action: string, element?: string, properties?: Record<string, any>) => {
    trackUserAction(action, element, properties);
  };

  const trackButtonPress = (buttonName: string, properties?: Record<string, any>) => {
    trackAction('button_press', buttonName, properties);
  };

  const trackFormSubmit = (formName: string, properties?: Record<string, any>) => {
    trackAction('form_submit', formName, properties);
  };

  const trackSearch = (query: string, resultsCount?: number) => {
    trackAction('search', 'search_input', { query, resultsCount });
  };

  const trackFilter = (filterType: string, filterValue: string) => {
    trackAction('filter_applied', filterType, { filterValue });
  };

  return {
    trackAction,
    trackButtonPress,
    trackFormSubmit,
    trackSearch,
    trackFilter,
  };
}

// Hook for session management
export function useSessionTracking() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      analyticsService.startNewSession();
    } else if (nextAppState.match(/inactive|background/)) {
      // App has gone to the background
      analyticsService.endSession();
    }

    appState.current = nextAppState;
  };
}

// Hook for performance tracking
export function usePerformanceTracking() {
  const trackLoadTime = (componentName: string, startTime: number) => {
    const loadTime = Date.now() - startTime;
    analyticsService.trackPerformance(`${componentName}_load_time`, loadTime);
  };

  const trackApiCall = (endpoint: string, duration: number, success: boolean) => {
    analyticsService.trackPerformance(`api_call_${endpoint}`, duration);
    trackUserAction('api_call', endpoint, { duration, success });
  };

  const trackRenderTime = (componentName: string) => {
    const startTime = Date.now();
    
    return () => {
      const renderTime = Date.now() - startTime;
      analyticsService.trackPerformance(`${componentName}_render_time`, renderTime);
    };
  };

  return {
    trackLoadTime,
    trackApiCall,
    trackRenderTime,
  };
}

// Hook for business event tracking
export function useBusinessTracking() {
  const trackOrderCreated = (orderData: { orderId: string; amount: number; itemCount: number }) => {
    analyticsService.trackBusinessEvent('order_created', {
      order_id: orderData.orderId,
      amount: orderData.amount,
      item_count: orderData.itemCount,
    });
  };

  const trackCustomerAdded = (customerData: { customerId: string; source: string }) => {
    analyticsService.trackBusinessEvent('customer_added', {
      customer_id: customerData.customerId,
      source: customerData.source, // 'manual', 'import', etc.
    });
  };

  const trackExpenseLogged = (expenseData: { amount: number; category: string; hasReceipt: boolean }) => {
    analyticsService.trackBusinessEvent('expense_logged', {
      amount: expenseData.amount,
      category: expenseData.category,
      has_receipt: expenseData.hasReceipt,
    });
  };

  return {
    trackOrderCreated,
    trackCustomerAdded,
    trackExpenseLogged,
  };
}

// Hook for error tracking
export function useErrorTracking() {
  const trackError = (error: Error, context?: string) => {
    analyticsService.reportCrash(error);
    analyticsService.addBreadcrumb(`Error in ${context}: ${error.message}`, 'error');
  };

  const trackApiError = (endpoint: string, error: any, statusCode?: number) => {
    trackUserAction('api_error', endpoint, {
      error_message: error.message || error,
      status_code: statusCode,
    });
  };

  const trackValidationError = (field: string, errorMessage: string) => {
    trackUserAction('validation_error', field, {
      error_message: errorMessage,
    });
  };

  return {
    trackError,
    trackApiError,
    trackValidationError,
  };
}

// Combined analytics hook
export function useAnalytics(screenName?: string) {
  const actions = useActionTracking();
  const performance = usePerformanceTracking();
  const business = useBusinessTracking();
  const errors = useErrorTracking();

  useSessionTracking();

  if (screenName) {
    useScreenTracking(screenName);
  }

  return {
    ...actions,
    ...performance,
    ...business,
    ...errors,
    trackScreen,
  };
} 