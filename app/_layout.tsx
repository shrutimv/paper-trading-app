import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { GamificationProvider } from "../context/GamificationContext";
import { TradingProvider } from "../context/TradingContext";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const router = useRouter();

  const segments = useSegments();

  const {
    loading,
    isGuest,
    isLoggedIn,
  } = useAuth();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isLoggedIn && !isGuest && !inAuthGroup) {
      router.replace("/auth");
    }

    if ((isLoggedIn || isGuest) && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [
    loading,
    isLoggedIn,
    isGuest,
    segments,
  ]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#0f62fe"
        />
      </View>
    );
  }

  const bgColor =
    colorScheme === "dark"
      ? "#000"
      : "#fff";

  return (
    <GamificationProvider>
      <TradingProvider>
        <ThemeProvider
          value={
            colorScheme === "dark"
              ? DarkTheme
              : DefaultTheme
          }
        >
          <SafeAreaView
            style={{
              flex: 1,
              backgroundColor: bgColor,
            }}
            edges={["bottom"]}
          >
            <Stack>
              <Stack.Screen
                name="auth"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />

              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="quiz"
                options={{
                  presentation: "modal",
                  title: "Quiz",
                }}
              />

              <Stack.Screen
                name="modal"
                options={{
                  presentation: "modal",
                  title: "Modal",
                }}
              />

              <Stack.Screen
                name="learn"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>

            <StatusBar style="auto" />
          </SafeAreaView>
        </ThemeProvider>
      </TradingProvider>
    </GamificationProvider>
  );
}