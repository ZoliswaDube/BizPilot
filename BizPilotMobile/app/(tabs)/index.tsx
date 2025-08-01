import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, Package, Users, DollarSign } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/auth';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/styles/theme';
import * as Haptics from 'expo-haptics';

export default function DashboardScreen() {
  const { user, business } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // TODO: Refresh dashboard data via MCP server
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const quickActions = [
    { title: 'New Order', icon: Plus, color: theme.colors.primary[500] },
    { title: 'Add Customer', icon: Users, color: theme.colors.blue[500] },
    { title: 'Record Expense', icon: DollarSign, color: theme.colors.warning[500] },
    { title: 'Check Inventory', icon: Package, color: theme.colors.success[500] },
  ];

  const metrics = [
    { title: 'Today\'s Sales', value: '$1,234', change: '+12%', color: theme.colors.success[500] },
    { title: 'Pending Orders', value: '8', change: '+2', color: theme.colors.primary[500] },
    { title: 'Low Stock Items', value: '3', change: '-1', color: theme.colors.warning[500] },
    { title: 'Active Customers', value: '42', change: '+5', color: theme.colors.blue[500] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business?.name || 'Business'}</Text>
          </View>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <Card key={index} style={styles.metricCard} padding="md">
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                <TrendingUp size={16} color={metric.color} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={[styles.metricChange, { color: metric.color }]}>
                {metric.change}
              </Text>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // TODO: Navigate to respective screens
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.recentActivityCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Package size={16} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New order #ORD-001234</Text>
                <Text style={styles.activityTime}>2 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Users size={16} color={theme.colors.blue[500]} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Customer added: John Doe</Text>
                <Text style={styles.activityTime}>15 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <DollarSign size={16} color={theme.colors.success[500]} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Payment received: $500</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
            </View>
          </View>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[400],
  },
  userName: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[100],
    marginTop: theme.spacing.xs,
  },
  businessInfo: {
    alignItems: 'flex-end',
  },
  businessName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[400],
    fontWeight: theme.fontWeight.medium,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  metricTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  metricValue: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[100],
    marginBottom: theme.spacing.xs,
  },
  metricChange: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  quickActionsCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[100],
    marginBottom: theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  quickActionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickActionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
  },
  recentActivityCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  activityList: {
    gap: theme.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.dark[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[200],
    fontWeight: theme.fontWeight.medium,
  },
  activityTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
}); 