import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, ZoomIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context'; 

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GamificationProvider } from '../context/GamificationContext';
import { TradingProvider } from '../context/TradingContext';

export const unstable_settings = { initialRouteName: '(tabs)' };

function CustomSplash({ isDark }: { isDark: boolean }) {
  return (
    <Animated.View 
      exiting={FadeOut.duration(300)} 
      style={[
        styles.splashContainer, 
        { backgroundColor: isDark ? '#0A0F1D' : '#ffffff' }
      ]}
    >
      <Animated.Image 
        entering={ZoomIn.duration(800).springify()}
        source={require('../assets/images/icon.png')} 
        style={styles.splashLogo} 
      />
      <Animated.View entering={FadeIn.delay(300).duration(600)}>
        <Text style={[styles.splashTitle, { color: isDark ? '#ffffff' : '#0F172A' }]}>
          PaperTrade
        </Text>
        <Text style={[styles.splashSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          Learn • Practice • Trade
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
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
    return <CustomSplash isDark={colorScheme === 'dark'} />;
  }

  // Determine background color based on theme so the space behind the nav bar matches
  const bgColor = colorScheme === 'dark' ? '#0A0F1D' : '#fff';

  return (
    <GamificationProvider>
      <TradingProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          
          {/* <-- 2. THE GLOBAL SAFE AREA FIX --> */}
          {/* edges={['bottom']} ensures we only push up from the bottom nav bar */}
          <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['bottom']}>
            
            <Stack>
              <Stack.Screen name="auth" options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="quiz" options={{ presentation: 'modal', title: 'Quiz' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="learn" options={{ headerShown: false }} /> 
            </Stack>
            <StatusBar style="auto" />
            
          </SafeAreaView>
          
        </ThemeProvider>
      </TradingProvider>
    </GamificationProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 24,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});