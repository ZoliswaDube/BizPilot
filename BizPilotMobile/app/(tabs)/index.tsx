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
import * as Haptics from 'expo-haptics';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log(`Quick action: ${action}`);
    // TODO: Navigate to respective screens
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#a78bfa"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.businessName}>BizPilot Demo Business</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#22c55e" />
            <Text style={styles.statValue}>$12,450</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          
          <View style={styles.statCard}>
            <Package size={24} color="#3b82f6" />
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          
          <View style={styles.statCard}>
            <Users size={24} color="#a78bfa" />
            <Text style={styles.statValue}>89</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          
          <View style={styles.statCard}>
            <DollarSign size={24} color="#f59e0b" />
            <Text style={styles.statValue}>$2,340</Text>
            <Text style={styles.statLabel}>Profit</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('new-order')}
            >
              <Plus size={24} color="#ffffff" />
              <Text style={styles.actionText}>New Order</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('add-customer')}
            >
              <Users size={24} color="#ffffff" />
              <Text style={styles.actionText}>Add Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('add-product')}
            >
              <Package size={24} color="#ffffff" />
              <Text style={styles.actionText}>Add Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('view-reports')}
            >
              <TrendingUp size={24} color="#ffffff" />
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>New order #1234 from John Doe</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
          
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>Product "Coffee Beans" low stock</Text>
            <Text style={styles.activityTime}>4 hours ago</Text>
          </View>
          
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>Customer payment received: $250</Text>
            <Text style={styles.activityTime}>1 day ago</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#a78bfa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activityText: {
    color: '#e5e7eb',
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    color: '#9ca3af',
    fontSize: 12,
  },
}); 