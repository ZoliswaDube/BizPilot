# BizPilot Mobile App - Product Requirements Prompt (PRP)
## Mobile-First Business Management Implementation Guide

**Document Version:** 1.0  
**Phase:** Mobile Implementation  
**Timeline:** 8 Weeks  
**Priority:** P1 (Critical for Mobile Market Reach)  
**Framework:** Expo with React Native  
**Database Integration:** Mandatory Supabase MCP Server  

---

## 🎯 Mobile App Overview

**Objective:** Develop a comprehensive mobile application for BizPilot that provides full business management capabilities optimized for mobile devices, while maintaining seamless integration with the web platform.

**CRITICAL REQUIREMENT**: All database operations MUST use the **Supabase MCP Server** for security, auditability, and maintainability, exactly as implemented in the web version.

**Success Criteria:**
- Full feature parity with web application
- Mobile-optimized user experience with touch-first design
- Offline capabilities for core operations
- Real-time synchronization with web platform
- Hardware integration (camera, contacts, GPS)
- Push notifications for business-critical events
- Production-ready app store deployment

---

## 📱 Mobile Architecture & Setup
**Priority:** P0 | **Timeline:** Weeks 1-2 | **Complexity:** Medium

### Implementation Prompt

**Context:** "You are setting up a production-ready Expo React Native application for BizPilot that integrates with the existing Supabase MCP Server infrastructure. The app must support both iOS and Android with optimal performance and user experience."

**Technical Requirements:**
- Expo SDK 50+ with EAS Build
- TypeScript for type safety
- React Navigation v6 for navigation
- Zustand for state management
- AsyncStorage for local data persistence
- Expo Notifications for push notifications
- All database operations via Supabase MCP Server

### Project Setup Implementation

**Step 1: Initialize Expo Project**
```bash
# Initialize new Expo project
npx create-expo-app@latest BizPilotMobile --template typescript

# Navigate to project
cd BizPilotMobile

# Install required dependencies
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npx expo install expo-notifications expo-device expo-constants
npx expo install expo-camera expo-barcode-scanner expo-contacts
npx expo install expo-location expo-document-picker expo-image-picker
npx expo install zustand react-hook-form @hookform/resolvers/zod zod
npx expo install @expo/vector-icons lucide-react-native
npx expo install expo-linear-gradient expo-haptics expo-local-authentication
```

**Step 2: Configure App.json**
```json
{
  "expo": {
    "name": "BizPilot",
    "slug": "bizpilot-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F0F23"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.bizpilot.mobile",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan receipts and barcodes",
        "NSContactsUsageDescription": "This app uses contacts to import customer information",
        "NSLocationWhenInUseUsageDescription": "This app uses location to find nearby customers"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F0F23"
      },
      "package": "com.bizpilot.mobile",
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_CONTACTS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.VIBRATE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow BizPilot to access your camera to scan receipts and barcodes"
        }
      ],
      "expo-contacts",
      "expo-location"
    ]
  }
}
```

**Step 3: Setup Navigation Structure**
```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Package, Users, DollarSign, Settings } from 'lucide-react-native';

import { useAuthStore } from '../store/auth';
import { AuthStack } from './AuthStack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { FinancialsScreen } from '../screens/FinancialsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case 'Dashboard':
              return <Home size={size} color={color} />;
            case 'Orders':
              return <Package size={size} color={color} />;
            case 'Customers':
              return <Users size={size} color={color} />;
            case 'Financials':
              return <DollarSign size={size} color={color} />;
            case 'Settings':
              return <Settings size={size} color={color} />;
            default:
              return <Home size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
        },
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#F9FAFB',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Financials" component={FinancialsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**Step 4: Setup State Management**
```typescript
// src/store/auth.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          // Implement MCP server authentication
          const response = await mcp_supabase_execute_sql({
            query: `
              SELECT u.id, u.email, u.raw_user_meta_data->>'name' as name
              FROM auth.users u
              WHERE u.email = $1
            `,
            params: [email]
          });

          if (response.data && response.data.length > 0) {
            const user = response.data[0];
            const token = 'generated-token'; // Implement proper token generation
            
            await SecureStore.setItemAsync('auth_token', token);
            
            set({ user, token, isLoading: false });
          } else {
            throw new Error('Invalid credentials');
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        set({ user: null, token: null, isLoading: false });
      },

      initialize: async () => {
        try {
          const token = await SecureStore.getItemAsync('auth_token');
          if (token) {
            // Validate token and get user info via MCP server
            // Implementation depends on your auth setup
            set({ token, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }), // Only persist user, not token
    }
  )
);
```

---

## 🛒 Mobile Orders Management
**Priority:** P0 | **Timeline:** Weeks 3-4 | **Complexity:** High

### Implementation Prompt

**Context:** "You are implementing a mobile-optimized order management system with touch-first interactions, barcode scanning capabilities, and offline support. All operations must use the Supabase MCP Server while providing an excellent mobile user experience."

**Mobile-Specific Requirements:**
- Touch-optimized order creation workflow
- Barcode/QR code scanning for product selection
- Swipe gestures for order actions
- Pull-to-refresh for order updates
- Offline order creation with sync queue
- Push notifications for order status changes

### Mobile Orders Hook Implementation

```typescript
// src/hooks/useOrdersMobile.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { mcp_supabase_execute_sql } from '@mcp/supabase';
import { useAuthStore } from '../store/auth';
import { useBusiness } from './useBusiness';
import { useNetworkStatus } from './useNetworkStatus';

