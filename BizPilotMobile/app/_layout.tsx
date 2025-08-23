import React, { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { Slot, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/auth';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize authentication state
        await initialize();
        // Add small delay for UI smoothness
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [initialize]);

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