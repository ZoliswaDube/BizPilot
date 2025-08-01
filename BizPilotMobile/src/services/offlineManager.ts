import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

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
    // TODO: Implement MCP server integration
    console.log('Syncing create order:', orderData);
    // This would use mcp_supabase_execute_sql to create the order
  }

  private static async syncUpdateOrder(updateData: any) {
    // TODO: Implement MCP server integration
    console.log('Syncing update order:', updateData);
  }

  private static async syncCreateCustomer(customerData: any) {
    // TODO: Implement MCP server integration
    console.log('Syncing create customer:', customerData);
  }

  private static async syncCreateExpense(expenseData: any) {
    // TODO: Implement MCP server integration
    console.log('Syncing create expense:', expenseData);
  }

  // Cache essential data for offline access
  static async cacheEssentialData(businessId: string) {
    try {
      // TODO: Cache products, customers, categories via MCP server
      const cachedData = {
        products: [], // Would fetch via mcp_supabase_execute_sql
        customers: [], // Would fetch via mcp_supabase_execute_sql
        categories: [], // Would fetch via mcp_supabase_execute_sql
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