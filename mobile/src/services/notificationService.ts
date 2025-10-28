import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { mcp_supabase_execute_sql } from './mcpClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'low_stock' | 'new_order' | 'payment_due' | 'system_alert' | 'marketing' | 'reminder';
  title: string;
  body: string;
  data?: any;
  priority: 'low' | 'normal' | 'high';
  category?: string;
}

export interface NotificationPreferences {
  low_stock_alerts: boolean;
  order_notifications: boolean;
  payment_reminders: boolean;
  system_updates: boolean;
  marketing_messages: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private userId: string | null = null;
  private businessId: string | null = null;

  async initialize(userId: string, businessId: string) {
    this.userId = userId;
    this.businessId = businessId;

    if (Device.isDevice) {
      await this.registerForPushNotificationsAsync();
      await this.setupNotificationCategories();
      await this.loadUserPreferences();
    } else {
      console.log('Push notifications are not supported on simulator/emulator');
    }
  }

  private async registerForPushNotificationsAsync() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.expoPushToken = token.data;
      console.log('Expo Push Token:', token.data);

      // Save token to database
      await this.saveTokenToDatabase(token.data);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#a78bfa',
        });

        // Create specific channels for different notification types
        await this.createNotificationChannels();
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  private async createNotificationChannels() {
    const channels = [
      {
        id: 'low_stock',
        name: 'Low Stock Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications when inventory is running low',
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      },
      {
        id: 'orders',
        name: 'Order Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'New orders and order updates',
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      },
      {
        id: 'payments',
        name: 'Payment Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Payment due dates and reminders',
        sound: 'default',
      },
      {
        id: 'system',
        name: 'System Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Important system updates and alerts',
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      },
      {
        id: 'marketing',
        name: 'Marketing Messages',
        importance: Notifications.AndroidImportance.LOW,
        description: 'Promotional and marketing notifications',
        sound: 'default',
      },
      {
        id: 'reminders',
        name: 'Business Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Task reminders and business alerts',
        sound: 'default',
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, channel);
    }
  }

  private async setupNotificationCategories() {
    // Define notification categories with actions
    await Notifications.setNotificationCategoryAsync('low_stock', [
      {
        identifier: 'view_inventory',
        buttonTitle: 'View Inventory',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
      {
        identifier: 'reorder',
        buttonTitle: 'Reorder',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('new_order', [
      {
        identifier: 'view_order',
        buttonTitle: 'View Order',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
      {
        identifier: 'mark_processing',
        buttonTitle: 'Mark Processing',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('payment_reminder', [
      {
        identifier: 'view_payment',
        buttonTitle: 'View Payment',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
      {
        identifier: 'mark_paid',
        buttonTitle: 'Mark Paid',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
    ]);
  }

  private async saveTokenToDatabase(token: string) {
    try {
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO user_push_tokens (user_id, business_id, token, platform, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, platform) 
          DO UPDATE SET token = $3, updated_at = $5
        `,
        params: [
          this.userId,
          this.businessId,
          token,
          Platform.OS,
          new Date().toISOString(),
        ],
      });
    } catch (error) {
      console.error('Error saving push token to database:', error);
    }
  }

  private async loadUserPreferences(): Promise<NotificationPreferences> {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT * FROM user_notification_preferences 
          WHERE user_id = $1 AND business_id = $2
        `,
        params: [this.userId, this.businessId],
      });

      if (result.success && result.data?.length > 0) {
        return result.data[0];
      }

      // Return default preferences if none exist
      const defaultPreferences: NotificationPreferences = {
        low_stock_alerts: true,
        order_notifications: true,
        payment_reminders: true,
        system_updates: true,
        marketing_messages: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        sound_enabled: true,
        vibration_enabled: true,
      };

      // Save default preferences
      await this.updateNotificationPreferences(defaultPreferences);
      return defaultPreferences;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return {
        low_stock_alerts: true,
        order_notifications: true,
        payment_reminders: true,
        system_updates: true,
        marketing_messages: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        sound_enabled: true,
        vibration_enabled: true,
      };
    }
  }

  async updateNotificationPreferences(preferences: NotificationPreferences) {
    try {
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO user_notification_preferences (
            user_id, business_id, low_stock_alerts, order_notifications,
            payment_reminders, system_updates, marketing_messages,
            quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
            sound_enabled, vibration_enabled, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (user_id, business_id)
          DO UPDATE SET 
            low_stock_alerts = $3,
            order_notifications = $4,
            payment_reminders = $5,
            system_updates = $6,
            marketing_messages = $7,
            quiet_hours_enabled = $8,
            quiet_hours_start = $9,
            quiet_hours_end = $10,
            sound_enabled = $11,
            vibration_enabled = $12,
            updated_at = $13
        `,
        params: [
          this.userId,
          this.businessId,
          preferences.low_stock_alerts,
          preferences.order_notifications,
          preferences.payment_reminders,
          preferences.system_updates,
          preferences.marketing_messages,
          preferences.quiet_hours_enabled,
          preferences.quiet_hours_start,
          preferences.quiet_hours_end,
          preferences.sound_enabled,
          preferences.vibration_enabled,
          new Date().toISOString(),
        ],
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  async scheduleLocalNotification(notificationData: NotificationData, scheduledTime?: Date) {
    try {
      const preferences = await this.loadUserPreferences();
      
      // Check if this type of notification is enabled
      if (!this.isNotificationTypeEnabled(notificationData.type, preferences)) {
        return null;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        console.log('Notification suppressed due to quiet hours');
        return null;
      }

      const notificationContent: Notifications.NotificationContentInput = {
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data || {},
        categoryIdentifier: this.getCategoryForType(notificationData.type),
        sound: preferences.sound_enabled ? 'default' : false,
      };

      if (Platform.OS === 'android') {
        notificationContent.channelId = this.getChannelForType(notificationData.type);
        notificationContent.priority = this.getAndroidPriority(notificationData.priority);
      }

      const trigger = scheduledTime 
        ? { date: scheduledTime }
        : undefined;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      // Log notification to database
      await this.logNotification(identifier, notificationData);

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  private isNotificationTypeEnabled(type: NotificationData['type'], preferences: NotificationPreferences): boolean {
    switch (type) {
      case 'low_stock':
        return preferences.low_stock_alerts;
      case 'new_order':
        return preferences.order_notifications;
      case 'payment_due':
        return preferences.payment_reminders;
      case 'system_alert':
        return preferences.system_updates;
      case 'marketing':
        return preferences.marketing_messages;
      case 'reminder':
        return true; // Always enabled for business reminders
      default:
        return true;
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 23:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private getCategoryForType(type: NotificationData['type']): string {
    switch (type) {
      case 'low_stock':
        return 'low_stock';
      case 'new_order':
        return 'new_order';
      case 'payment_due':
        return 'payment_reminder';
      default:
        return 'default';
    }
  }

  private getChannelForType(type: NotificationData['type']): string {
    switch (type) {
      case 'low_stock':
        return 'low_stock';
      case 'new_order':
        return 'orders';
      case 'payment_due':
        return 'payments';
      case 'system_alert':
        return 'system';
      case 'marketing':
        return 'marketing';
      case 'reminder':
        return 'reminders';
      default:
        return 'default';
    }
  }

  private getAndroidPriority(priority: NotificationData['priority']): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  private async logNotification(identifier: string, notificationData: NotificationData) {
    try {
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO notification_logs (
            user_id, business_id, notification_id, type, title, body,
            data, priority, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        params: [
          this.userId,
          this.businessId,
          identifier,
          notificationData.type,
          notificationData.title,
          notificationData.body,
          JSON.stringify(notificationData.data || {}),
          notificationData.priority,
          new Date().toISOString(),
        ],
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Business-specific notification helpers
  async sendLowStockAlert(itemName: string, currentQuantity: number, unit: string, itemId: string) {
    await this.scheduleLocalNotification({
      type: 'low_stock',
      title: '📦 Low Stock Alert',
      body: `${itemName} is running low (${currentQuantity} ${unit} remaining)`,
      data: { itemId, currentQuantity, type: 'low_stock' },
      priority: 'high',
    });
  }

  async sendNewOrderNotification(orderNumber: string, customerName: string, amount: number, orderId: string) {
    await this.scheduleLocalNotification({
      type: 'new_order',
      title: '🛒 New Order Received',
      body: `Order ${orderNumber} from ${customerName} - $${amount.toFixed(2)}`,
      data: { orderId, orderNumber, customerName, amount, type: 'new_order' },
      priority: 'high',
    });
  }

  async sendPaymentReminder(customerName: string, amount: number, dueDate: string, invoiceId: string) {
    const scheduledTime = new Date(dueDate);
    scheduledTime.setDate(scheduledTime.getDate() - 1); // 1 day before due date

    await this.scheduleLocalNotification({
      type: 'payment_due',
      title: '💰 Payment Due Tomorrow',
      body: `${customerName} has a payment of $${amount.toFixed(2)} due tomorrow`,
      data: { invoiceId, customerName, amount, dueDate, type: 'payment_due' },
      priority: 'normal',
    }, scheduledTime);
  }

  async sendSystemAlert(title: string, message: string, data?: any) {
    await this.scheduleLocalNotification({
      type: 'system_alert',
      title,
      body: message,
      data: { ...data, type: 'system_alert' },
      priority: 'high',
    });
  }

  async sendBusinessReminder(title: string, message: string, scheduledTime: Date, data?: any) {
    await this.scheduleLocalNotification({
      type: 'reminder',
      title,
      body: message,
      data: { ...data, type: 'reminder' },
      priority: 'normal',
    }, scheduledTime);
  }

  // Notification management
  async cancelNotification(identifier: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge() {
    await this.setBadgeCount(0);
  }

  // Analytics and insights
  async getNotificationHistory(days: number = 30) {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT * FROM notification_logs 
          WHERE user_id = $1 AND business_id = $2 
            AND created_at >= $3
          ORDER BY created_at DESC
        `,
        params: [
          this.userId,
          this.businessId,
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        ],
      });

      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  async getNotificationStats() {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            type,
            COUNT(*) as count,
            DATE(created_at) as date
          FROM notification_logs 
          WHERE user_id = $1 AND business_id = $2 
            AND created_at >= $3
          GROUP BY type, DATE(created_at)
          ORDER BY date DESC, count DESC
        `,
        params: [
          this.userId,
          this.businessId,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ],
      });

      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return [];
    }
  }

  // Setup background tasks for automated notifications
  async setupAutomatedNotifications() {
    // This would typically be done through a backend service
    // For demo purposes, we'll show how it could work locally
    
    // Check for low stock items every hour
    setInterval(async () => {
      await this.checkLowStockItems();
    }, 60 * 60 * 1000); // 1 hour

    // Check for due payments daily at 9 AM
    const now = new Date();
    const nextNineAM = new Date();
    nextNineAM.setHours(9, 0, 0, 0);
    if (nextNineAM <= now) {
      nextNineAM.setDate(nextNineAM.getDate() + 1);
    }

    const timeUntilNineAM = nextNineAM.getTime() - now.getTime();
    setTimeout(async () => {
      await this.checkDuePayments();
      // Then repeat daily
      setInterval(async () => {
        await this.checkDuePayments();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilNineAM);
  }

  private async checkLowStockItems() {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT i.*, p.name as product_name
          FROM inventory i
          LEFT JOIN products p ON i.product_id = p.id
          WHERE i.business_id = $1 
            AND i.current_quantity <= i.low_stock_alert
            AND i.low_stock_alert IS NOT NULL
            AND i.low_stock_alert > 0
        `,
        params: [this.businessId],
      });

      if (result.success && result.data?.length > 0) {
        for (const item of result.data) {
          await this.sendLowStockAlert(
            item.product_name || item.name,
            item.current_quantity,
            item.unit,
            item.id
          );
        }
      }
    } catch (error) {
      console.error('Error checking low stock items:', error);
    }
  }

  private async checkDuePayments() {
    try {
      // This would check for overdue invoices or payments
      // Implementation depends on your payment/invoice system
      console.log('Checking for due payments...');
    } catch (error) {
      console.error('Error checking due payments:', error);
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService(); 