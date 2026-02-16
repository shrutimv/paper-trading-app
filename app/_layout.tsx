import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load: Just to hide the splash screen
  useEffect(() => {
    // Artificial delay to ensure storage is ready
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  // 2. The "Gatekeeper" - Runs on every navigation change
  useEffect(() => {
    if (isLoading) return;

    const checkAuth = async () => {
      try {
        // ALWAYS read fresh data from storage
        const session = await AsyncStorage.getItem('userSession');
        
        const inAuthGroup = segments[0] === 'auth';

        if (!session && !inAuthGroup) {
          // If no session and trying to access app -> Boot to Auth
          router.replace('/auth');
        } else if (session && inAuthGroup) {
          // If has session and trying to access auth -> Send to Home
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.error("Auth Loop Error", e);
      }
    };

    checkAuth();
  }, [segments, isLoading]); // Re-run this whenever the path changes

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0f62fe" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="quiz" options={{ presentation: 'modal', title: 'Quiz' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}