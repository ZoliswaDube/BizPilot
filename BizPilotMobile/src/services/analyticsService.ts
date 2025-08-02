import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Types for analytics events
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  businessId?: string;
  businessName?: string;
  userRole?: string;
  signupDate?: string;
  platform: string;
  appVersion: string;
}

export interface CrashReport {
  error: Error;
  errorInfo?: React.ErrorInfo;
  userId?: string;
  sessionId?: string;
  breadcrumbs?: string[];
  deviceInfo: DeviceInfo;
  timestamp: number;
}

interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  appVersion: string;
  buildNumber: string;
  isDevice: boolean;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;
  private userId?: string;
  private sessionId: string;
  private sessionStartTime: number;
  private breadcrumbs: string[] = [];
  private eventQueue: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async initialize(userId?: string) {
    try {
      this.userId = userId;
      this.isInitialized = true;

      // Initialize third-party analytics (Sentry, Firebase, etc.)
      await this.initializeThirdPartyServices();

      // Set user properties
      if (userId) {
        await this.setUserProperties({
          userId,
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version || '1.0.0',
        });
      }

      // Track session start
      this.trackEvent('session_start', {
        sessionId: this.sessionId,
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version,
      });

      // Flush any queued events
      await this.flushEventQueue();

      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }
  }

  private async initializeThirdPartyServices() {
    // Initialize Sentry for crash reporting
    if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
      // Sentry would be initialized here
      // import * as Sentry from '@sentry/react-native';
      // Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });
      console.log('Sentry initialized (mock)');
    }

    // Initialize other analytics services (Firebase, Amplitude, etc.)
    if (process.env.EXPO_PUBLIC_ANALYTICS_KEY) {
      console.log('Analytics service initialized (mock)');
    }
  }

  // Track user events
  trackEvent(name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        platform: Platform.OS,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    if (!this.isInitialized) {
      this.eventQueue.push(event);
      return;
    }

    this.sendEvent(event);
    this.addBreadcrumb(`Event: ${name}`);
  }

  // Track screen views
  trackScreen(screenName: string, properties?: Record<string, any>) {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  // Track user actions
  trackUserAction(action: string, element?: string, properties?: Record<string, any>) {
    this.trackEvent('user_action', {
      action,
      element,
      ...properties,
    });
  }

  // Track business events
  trackBusinessEvent(eventType: 'order_created' | 'customer_added' | 'expense_logged', properties?: Record<string, any>) {
    this.trackEvent('business_event', {
      event_type: eventType,
      ...properties,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance_metric', {
      metric,
      value,
      unit,
    });
  }

  // Set user properties
  async setUserProperties(properties: Partial<UserProperties>) {
    try {
      // Send to analytics service
      console.log('Setting user properties:', properties);
      
      // Update local user ID
      if (properties.userId) {
        this.userId = properties.userId;
      }
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }

  // Crash reporting
  reportCrash(error: Error, errorInfo?: React.ErrorInfo) {
    const crashReport: CrashReport = {
      error,
      errorInfo,
      userId: this.userId,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      deviceInfo: this.getDeviceInfo(),
      timestamp: Date.now(),
    };

    this.sendCrashReport(crashReport);
    console.error('Crash reported:', error);
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message: string, category: string = 'general') {
    const breadcrumb = `[${new Date().toISOString()}] ${category}: ${message}`;
    this.breadcrumbs.push(breadcrumb);

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  // Session management
  startNewSession() {
    this.endSession();
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.breadcrumbs = [];

    this.trackEvent('session_start', {
      sessionId: this.sessionId,
      platform: Platform.OS,
    });
  }

  endSession() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    this.trackEvent('session_end', {
      sessionId: this.sessionId,
      duration: sessionDuration,
      platform: Platform.OS,
    });
  }

  // Privacy controls
  setAnalyticsEnabled(enabled: boolean) {
    this.isInitialized = enabled;
    
    if (!enabled) {
      this.eventQueue = [];
      console.log('Analytics disabled by user');
    }
  }

  // Utility methods
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Constants.deviceName || 'Unknown',
      appVersion: Constants.expoConfig?.version || '1.0.0',
      buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',
      isDevice: Constants.isDevice,
    };
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      // Send to analytics service
      console.log('Analytics event:', event);
      
      // In production, send to actual analytics service
      // await fetch('/api/analytics/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
    } catch (error) {
      console.error('Error sending analytics event:', error);
    }
  }

  private async sendCrashReport(crashReport: CrashReport) {
    try {
      // Send to crash reporting service
      console.log('Crash report:', crashReport);
      
      // In production, send to actual crash reporting service
      // await fetch('/api/analytics/crashes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(crashReport),
      // });
    } catch (error) {
      console.error('Error sending crash report:', error);
    }
  }

  private async flushEventQueue() {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of eventsToSend) {
      await this.sendEvent(event);
    }
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();

// Convenience functions
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  analyticsService.trackEvent(name, properties);
};

export const trackScreen = (screenName: string, properties?: Record<string, any>) => {
  analyticsService.trackScreen(screenName, properties);
};

export const trackUserAction = (action: string, element?: string, properties?: Record<string, any>) => {
  analyticsService.trackUserAction(action, element, properties);
};

export const trackBusinessEvent = (eventType: 'order_created' | 'customer_added' | 'expense_logged', properties?: Record<string, any>) => {
  analyticsService.trackBusinessEvent(eventType, properties);
};

export const reportCrash = (error: Error, errorInfo?: React.ErrorInfo) => {
  analyticsService.reportCrash(error, errorInfo);
};

export default analyticsService; 