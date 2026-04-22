import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity, useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Standard safe colors
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';
  const activeColor = '#0f62fe'; // Your blue brand color
  const inactiveColor = colorScheme === 'dark' ? '#9BA1A6' : '#687076';
  
  // The "Lightly dark / off-white" you requested
  const navBg = colorScheme === 'dark' ? '#11181C' : '#F9FAFB'; 

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: true,
        tabBarHideOnKeyboard: true, // Prevents the navbar from jumping up when typing
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => router.push('/profile')} 
            style={{ marginRight: 15 }}
          >
            <Ionicons name="person-circle-outline" size={30} color={iconColor} />
          </TouchableOpacity>
        ),
        // --- STRICTLY ANCHORED STYLING ---
        tabBarStyle: {
          backgroundColor: navBg,
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#2A2D32' : '#E5E7EB',
          // Standard heights that won't float
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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