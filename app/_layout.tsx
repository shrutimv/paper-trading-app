import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GamificationProvider } from '../context/GamificationContext';
import { TradingProvider } from '../context/TradingContext';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const checkAuth = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        const inAuthGroup = segments[0] === 'auth';

        if (!session && !inAuthGroup) {
          router.replace('/auth');
        } else if (session && inAuthGroup) {
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.error("Auth Loop Error", e);
      }
    };
    checkAuth();
  }, [segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0f62fe" />
      </View>
    );
  }

  return (
    <GamificationProvider>
      <TradingProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="auth" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="quiz" options={{ presentation: 'modal', title: 'Quiz' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="learn" options={{ headerShown: false }} /> 
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TradingProvider>
    </GamificationProvider>
  );
}