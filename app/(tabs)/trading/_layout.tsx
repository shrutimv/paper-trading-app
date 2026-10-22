import React from 'react';
import { Stack } from 'expo-router';

export default function TradingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="holdings" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen name="positions" options={{ headerShown: false }} />
      <Stack.Screen name="funds" options={{ headerShown: false }} />
    </Stack>
  );
}