import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Building,
  Bell,
  HelpCircle,
  Shield,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Users,
  BarChart3,
  QrCode,
  TrendingUp,
  Package,
  Download,
  Smartphone,
  Crown,
  Gift,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/store/auth';
import * as Haptics from 'expo-haptics';

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
  showChevron: boolean;
  badge?: string;
  premium?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const { user, business, signOut } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const businessSection: SettingItem[] = [
    {
      id: 'customers_analytics',
      title: 'Customer Analytics',
      subtitle: 'Insights, segments, and purchase history',
      icon: <Users size={24} color="#3b82f6" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/customers');
      },
      showChevron: true,
      badge: 'New',
    },
    {
      id: 'advanced_reports',
      title: 'Advanced Reports',
      subtitle: 'Custom reports with date ranges & export',
      icon: <BarChart3 size={24} color="#22c55e" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/reports');
      },
      showChevron: true,
      badge: 'Enhanced',
    },
    {
      id: 'barcode_scanner',
      title: 'Barcode Scanner',
      subtitle: 'Scan products for inventory & sales',
      icon: <QrCode size={24} color="#f59e0b" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // This would open a dedicated barcode scanner screen
        Alert.alert('Barcode Scanner', 'Access barcode scanning from inventory or sales screens');
      },
      showChevron: true,
      badge: 'Pro',
      premium: true,
    },
    {
      id: 'business_profile',
      title: 'Business Profile',
      subtitle: business?.name || 'Manage your business',
      icon: <Building size={24} color="#a78bfa" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/business-profile');
      },
      showChevron: true,
    },
  ];

  const analyticsSection: SettingItem[] = [
    {
      id: 'performance_insights',
      title: 'Performance Insights',
      subtitle: 'AI-powered business recommendations',
      icon: <TrendingUp size={24} color="#ef4444" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Coming Soon', 'AI-powered insights will be available in the next update');
      },
      showChevron: true,
      premium: true,
    },
    {
      id: 'inventory_analytics',
      title: 'Inventory Analytics',
      subtitle: 'Stock levels, turnover, and forecasting',
      icon: <Package size={24} color="#6366f1" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/inventory');
      },
      showChevron: true,
    },
    {
      id: 'export_data',
      title: 'Export Data',
      subtitle: 'Backup and export your business data',
      icon: <Download size={24} color="#8b5cf6" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Export Data', 'Choose what data to export from the advanced reports section');
      },
      showChevron: true,
    },
  ];

  const appSection: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Push alerts, quiet hours, and preferences',
      icon: <Bell size={24} color="#f59e0b" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/notification-settings');
      },
      showChevron: true,
      badge: 'Updated',
    },
    {
      id: 'app_settings',
      title: 'App Settings',
      subtitle: 'Theme, language, and app preferences',
      icon: <Smartphone size={24} color="#10b981" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Coming Soon', 'App settings will be available in the next update');
      },
      showChevron: true,
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: user?.email || 'Manage your account',
      icon: <User size={24} color="#3b82f6" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/profile-settings');
      },
      showChevron: true,
    },
  ];

  const supportSection: SettingItem[] = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'FAQs, tutorials, and contact support',
      icon: <HelpCircle size={24} color="#6b7280" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Help & Support', 'Visit our help center at help.bizpilot.com');
      },
      showChevron: true,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Data privacy, security settings',
      icon: <Shield size={24} color="#6b7280" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Privacy & Security', 'Review our privacy policy and security features');
      },
      showChevron: true,
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'Terms and conditions',
      icon: <FileText size={24} color="#6b7280" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Terms of Service', 'Review our terms of service and user agreement');
      },
      showChevron: true,
    },
  ];

  const upgradeSection: SettingItem[] = [
    {
      id: 'upgrade_pro',
      title: 'Upgrade to Pro',
      subtitle: 'Unlock advanced features and analytics',
      icon: <Crown size={24} color="#f59e0b" />,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Upgrade to Pro', 'Unlock barcode scanning, AI insights, and advanced analytics');
      },
      showChevron: true,
      premium: true,
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, item.premium && styles.premiumSettingItem]}
      onPress={item.action}
    >
      <View style={styles.settingContent}>
        <View style={[styles.settingIcon, item.premium && styles.premiumIcon]}>
          {item.icon}
        </View>
        
        <View style={styles.settingText}>
          <View style={styles.settingTitleRow}>
            <Text style={[styles.settingTitle, item.premium && styles.premiumTitle]}>
              {item.title}
            </Text>
            {item.badge && (
              <View style={[
                styles.badge,
                item.badge === 'New' && styles.newBadge,
                item.badge === 'Pro' && styles.proBadge,
                item.badge === 'Enhanced' && styles.enhancedBadge,
                item.badge === 'Updated' && styles.updatedBadge,
              ]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            {item.premium && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color="#f59e0b" />
              </View>
            )}
          </View>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
        
        {item.showChevron && (
          <ChevronRight size={20} color="#6b7280" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={styles.sectionCard}>
        {items.map((item, index) => (
          <View key={item.id}>
            {renderSettingItem(item)}
            {index < items.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0f172a']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Info */}
          <Card style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <User size={24} color="#a78bfa" />
              </View>
              <View style={styles.userText}>
                <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                {business && (
                  <Text style={styles.businessName}>{business.name}</Text>
                )}
              </View>
            </View>
          </Card>

          {/* Upgrade Section (if not pro) */}
          {renderSection('Premium Features', upgradeSection)}

          {/* Business Section */}
          {renderSection('Business Management', businessSection)}

          {/* Analytics Section */}
          {renderSection('Analytics & Insights', analyticsSection)}

          {/* App Section */}
          {renderSection('App Settings', appSection)}

          {/* Support Section */}
          {renderSection('Support', supportSection)}

          {/* Sign Out */}
          <Card style={styles.signOutCard}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
              <LogOut size={24} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Card>

          <View style={styles.appVersion}>
            <Text style={styles.versionText}>BizPilot Mobile v1.0.0</Text>
            <Text style={styles.buildText}>Build 2024.01.15</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    marginVertical: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  businessName: {
    fontSize: 12,
    color: '#a78bfa',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    padding: 16,
  },
  premiumSettingItem: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  premiumIcon: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  settingText: {
    flex: 1,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  premiumTitle: {
    color: '#f59e0b',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  newBadge: {
    backgroundColor: '#22c55e',
  },
  proBadge: {
    backgroundColor: '#f59e0b',
  },
  enhancedBadge: {
    backgroundColor: '#3b82f6',
  },
  updatedBadge: {
    backgroundColor: '#a78bfa',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  premiumBadge: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginLeft: 72,
  },
  signOutCard: {
    marginTop: 12,
    marginBottom: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
  appVersion: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  buildText: {
    fontSize: 10,
    color: '#6b7280',
  },
}); 