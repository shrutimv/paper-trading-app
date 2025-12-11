// app/(tabs)/_layout.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ICON_SIZE = 20;

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        // hide the native header for all tab screens (prevents the black bar on web)
        screenOptions={({ route }) => ({
          headerShown: false,             // <- IMPORTANT: hides the top header
          tabBarShowLabel: true,
          tabBarActiveTintColor: "#0f62fe",
          tabBarInactiveTintColor: "#6b7280",
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarIcon: ({ focused }) => {
            let iconName = "home";
            const routeName = route.name?.toLowerCase();
            if (routeName?.includes("explore")) iconName = "extension";
            if (routeName?.includes("courses")) iconName = "school";
            if (routeName?.includes("trading")) iconName = "bar-chart";
            return (
              <View style={styles.iconOuter}>
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <MaterialIcons
                    name={iconName as any}
                    size={ICON_SIZE}
                    color={focused ? "#fff" : "#0f62fe"}
                  />
                </View>
              </View>
            );
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Home", href: "/" }} />
        <Tabs.Screen name="explore" options={{ title: "Puzzles" }} />
        
        <Tabs.Screen name="trading" options={{ title: "Trading" }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 76,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#fff",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    borderTopWidth: 0,
  },
  tabLabel: { fontSize: 12, marginTop: 4, marginBottom: 4 },
  iconOuter: { alignItems: "center", justifyContent: "center", width: 46 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapActive: { backgroundColor: "#0f62fe" },
});
