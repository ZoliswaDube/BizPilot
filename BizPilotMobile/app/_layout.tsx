import { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { Slot, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/auth';
import { NotificationService } from '../src/services/notificationService';
import { OfflineManager } from '../src/services/offlineManager';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, user, business } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initialize();
        
        // Initialize notifications if user is authenticated
        if (user && business) {
          await NotificationService.initialize(user.id, business.id);
          await OfflineManager.cacheEssentialData(business.id);
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [user, business]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#020617' }}>
          <StatusBar 
            barStyle="light-content" 
            backgroundColor="#020617" 
            translucent={false}
          />
          <Slot />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 