interface Order {
  id: string;
  business_id: string;
  customer_id: string | null;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  notes: string | null;
  order_date: string;
  delivery_date: string | null;
  customer_name?: string;
  items: OrderItem[];
  synced?: boolean; // For offline support
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const OFFLINE_ORDERS_KEY = 'offline_orders';

export function useOrdersMobile() {
  const { user } = useAuthStore();
  const { business } = useBusiness();
  const { isConnected } = useNetworkStatus();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch orders with pull-to-refresh support
  const fetchOrders = useCallback(async (showRefreshing = false) => {
    if (!business?.id) return;

    try {
      if (showRefreshing) setRefreshing(true);
      setLoading(!showRefreshing);

      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            o.*,
            c.name as customer_name,
            jsonb_agg(
              jsonb_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price
              ) ORDER BY oi.created_at
            ) FILTER (WHERE oi.id IS NOT NULL) as items
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.business_id = $1
          GROUP BY o.id, c.name
          ORDER BY o.order_date DESC, o.created_at DESC
          LIMIT 100
        `,
        params: [business.id]
      });

      const fetchedOrders = (result.data || []).map((order: any) => ({
        ...order,
        synced: true
      }));

      // Merge with offline orders
      const offlineOrders = await getOfflineOrders();
      const allOrders = [...offlineOrders, ...fetchedOrders];

      setOrders(allOrders);
      setError(null);
      
      // Haptic feedback for successful refresh
      if (showRefreshing) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      
      // Load cached orders if available
      const cachedOrders = await getCachedOrders();
      if (cachedOrders.length > 0) {
        setOrders(cachedOrders);
        setError('Showing cached orders - check connection');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [business?.id]);

  // Get offline orders from AsyncStorage
  const getOfflineOrders = async (): Promise<Order[]> => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_ORDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting offline orders:', error);
      return [];
    }
  };

  // Save offline order
  const saveOfflineOrder = async (order: Order) => {
    try {
      const offlineOrders = await getOfflineOrders();
      const updatedOrders = [...offlineOrders, { ...order, synced: false }];
      await AsyncStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Error saving offline order:', error);
    }
  };

  // Sync offline orders when connection is restored
  const syncOfflineOrders = async () => {
    if (!isConnected) return;

    try {
      const offlineOrders = await getOfflineOrders();
      const unsyncedOrders = offlineOrders.filter(order => !order.synced);

      for (const order of unsyncedOrders) {
        try {
          await createOrderOnServer(order);
          // Remove from offline storage after successful sync
          const remainingOrders = offlineOrders.filter(o => o.id !== order.id);
          await AsyncStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(remainingOrders));
        } catch (error) {
          console.error('Error syncing order:', order.id, error);
        }
      }

      // Refresh orders after sync
      await fetchOrders();
    } catch (error) {
      console.error('Error syncing offline orders:', error);
    }
  };

  // Create order (with offline support)
  const createOrder = async (orderData: {
    customer_id?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
    notes?: string;
  }) => {
    if (!business?.id || !user?.id) throw new Error('Missing required data');

    try {
      // Generate temporary order for offline use
      const tempOrder = generateTempOrder(orderData);

      if (isConnected) {
        // Try to create order online
        const orderId = await createOrderOnServer(orderData);
        await fetchOrders(); // Refresh orders list
        return orderId;
      } else {
        // Save for offline sync
        await saveOfflineOrder(tempOrder);
        setOrders(prev => [tempOrder, ...prev]);
        
        Alert.alert(
          'Order Saved Offline',
          'Your order has been saved and will be synchronized when connection is restored.',
          [{ text: 'OK' }]
        );
        
        return tempOrder.id;
      }
    } catch (err) {
      console.error('Error creating order:', err);
      throw new Error('Failed to create order');
    }
  };

  // Create order on server using MCP
  const createOrderOnServer = async (orderData: any): Promise<string> => {
    // Generate order number
    const orderNumberResult = await mcp_supabase_execute_sql({
      query: `
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\\d+') AS INTEGER)), 0) + 1 as next_number
        FROM orders 
        WHERE business_id = $1 
        AND order_number ~ '^ORD-\\d+$'
      `,
      params: [business.id]
    });

    const orderNumber = `ORD-${String(orderNumberResult.data[0]?.next_number || 1).padStart(6, '0')}`;

    // Calculate totals
    const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = 0.08; // 8% tax - should be configurable
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Create order
    const orderResult = await mcp_supabase_execute_sql({
      query: `
        INSERT INTO orders (
          business_id, customer_id, order_number, 
          subtotal, tax_amount, total_amount, 
          notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      params: [
        business.id,
        orderData.customer_id || null,
        orderNumber,
        subtotal,
        taxAmount,
        totalAmount,
        orderData.notes || null,
        user.id
      ]
    });

    const orderId = orderResult.data[0].id;

    // Create order items
    for (const item of orderData.items) {
      // Get product name
      const productResult = await mcp_supabase_execute_sql({
        query: 'SELECT name FROM products WHERE id = $1',
        params: [item.product_id]
      });

      const productName = productResult.data[0]?.name || 'Unknown Product';
      const totalPrice = item.quantity * item.unit_price;

      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO order_items (
            order_id, product_id, product_name, 
            quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        params: [orderId, item.product_id, productName, item.quantity, item.unit_price, totalPrice]
      });

      // Update inventory if available
      await mcp_supabase_execute_sql({
        query: `
          UPDATE inventory 
          SET current_quantity = current_quantity - $1,
              updated_at = now()
          WHERE product_id = $2 AND business_id = $3 AND current_quantity >= $1
        `,
        params: [item.quantity, item.product_id, business.id]
      });
    }

    return orderId;
  };

