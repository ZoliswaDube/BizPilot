import React, { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { Slot, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simple initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

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