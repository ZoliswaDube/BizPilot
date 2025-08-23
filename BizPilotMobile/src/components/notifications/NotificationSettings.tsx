import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import {
  Bell,
  BellOff,
  Clock,
  Volume2,
  VolumeX,
  Smartphone,
  Settings,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Gift,
  Calendar,
  X,
  Save,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { notificationService, NotificationPreferences } from '../../services/notificationService';
import { useAuthStore } from '../../store/auth';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface NotificationCategory {
  id: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export default function NotificationSettings() {
  const { user, business } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
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
  });
  
  const [showQuietHoursModal, setShowQuietHoursModal] = useState(false);
  const [tempQuietHours, setTempQuietHours] = useState({
    start: preferences.quiet_hours_start,
    end: preferences.quiet_hours_end,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // This would load from the notification service
      // For now, using default preferences
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | string) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      
      // Update through notification service
      await notificationService.updateNotificationPreferences(newPreferences);
      
      if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const saveQuietHours = async () => {
    try {
      const newPreferences = {
        ...preferences,
        quiet_hours_start: tempQuietHours.start,
        quiet_hours_end: tempQuietHours.end,
      };
      
      setPreferences(newPreferences);
      await notificationService.updateNotificationPreferences(newPreferences);
      
      setShowQuietHoursModal(false);
      if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    } catch (error) {
      console.error('Error saving quiet hours:', error);
      Alert.alert('Error', 'Failed to save quiet hours settings');
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.scheduleLocalNotification({
        type: 'system_alert',
        title: '🔔 Test Notification',
        body: 'This is a test notification to verify your settings are working correctly.',
        priority: 'normal',
      });
      
      if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
      Alert.alert('Test Sent', 'A test notification has been sent. You should see it shortly.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const notificationCategories: NotificationCategory[] = [
    {
      id: 'low_stock_alerts',
      title: 'Low Stock Alerts',
      description: 'Get notified when inventory items are running low',
      icon: <Package size={20} color="#f59e0b" />,
      enabled: preferences.low_stock_alerts,
    },
    {
      id: 'order_notifications',
      title: 'Order Notifications',
      description: 'New orders, order updates, and status changes',
      icon: <ShoppingCart size={20} color="#3b82f6" />,
      enabled: preferences.order_notifications,
    },
    {
      id: 'payment_reminders',
      title: 'Payment Reminders',
      description: 'Due dates, overdue payments, and payment confirmations',
      icon: <DollarSign size={20} color="#22c55e" />,
      enabled: preferences.payment_reminders,
    },
    {
      id: 'system_updates',
      title: 'System Updates',
      description: 'Important app updates and system maintenance alerts',
      icon: <AlertTriangle size={20} color="#ef4444" />,
      enabled: preferences.system_updates,
    },
    {
      id: 'marketing_messages',
      title: 'Marketing Messages',
      description: 'Promotional offers, tips, and business insights',
      icon: <Gift size={20} color="#a78bfa" />,
      enabled: preferences.marketing_messages,
    },
  ];

  const renderQuietHoursModal = () => (
    <Modal
      visible={showQuietHoursModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowQuietHoursModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowQuietHoursModal(false)}>
            <X size={24} color="#a78bfa" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Quiet Hours</Text>
          <TouchableOpacity onPress={saveQuietHours}>
            <Save size={24} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            During quiet hours, non-urgent notifications will be suppressed. 
            Critical alerts like system emergencies will still come through.
          </Text>

          <Card style={styles.timePickerCard}>
            <Text style={styles.timePickerLabel}>Start Time</Text>
            <Input
              value={tempQuietHours.start}
              onChangeText={(value) => setTempQuietHours(prev => ({ ...prev, start: value }))}
              placeholder="HH:MM (24-hour format)"
              style={styles.timeInput}
            />
            
            <Text style={styles.timePickerLabel}>End Time</Text>
            <Input
              value={tempQuietHours.end}
              onChangeText={(value) => setTempQuietHours(prev => ({ ...prev, end: value }))}
              placeholder="HH:MM (24-hour format)"
              style={styles.timeInput}
            />

            <View style={styles.timeExample}>
              <Clock size={16} color="#9ca3af" />
              <Text style={styles.timeExampleText}>
                Example: 22:00 to 08:00 (10 PM to 8 AM)
              </Text>
            </View>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Bell size={32} color="#a78bfa" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Notification Settings</Text>
              <Text style={styles.headerSubtitle}>
                Manage how and when you receive business alerts
              </Text>
            </View>
          </View>
        </Card>

        {/* Notification Categories */}
        <Card style={styles.categoriesCard}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Text style={styles.sectionDescription}>
            Choose which types of notifications you want to receive
          </Text>

          <View style={styles.categoriesList}>
            {notificationCategories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryIcon}>
                    {category.icon}
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                </View>
                
                <Switch
                  value={category.enabled}
                  onValueChange={(value) => updatePreference(category.id, value)}
                  trackColor={{ false: '#374151', true: '#a78bfa' }}
                  thumbColor={category.enabled ? '#ffffff' : '#9ca3af'}
                />
              </View>
            ))}
          </View>
        </Card>

        {/* Sound & Vibration */}
        <Card style={styles.soundCard}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>
          
          <View style={styles.soundOption}>
            <View style={styles.soundInfo}>
              <View style={styles.soundIcon}>
                {preferences.sound_enabled ? (
                  <Volume2 size={20} color="#22c55e" />
                ) : (
                  <VolumeX size={20} color="#6b7280" />
                )}
              </View>
              <View style={styles.soundText}>
                <Text style={styles.soundTitle}>Sound</Text>
                <Text style={styles.soundDescription}>Play sound for notifications</Text>
              </View>
            </View>
            
            <Switch
              value={preferences.sound_enabled}
              onValueChange={(value) => updatePreference('sound_enabled', value)}
              trackColor={{ false: '#374151', true: '#a78bfa' }}
              thumbColor={preferences.sound_enabled ? '#ffffff' : '#9ca3af'}
            />
          </View>

          <View style={styles.soundOption}>
            <View style={styles.soundInfo}>
              <View style={styles.soundIcon}>
                <Smartphone size={20} color={preferences.vibration_enabled ? '#3b82f6' : '#6b7280'} />
              </View>
              <View style={styles.soundText}>
                <Text style={styles.soundTitle}>Vibration</Text>
                <Text style={styles.soundDescription}>Vibrate device for notifications</Text>
              </View>
            </View>
            
            <Switch
              value={preferences.vibration_enabled}
              onValueChange={(value) => updatePreference('vibration_enabled', value)}
              trackColor={{ false: '#374151', true: '#a78bfa' }}
              thumbColor={preferences.vibration_enabled ? '#ffffff' : '#9ca3af'}
            />
          </View>
        </Card>

        {/* Quiet Hours */}
        <Card style={styles.quietHoursCard}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionDescription}>
            Suppress non-urgent notifications during specified hours
          </Text>

          <View style={styles.quietHoursOption}>
            <View style={styles.quietHoursInfo}>
              <View style={styles.quietHoursIcon}>
                {preferences.quiet_hours_enabled ? (
                  <BellOff size={20} color="#6b7280" />
                ) : (
                  <Bell size={20} color="#a78bfa" />
                )}
              </View>
              <View style={styles.quietHoursText}>
                <Text style={styles.quietHoursTitle}>Enable Quiet Hours</Text>
                <Text style={styles.quietHoursDescription}>
                  {preferences.quiet_hours_enabled
                    ? `Active from ${preferences.quiet_hours_start} to ${preferences.quiet_hours_end}`
                    : 'Disabled'
                  }
                </Text>
              </View>
            </View>
            
            <Switch
              value={preferences.quiet_hours_enabled}
              onValueChange={(value) => updatePreference('quiet_hours_enabled', value)}
              trackColor={{ false: '#374151', true: '#a78bfa' }}
              thumbColor={preferences.quiet_hours_enabled ? '#ffffff' : '#9ca3af'}
            />
          </View>

          {preferences.quiet_hours_enabled && (
            <TouchableOpacity
              style={styles.configureButton}
              onPress={() => {
                setTempQuietHours({
                  start: preferences.quiet_hours_start,
                  end: preferences.quiet_hours_end,
                });
                setShowQuietHoursModal(true);
              }}
            >
              <Clock size={16} color="#a78bfa" />
              <Text style={styles.configureButtonText}>Configure Hours</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Test Notification */}
        <Card style={styles.testCard}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <Text style={styles.sectionDescription}>
            Send a test notification to verify your settings are working
          </Text>

          <Button
            title="Send Test Notification"
            onPress={testNotification}
            style={styles.testButton}
            leftIcon={<Bell size={16} color="#ffffff" />}
          />
        </Card>

        {/* Additional Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Settings size={20} color="#9ca3af" />
            <Text style={styles.infoTitle}>About Notifications</Text>
          </View>
          
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • Critical alerts (system emergencies) will always come through
            </Text>
            <Text style={styles.infoItem}>
              • You can customize notification settings for each device
            </Text>
            <Text style={styles.infoItem}>
              • Low stock alerts are sent when items reach their alert threshold
            </Text>
            <Text style={styles.infoItem}>
              • Payment reminders are sent 1 day before due dates
            </Text>
            <Text style={styles.infoItem}>
              • All notification data is encrypted and stored securely
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Quiet Hours Modal */}
      {renderQuietHoursModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerCard: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
    lineHeight: 20,
  },
  categoriesCard: {
    marginBottom: 20,
  },
  categoriesList: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  soundCard: {
    marginBottom: 20,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
  },
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  soundIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  soundText: {
    flex: 1,
  },
  soundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  soundDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quietHoursCard: {
    marginBottom: 20,
  },
  quietHoursOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
  },
  quietHoursInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quietHoursIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quietHoursText: {
    flex: 1,
  },
  quietHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  quietHoursDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#334155',
    borderRadius: 8,
    gap: 8,
  },
  configureButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a78bfa',
  },
  testCard: {
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#a78bfa',
  },
  infoCard: {
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
    marginLeft: 8,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 24,
  },
  timePickerCard: {
    padding: 16,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  timeInput: {
    marginBottom: 20,
  },
  timeExample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  timeExampleText: {
    fontSize: 12,
    color: '#9ca3af',
  },
}); 