  // Generate temporary order for offline use
  const generateTempOrder = (orderData: any): Order => {
    const tempId = `temp_${Date.now()}`;
    const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * 0.08;
    const totalAmount = subtotal + taxAmount;

    return {
      id: tempId,
      business_id: business?.id || '',
      customer_id: orderData.customer_id || null,
      order_number: `OFFLINE-${Date.now()}`,
      status: 'pending',
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_status: 'unpaid',
      notes: orderData.notes || null,
      order_date: new Date().toISOString(),
      delivery_date: null,
      items: orderData.items.map((item: any, index: number) => ({
        id: `temp_item_${index}`,
        product_id: item.product_id,
        product_name: 'Product Name', // Would need to be resolved
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      })),
      synced: false
    };
  };

  // Cache orders for offline access
  const getCachedOrders = async (): Promise<Order[]> => {
    try {
      const cached = await AsyncStorage.getItem('cached_orders');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      return [];
    }
  };

  // Update order status with haptic feedback
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await mcp_supabase_execute_sql({
        query: `
          UPDATE orders 
          SET status = $1, updated_at = now()
          WHERE id = $2 AND business_id = $3
        `,
        params: [status, orderId, business?.id]
      });

      // Haptic feedback for successful update
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error('Failed to update order status');
    }
  };

  // Auto-sync when connection is restored
  useEffect(() => {
    if (isConnected) {
      syncOfflineOrders();
    }
  }, [isConnected]);

  // Initial load and business change
  useEffect(() => {
    if (business?.id) {
      fetchOrders();
    }
  }, [business?.id, fetchOrders]);

  return {
    orders,
    loading,
    error,
    refreshing,
    createOrder,
    updateOrderStatus,
    refreshOrders: () => fetchOrders(true),
    syncOfflineOrders
  };
}
```

---

## 📸 Camera & Barcode Integration
**Priority:** P1 | **Timeline:** Week 5 | **Complexity:** Medium

### Implementation Prompt

**Context:** "You are implementing camera and barcode scanning capabilities for the mobile app to enhance product selection and receipt capture functionality."

### Barcode Scanner Component

```typescript
// src/components/BarcodeScanner.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { X, Flashlight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface BarcodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export function BarcodeScanner({ onScan, onClose, title = "Scan Barcode" }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onScan(data);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        flashMode={flashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.ean13, BarCodeScanner.Constants.BarCodeType.ean8],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <Text style={styles.instruction}>
              Position barcode within the frame
            </Text>
          </View>
          
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, flashOn && styles.controlButtonActive]}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Flashlight size={24} color={flashOn ? "#3B82F6" : "white"} />
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
      
      {scanned && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.rescanText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderColor: '#3B82F6',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  controlButton: {
    padding: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.8)',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  rescanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

---

## 🔔 Push Notifications Setup
**Priority:** P1 | **Timeline:** Week 6 | **Complexity:** Medium

### Implementation Prompt

**Context:** "You are implementing push notifications for business-critical events like order updates, low inventory alerts, and payment confirmations using Expo Notifications."

### Push Notifications Service

```typescript
// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { mcp_supabase_execute_sql } from '@mcp/supabase';

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

      // Store token in database via MCP server
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO user_push_tokens (user_id, business_id, token, platform, is_active)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (user_id, token)
          DO UPDATE SET 
            is_active = true,
            updated_at = now()
        `,
        params: [userId, businessId, token, Platform.OS]
      });

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
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
```

---

## 💾 Offline Support Implementation
**Priority:** P1 | **Timeline:** Week 7 | **Complexity:** High

### Implementation Prompt

**Context:** "You are implementing comprehensive offline support that allows users to continue working without internet connection, with automatic synchronization when connection is restored."

### Offline Manager Service

```typescript
// src/services/offlineManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { mcp_supabase_execute_sql } from '@mcp/supabase';

