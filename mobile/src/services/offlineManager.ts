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
      console.error('Error queueing offline operation:', error);
      throw error;
    }
  }
  
  static async getQueue(): Promise<OfflineOperation[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }
  
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }
  
  static async syncOperations(): Promise<SyncResult[]> {
    try {
      const queue = await this.getQueue();
      const results: SyncResult[] = [];
      
      for (const operation of queue) {
        try {
          // Here you would implement the actual sync logic
          // For now, we'll simulate a successful sync
          await new Promise(resolve => setTimeout(resolve, 100));
          
          results.push({
            success: true,
            operation,
          });
        } catch (error) {
          results.push({
            success: false,
            operation,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      // Clear queue after successful sync
      const successfulOps = results.filter(r => r.success);
      if (successfulOps.length === queue.length) {
        await this.clearQueue();
      }
      
      return results;
    } catch (error) {
      console.error('Error syncing operations:', error);
      return [];
    }
  }
  
  // Cache data for offline access
  static async cacheData(key: string, data: any): Promise<void> {
    try {
      const cachedData = await this.getAllCachedData();
      cachedData[key] = {
        data,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }
  
  // Get cached data
  static async getCachedData(key: string): Promise<any | null> {
    try {
      const cachedData = await this.getAllCachedData();
      const item = cachedData[key];
      
      if (!item) return null;
      
      // Check if data is stale (older than 1 hour)
      const isStale = Date.now() - item.timestamp > 60 * 60 * 1000;
      if (isStale) {
        delete cachedData[key];
        await AsyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }
  
  // Cache essential data for a business
  static async cacheEssentialData(businessId: string): Promise<void> {
    try {
      // This would typically cache essential business data
      // For now, we'll just log the operation
      console.log('Caching essential data for business:', businessId);
    } catch (error) {
      console.error('Error caching essential data:', error);
    }
  }
  
  private static async getAllCachedData(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(this.CACHED_DATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting all cached data:', error);
      return {};
    }
  }
  
  // Check network connectivity
  static async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true && netInfo.isInternetReachable === true;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }
  
  // Initialize offline manager
  static async initialize(): Promise<void> {
    try {
      // Subscribe to network state changes
      NetInfo.addEventListener(state => {
        if (state.isConnected && state.isInternetReachable) {
          // Auto-sync when coming back online
          this.syncOperations();
        }
      });
      
      console.log('OfflineManager initialized');
    } catch (error) {
      console.error('Error initializing OfflineManager:', error);
    }
  }
} 