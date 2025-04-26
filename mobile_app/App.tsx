import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';

import { AuthProvider } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { PredictionsProvider } from './src/contexts/PredictionsContext';
import Navigation from './src/navigation';
import theme from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={theme}>
        <NavigationContainer>
          <AuthProvider>
            <SubscriptionProvider>
              <PredictionsProvider>
                <StatusBar style="auto" />
                <Navigation />
              </PredictionsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </NavigationContainer>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}