interface OfflineOperation {
  id: string;
  type: 'CREATE_ORDER' | 'UPDATE_ORDER' | 'CREATE_CUSTOMER' | 'CREATE_EXPENSE';
  data: any;
  timestamp: number;
  businessId: string;
  userId: string;
}

interface SyncResult {
  success: boolean;
  operation: OfflineOperation;
  error?: string;
}

export class OfflineManager {
  private static QUEUE_KEY = 'offline_operations_queue';
  private static CACHED_DATA_KEY = 'cached_data';
  
  static async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp'>) {
    try {
      const queue = await this.getQueue();
      const newOperation: OfflineOperation = {
        ...operation,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      
      queue.push(newOperation);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      
      return newOperation.id;
    } catch (error) {
      console.error('Error queuing offline operation:', error);
      throw error;
    }
  }

  static async getQueue(): Promise<OfflineOperation[]> {
    try {
      const queue = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  static async clearQueue() {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }

  static async syncOperations(): Promise<SyncResult[]> {
    const queue = await this.getQueue();
    const results: SyncResult[] = [];
    
    for (const operation of queue) {
      try {
        await this.executeOperation(operation);
        results.push({ success: true, operation });
      } catch (error) {
        console.error('Error syncing operation:', operation.id, error);
        results.push({ 
          success: false, 
          operation, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    // Remove successfully synced operations
    const failedOperations = results
      .filter(result => !result.success)
      .map(result => result.operation);
    
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(failedOperations));
    
    return results;
  }

  private static async executeOperation(operation: OfflineOperation) {
    switch (operation.type) {
      case 'CREATE_ORDER':
        await this.syncCreateOrder(operation.data);
        break;
      case 'UPDATE_ORDER':
        await this.syncUpdateOrder(operation.data);
        break;
      case 'CREATE_CUSTOMER':
        await this.syncCreateCustomer(operation.data);
        break;
      case 'CREATE_EXPENSE':
        await this.syncCreateExpense(operation.data);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private static async syncCreateOrder(orderData: any) {
    // Generate order number
    const orderNumberResult = await mcp_supabase_execute_sql({
      query: `
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\\d+') AS INTEGER)), 0) + 1 as next_number
        FROM orders 
        WHERE business_id = $1 
        AND order_number ~ '^ORD-\\d+$'
      `,
      params: [orderData.business_id]
    });

    const orderNumber = `ORD-${String(orderNumberResult.data[0]?.next_number || 1).padStart(6, '0')}`;

    // Create order
    const orderResult = await mcp_supabase_execute_sql({
      query: `
        INSERT INTO orders (
          business_id, customer_id, order_number, 
          subtotal, tax_amount, total_amount, 
          notes, created_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      params: [
        orderData.business_id,
        orderData.customer_id,
        orderNumber,
        orderData.subtotal,
        orderData.tax_amount,
        orderData.total_amount,
        orderData.notes,
        orderData.created_by,
        orderData.status || 'pending'
      ]
    });

    const orderId = orderResult.data[0].id;

    // Create order items
    for (const item of orderData.items) {
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO order_items (
            order_id, product_id, product_name, 
            quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        params: [
          orderId, 
          item.product_id, 
          item.product_name, 
          item.quantity, 
          item.unit_price, 
          item.total_price
        ]
      });
    }

    return orderId;
  }

  private static async syncUpdateOrder(updateData: any) {
    await mcp_supabase_execute_sql({
      query: `
        UPDATE orders 
        SET status = $1, updated_at = now()
        WHERE id = $2 AND business_id = $3
      `,
      params: [updateData.status, updateData.orderId, updateData.businessId]
    });
  }

  private static async syncCreateCustomer(customerData: any) {
    await mcp_supabase_execute_sql({
      query: `
        INSERT INTO customers (
          business_id, name, email, phone, address, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
      params: [
        customerData.business_id,
        customerData.name,
        customerData.email,
        customerData.phone,
        customerData.address,
        customerData.notes
      ]
    });
  }

  private static async syncCreateExpense(expenseData: any) {
    await mcp_supabase_execute_sql({
      query: `
        INSERT INTO expenses (
          business_id, category_id, amount, description,
          expense_date, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
      params: [
        expenseData.business_id,
        expenseData.category_id,
        expenseData.amount,
        expenseData.description,
        expenseData.expense_date,
        expenseData.created_by
      ]
    });
  }

  // Cache essential data for offline access
  static async cacheEssentialData(businessId: string) {
    try {
      // Cache products
      const products = await mcp_supabase_execute_sql({
        query: 'SELECT * FROM products WHERE business_id = $1 AND is_active = true',
        params: [businessId]
      });

      // Cache customers
      const customers = await mcp_supabase_execute_sql({
        query: 'SELECT * FROM customers WHERE business_id = $1 AND is_active = true',
        params: [businessId]
      });

      // Cache expense categories
      const expenseCategories = await mcp_supabase_execute_sql({
        query: 'SELECT * FROM expense_categories WHERE business_id = $1 AND is_active = true',
        params: [businessId]
      });

      const cachedData = {
        products: products.data || [],
        customers: customers.data || [],
        expenseCategories: expenseCategories.data || [],
        lastCached: Date.now()
      };

      await AsyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Error caching essential data:', error);
    }
  }

  static async getCachedData() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHED_DATA_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Network status monitoring
  static async startNetworkMonitoring(onConnectionChange: (isConnected: boolean) => void) {
    const unsubscribe = NetInfo.addEventListener(state => {
      onConnectionChange(state.isConnected ?? false);
    });

    return unsubscribe;
  }
}
```

---

## 🔧 Implementation Standards

### **Mobile-Specific Requirements:**

1. **Performance Optimization:**
   ```typescript
   // Use React.memo for expensive components
   export const OrderCard = React.memo(({ order, onUpdate }) => {
     // Component implementation
   });
   
   // Implement lazy loading for large lists
   import { FlashList } from "@shopify/flash-list";
   
   // Use proper image optimization
   import { Image } from 'expo-image';
   ```

2. **Accessibility:**
   ```typescript
   // Always include accessibility props
   <TouchableOpacity
     accessible={true}
     accessibilityLabel="Create new order"
     accessibilityRole="button"
     onPress={createOrder}
   >
     <Text>Create Order</Text>
   </TouchableOpacity>
   ```

3. **Error Handling:**
   ```typescript
   // Mobile-specific error handling with user-friendly messages
   const handleError = (error: Error) => {
     console.error('Mobile app error:', error);
     Alert.alert(
       'Error',
       'Something went wrong. Please try again.',
       [{ text: 'OK' }]
     );
   };
   ```

### **Quality Checklist:**

- ✅ All database operations via Supabase MCP Server
- ✅ Offline support with sync queue implementation
- ✅ Push notifications for critical events
- ✅ Camera integration for barcode scanning
- ✅ Touch-optimized UI with proper gestures
- ✅ Accessibility compliance (screen readers, etc.)
- ✅ Performance optimization (lazy loading, memoization)
- ✅ Error handling with user-friendly messages
- ✅ Proper state management with Zustand
- ✅ Secure authentication with biometric support

---

## 🎯 Success Metrics

### **Technical Metrics:**
- 100% MCP server usage for database operations
- <500ms app startup time
- 99.9% crash-free sessions
- Offline functionality for all critical operations
- Push notification delivery rate >95%

### **User Experience Metrics:**
- App store rating >4.5 stars
- Daily active user retention >80%
- Feature adoption rate >70%
- User task completion rate >90%

### **Business Metrics:**
- Mobile order creation rate >60% of total orders
- Customer satisfaction score >4.5/5
- Mobile-specific feature usage analytics
- Cross-platform data consistency 100%

This PRP ensures the mobile app provides a complete, native mobile experience while maintaining full compatibility with the web platform and adhering to all security and data management standards established in Phase 1. 