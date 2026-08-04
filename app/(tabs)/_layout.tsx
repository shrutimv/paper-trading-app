import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: true,
        tabBarHideOnKeyboard: true, // Prevents the navbar from jumping up when typing
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '800',
        },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => router.push('/profile')} 
            style={{ marginRight: 15 }}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        ),
        // --- STRICTLY ANCHORED STYLING ---
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          // Standard heights that won't float
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview', // Matching your screenshot header
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="puzzles"
        options={{
          title: 'Puzzles',
          tabBarLabel: 'Puzzles',
          tabBarIcon: ({ color }) => <Ionicons name="extension-puzzle" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="trading"
        options={{
          title: 'Trading',
          tabBarLabel: 'Trading',
          tabBarIcon: ({ color }) => <Ionicons name="trending-up" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color }) => <Ionicons name="school" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}