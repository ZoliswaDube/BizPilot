interface InactivityConfig {
  timeoutMs: number;
  warningMs?: number;
  checkIntervalMs?: number;
}

interface InactivityCallbacks {
  onTimeout: () => void;
  onWarning?: () => void;
  onActivity?: () => void;
}

export class InactivityService {
  private static instance: InactivityService;
  
  private config: InactivityConfig;
  private callbacks: InactivityCallbacks;
  private lastActivity: number;
  private timeoutId: number | null = null;
  private warningTimeoutId: number | null = null;
  private intervalId: number | null = null;
  private isActive = false;
  private warningShown = false;

  private constructor() {
    this.lastActivity = Date.now();
    this.config = {
      timeoutMs: 3 * 60 * 60 * 1000, // 3 hours
      warningMs: 10 * 60 * 1000, // 10 minutes warning
      checkIntervalMs: 60 * 1000, // Check every minute
    };
    this.callbacks = {
      onTimeout: () => {},
    };
  }

  static getInstance(): InactivityService {
    if (!InactivityService.instance) {
      InactivityService.instance = new InactivityService();
    }
    return InactivityService.instance;
  }

  configure(config: Partial<InactivityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setCallbacks(callbacks: Partial<InactivityCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  start(): void {
    if (this.isActive) {
      console.log('⏰ InactivityService: Already active');
      return;
    }

    console.log('⏰ InactivityService: Starting inactivity tracking');
    this.isActive = true;
    this.lastActivity = Date.now();
    this.warningShown = false;

    // Set up activity listeners
    this.setupActivityListeners();
    
    // Start the check interval
    this.startCheckInterval();
  }

  stop(): void {
    console.log('⏰ InactivityService: Stopping inactivity tracking');
    this.isActive = false;
    this.warningShown = false;

    // Clear all timers
    this.clearTimeouts();
    
    // Remove activity listeners
    this.removeActivityListeners();
  }

  recordActivity(): void {
    if (!this.isActive) return;

    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;

    // Only record if there was a significant gap (avoid too frequent updates)
    if (timeSinceLastActivity > 5000) { // 5 seconds
      console.log('⏰ InactivityService: Activity recorded');
      this.lastActivity = now;
      this.warningShown = false;
      this.callbacks.onActivity?.();
    }
  }

  getTimeUntilTimeout(): number {
    if (!this.isActive) return 0;
    
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.config.timeoutMs - elapsed);
  }

  getTimeUntilWarning(): number {
    if (!this.isActive) return 0;
    
    const elapsed = Date.now() - this.lastActivity;
    const warningTime = this.config.timeoutMs - (this.config.warningMs || 0);
    return Math.max(0, warningTime - elapsed);
  }

  isWarningTime(): boolean {
    return this.getTimeUntilWarning() <= 0 && this.getTimeUntilTimeout() > 0;
  }

  reset(): void {
    console.log('⏰ InactivityService: Resetting activity timer');
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.callbacks.onActivity?.();
  }

  private setupActivityListeners(): void {
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    const throttledRecordActivity = this.throttle(() => {
      this.recordActivity();
    }, 1000);

    events.forEach(event => {
      document.addEventListener(event, throttledRecordActivity, { passive: true });
    });

    // Store reference to remove later
    this.activityHandler = throttledRecordActivity;
    this.activityEvents = events;
  }

  private removeActivityListeners(): void {
    if (this.activityHandler && this.activityEvents) {
      this.activityEvents.forEach(event => {
        document.removeEventListener(event, this.activityHandler!);
      });
    }
  }

  private startCheckInterval(): void {
    this.intervalId = window.setInterval(() => {
      this.checkInactivity();
    }, this.config.checkIntervalMs);
  }

  private checkInactivity(): void {
    if (!this.isActive) return;

    const now = Date.now();
    const elapsed = now - this.lastActivity;

    // Check for timeout
    if (elapsed >= this.config.timeoutMs) {
      console.log('⏰ InactivityService: Timeout reached - triggering logout');
      this.handleTimeout();
      return;
    }

    // Check for warning
    if (
      this.config.warningMs &&
      elapsed >= (this.config.timeoutMs - this.config.warningMs) &&
      !this.warningShown
    ) {
      console.log('⏰ InactivityService: Warning threshold reached');
      this.warningShown = true;
      this.callbacks.onWarning?.();
    }
  }

  private handleTimeout(): void {
    console.log('⏰ InactivityService: Handling inactivity timeout');
    this.stop();
    this.callbacks.onTimeout();
  }

  private clearTimeouts(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  }

  // Store references for cleanup
  private activityHandler: ((event: Event) => void) | null = null;
  private activityEvents: string[] = [];
}

// Export singleton instance
export const inactivityService = InactivityService.getInstance();

// Export types for consumers
export type { InactivityConfig, InactivityCallbacks };
