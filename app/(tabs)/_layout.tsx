import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0f62fe', // Your blue brand color
        headerShown: true, // Show header so we can put the profile icon there
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => router.push('/profile')} 
            style={{ marginRight: 15 }}
          >
            <Ionicons name="person-circle-outline" size={30} color={iconColor} />
          </TouchableOpacity>
        ),
      }}>

      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      {/* 2. PUZZLES TAB (Renamed from puzzles) */}
      <Tabs.Screen
        name="puzzles"
        options={{
          title: 'Puzzles',
          tabBarIcon: ({ color }) => <Ionicons name="extension-puzzle" size={24} color={color} />,
        }}
      />

      {/* 3. TRADING TAB */}
      <Tabs.Screen
        name="trading"
        options={{
          title: 'Trading',
          tabBarIcon: ({ color }) => <Ionicons name="trending-up" size={24} color={color} />,
        }}
      />

      {/* 4. COURSES TAB */}
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }) => <Ionicons name="school" size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}