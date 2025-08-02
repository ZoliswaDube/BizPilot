import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Bell,
  Shield,
  Moon,
  Smartphone,
  HelpCircle,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  Building,
  CreditCard,
  Database,
  Mail,
  Phone,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/auth';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/styles/theme';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

export default function SettingsScreen() {
  const { user, business, signOut } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const profileSection: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Edit your personal information',
      icon: <User size={24} color={theme.colors.primary[500]} />,
      action: () => Alert.alert('Profile', 'Profile editing coming soon'),
      showChevron: true,
    },
    {
      id: 'business',
      title: 'Business Settings',
      subtitle: business?.name || 'Manage your business',
      icon: <Building size={24} color={theme.colors.primary[500]} />,
      action: () => Alert.alert('Business', 'Business settings coming soon'),
      showChevron: true,
    },
  ];

  const appSection: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Push notifications and alerts',
      icon: <Bell size={24} color={theme.colors.primary[500]} />,
      action: () => {},
      rightElement: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{
            false: theme.colors.gray[600],
            true: theme.colors.primary[600],
          }}
          thumbColor={theme.colors.white}
        />
      ),
    },
    {
      id: 'biometric',
      title: 'Biometric Authentication',
      subtitle: 'Use Face ID or Fingerprint',
      icon: <Shield size={24} color={theme.colors.primary[500]} />,
      action: () => {},
      rightElement: (
        <Switch
          value={biometricEnabled}
          onValueChange={setBiometricEnabled}
          trackColor={{
            false: theme.colors.gray[600],
            true: theme.colors.primary[600],
          }}
          thumbColor={theme.colors.white}
        />
      ),
    },
    {
      id: 'darkMode',
      title: 'Dark Mode',
      subtitle: 'Use dark theme',
      icon: <Moon size={24} color={theme.colors.primary[500]} />,
      action: () => {},
      rightElement: (
        <Switch
          value={darkModeEnabled}
          onValueChange={setDarkModeEnabled}
          trackColor={{
            false: theme.colors.gray[600],
            true: theme.colors.primary[600],
          }}
          thumbColor={theme.colors.white}
        />
      ),
    },
  ];

  const dataSection: SettingItem[] = [
    {
      id: 'backup',
      title: 'Data Backup',
      subtitle: 'Backup and restore your data',
      icon: <Database size={24} color={theme.colors.primary[500]} />,
      action: () => Alert.alert('Backup', 'Data backup coming soon'),
      showChevron: true,
    },
    {
      id: 'sync',
      title: 'Sync Settings',
      subtitle: 'Manage offline sync preferences',
      icon: <Smartphone size={24} color={theme.colors.primary[500]} />,
      action: () => Alert.alert('Sync', 'Sync settings coming soon'),
      showChevron: true,
    },
  ];

  const supportSection: SettingItem[] = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help with BizPilot',
      icon: <HelpCircle size={24} color={theme.colors.primary[500]} />,
      action: () => Alert.alert('Help', 'Help center coming soon'),
      showChevron: true,
    },
    {
      id: 'contact',
      title: 'Contact Us',
      subtitle: 'Reach out to our support team',
      icon: <Mail size={24} color={theme.colors.primary[500]} />,
      action: () => Alert.alert('Contact', 'Contact options coming soon'),
      showChevron: true,
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.action}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingIcon}>
          {item.icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        <View style={styles.settingRight}>
          {item.rightElement || (
            item.showChevron && (
              <ChevronRight size={20} color={theme.colors.gray[400]} />
            )
          )}
        </View>
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
            {index < items.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.profileAvatar}>
              <User size={32} color={theme.colors.primary[500]} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.email || 'User'}</Text>
              <Text style={styles.profileEmail}>{business?.name || 'Business Owner'}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <SettingsIcon size={20} color={theme.colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Settings Sections */}
        {renderSection('Account', profileSection)}
        {renderSection('App Preferences', appSection)}
        {renderSection('Data & Storage', dataSection)}
        {renderSection('Support', supportSection)}

        {/* App Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Text style={styles.appName}>BizPilot Mobile</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appBuild}>Build 1</Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <Button
            title="Sign Out"
            variant="danger"
            onPress={handleSignOut}
            style={styles.signOutButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for small businesses
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  profileCard: {
    marginBottom: theme.spacing.lg,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.dark[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[400],
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: 0,
  },
  settingItem: {
    padding: theme.spacing.md,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: theme.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.dark[700],
    marginLeft: theme.spacing.md + 24 + theme.spacing.md, // icon width + margins
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  infoContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginBottom: 2,
  },
  appBuild: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
  },
  signOutSection: {
    marginBottom: theme.spacing.xl,
  },
  signOutButton: {
    marginHorizontal: theme.spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingBottom: theme.spacing['2xl'],
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginBottom: theme.spacing.md,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[500],
  },
  footerDivider: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
    marginHorizontal: theme.spacing.sm,
  },
}); 