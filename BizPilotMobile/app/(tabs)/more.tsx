import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Users,
  Building,
  Tag,
  Truck,
  Bot,
  QrCode,
  Settings,
  ChevronRight,
  UserCheck,
  BarChart3,
  HelpCircle,
  FileText,
  Shield,
  Mail,
  Phone,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAnalytics } from '../../src/hooks/useAnalytics';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/styles/theme';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  onPress: () => void;
  badge?: string;
  color?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const router = useRouter();
  useAnalytics('More');
  
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleFeaturePress = (featureId: string, title: string) => {
    setSelectedFeature(featureId);
    Alert.alert(
      title,
      'This feature is being developed. It will provide full parity with the web application.',
      [
        { text: 'OK', onPress: () => setSelectedFeature(null) }
      ]
    );
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Business Management',
      items: [
        {
          id: 'customers',
          title: 'Customer Management',
          subtitle: 'Manage customer database and communications',
          icon: Users,
          onPress: () => {
            // Navigate to existing customers tab
            Alert.alert('Info', 'Customer management is available in the Customers tab');
          },
          color: theme.colors.blue[500],
        },
        {
          id: 'suppliers',
          title: 'Supplier Management',
          subtitle: 'Manage suppliers and vendor relationships',
          icon: Truck,
          onPress: () => handleFeaturePress('suppliers', 'Supplier Management'),
          color: theme.colors.green[500],
        },
        {
          id: 'categories',
          title: 'Categories',
          subtitle: 'Organize products into categories',
          icon: Tag,
          onPress: () => handleFeaturePress('categories', 'Category Management'),
          color: theme.colors.orange[500],
        },
        {
          id: 'business-profile',
          title: 'Business Profile',
          subtitle: 'Manage your business information',
          icon: Building,
          onPress: () => handleFeaturePress('business-profile', 'Business Profile'),
          color: theme.colors.purple[500],
        },
      ],
    },
    {
      title: 'Team & Access',
      items: [
        {
          id: 'user-management',
          title: 'User Management',
          subtitle: 'Manage team members and permissions',
          icon: UserCheck,
          onPress: () => handleFeaturePress('user-management', 'User Management'),
          badge: 'Pro',
          color: theme.colors.indigo[500],
        },
        {
          id: 'roles-permissions',
          title: 'Roles & Permissions',
          subtitle: 'Configure user roles and access levels',
          icon: Shield,
          onPress: () => handleFeaturePress('roles-permissions', 'Roles & Permissions'),
          badge: 'Pro',
          color: theme.colors.red[500],
        },
      ],
    },
    {
      title: 'AI & Automation',
      items: [
        {
          id: 'ai-assistant',
          title: 'AI Business Assistant',
          subtitle: 'Get intelligent business insights and recommendations',
          icon: Bot,
          onPress: () => {
            router.push('/ai-chat');
          },
          badge: 'New',
          color: theme.colors.pink[500],
        },
        {
          id: 'qr-generator',
          title: 'QR Code Generator',
          subtitle: 'Generate QR codes for products and payments',
          icon: QrCode,
          onPress: () => handleFeaturePress('qr-generator', 'QR Code Generator'),
          color: theme.colors.cyan[500],
        },
      ],
    },
    {
      title: 'Reports & Analytics',
      items: [
        {
          id: 'financial-reports',
          title: 'Financial Reports',
          subtitle: 'View detailed financial analytics',
          icon: BarChart3,
          onPress: () => {
            Alert.alert('Info', 'Financial reports are available in the Financial tab');
          },
          color: theme.colors.emerald[500],
        },
        {
          id: 'export-data',
          title: 'Export Data',
          subtitle: 'Export your business data',
          icon: FileText,
          onPress: () => handleFeaturePress('export-data', 'Export Data'),
          color: theme.colors.amber[500],
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help-center',
          title: 'Help Center',
          subtitle: 'Get help and support',
          icon: HelpCircle,
          onPress: () => handleFeaturePress('help-center', 'Help Center'),
          color: theme.colors.gray[500],
        },
        {
          id: 'contact-support',
          title: 'Contact Support',
          subtitle: 'Reach out to our support team',
          icon: Mail,
          onPress: () => handleFeaturePress('contact-support', 'Contact Support'),
          color: theme.colors.blue[600],
        },
        {
          id: 'app-settings',
          title: 'App Settings',
          subtitle: 'Configure app preferences',
          icon: Settings,
          onPress: () => {
            Alert.alert('Info', 'App settings are available in the Settings tab');
          },
          color: theme.colors.gray[600],
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <item.icon size={24} color={item.color} />
        </View>
        <View style={styles.menuItemText}>
          <View style={styles.menuItemHeader}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.badge && (
              <View style={[
                styles.badge,
                { backgroundColor: item.badge === 'Pro' ? theme.colors.yellow[500] : theme.colors.green[500] }
              ]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        </View>
        <ChevronRight size={20} color={theme.colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );

  const renderSection = (section: MenuSection) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Card style={styles.sectionCard}>
        {section.items.map((item, index) => (
          <View key={item.id}>
            {renderMenuItem(item)}
            {index < section.items.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Additional features and settings</Text>
      </View>

      {/* Feature Parity Notice */}
      <Card style={styles.parityNotice}>
        <View style={styles.parityContent}>
          <View style={styles.parityIcon}>
            <BarChart3 size={24} color={theme.colors.primary[500]} />
          </View>
          <View style={styles.parityText}>
            <Text style={styles.parityTitle}>Complete Feature Parity</Text>
            <Text style={styles.parityDescription}>
              All web application features are being implemented for mobile. 
              AI Assistant is now fully functional!
            </Text>
          </View>
        </View>
      </Card>

      {/* Menu Sections */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {menuSections.map(renderSection)}

        {/* Development Status */}
        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>Development Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.green[500] }]} />
              <Text style={styles.statusLabel}>Completed</Text>
              <Text style={styles.statusCount}>8</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.yellow[500] }]} />
              <Text style={styles.statusLabel}>In Progress</Text>
              <Text style={styles.statusCount}>6</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.blue[500] }]} />
              <Text style={styles.statusLabel}>Planned</Text>
              <Text style={styles.statusCount}>3</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionButtons}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/ai-chat')}
            >
              <Bot size={20} color={theme.colors.primary[500]} />
              <Text style={styles.quickActionText}>Ask AI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Mail size={20} color={theme.colors.primary[500]} />
              <Text style={styles.quickActionText}>Email Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <HelpCircle size={20} color={theme.colors.primary[500]} />
              <Text style={styles.quickActionText}>Get Help</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* App Info */}
        <Card style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>BizPilot Mobile</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0 (Build 1)</Text>
          <Text style={styles.appInfoDescription}>
            Complete business management solution with full feature parity to the web application.
          </Text>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🚀 Building the future of mobile business management
          </Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  parityNotice: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary[950],
    borderColor: theme.colors.primary[800],
  },
  parityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parityIcon: {
    marginRight: theme.spacing.md,
  },
  parityText: {
    flex: 1,
  },
  parityTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[300],
    marginBottom: theme.spacing.xs,
  },
  parityDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[400],
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  sectionCard: {
    padding: 0,
  },
  menuItem: {
    padding: theme.spacing.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  menuItemTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
    flex: 1,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.dark[950],
  },
  menuItemSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.dark[700],
    marginLeft: theme.spacing.lg + 48 + theme.spacing.md,
  },
  statusCard: {
    marginBottom: theme.spacing.md,
  },
  statusTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginBottom: theme.spacing.xs,
  },
  statusCount: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  quickActions: {
    marginBottom: theme.spacing.md,
  },
  quickActionsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  quickActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
    minWidth: 80,
  },
  quickActionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[500],
    marginTop: theme.spacing.sm,
    fontWeight: theme.fontWeight.medium,
  },
  appInfo: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  appInfoTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  appInfoVersion: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginBottom: theme.spacing.sm,
  },
  appInfoDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
    textAlign: 'center',
  },
}); 