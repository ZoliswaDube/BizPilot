import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async initialize(userId: string, businessId: string) {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return;
    }

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

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);

      // TODO: Store token in database via MCP server
      // await mcp_supabase_execute_sql({
      //   query: `
      //     INSERT INTO user_push_tokens (user_id, business_id, token, platform, is_active)
      //     VALUES ($1, $2, $3, $4, true)
      //     ON CONFLICT (user_id, token)
      //     DO UPDATE SET 
      //       is_active = true,
      //       updated_at = now()
      //   `,
      //   params: [userId, businessId, token, Platform.OS]
      // });

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#a78bfa', // Primary color from theme
        });
      }

      return token;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  static async scheduleOrderStatusNotification(
    orderId: string,
    orderNumber: string,
    status: string,
    delay = 0
  ) {
    const title = `Order ${orderNumber} Updated`;
    const body = `Your order status has been changed to ${status}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { orderId, type: 'order_status' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: delay > 0 ? { seconds: delay } : null,
    });
  }

  static async scheduleInventoryAlert(productName: string, currentQuantity: number) {
    const title = 'Low Inventory Alert';
    const body = `${productName} is running low (${currentQuantity} remaining)`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'low_inventory', productName },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  static async schedulePaymentNotification(amount: number, customerName: string) {
    const title = 'Payment Received';
    const body = `Received $${amount.toFixed(2)} from ${customerName}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'payment_received', amount },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  static async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  static async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }
} 