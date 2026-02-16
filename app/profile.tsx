import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (session) {
          setUser(JSON.parse(session));
        }
      } catch (e) {
        console.error("Failed to load user", e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // FIXED: Clears Guest Session before going to Login
  const handleUpgrade = async () => {
    await AsyncStorage.removeItem('userSession'); // Throw away the "Guest Badge"
    router.replace('/auth'); // Now go to login
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userSession');
            router.replace('/auth');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0f62fe" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#111" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#e5e7eb" />
        </View>
        <Text style={styles.name}>
          {user?.isGuest ? "Guest User" : "Trader"}
        </Text>
        <Text style={styles.status}>
          {user?.isGuest ? "Basic Access 🔒" : "Premium Member 🔓"}
        </Text>
      </View>

      <View style={styles.menu}>
        {/* UPDATED BUTTON LOGIC & LABEL */}
        {user?.isGuest && (
          <TouchableOpacity style={styles.menuItem} onPress={handleUpgrade}>
            <View style={styles.menuIconInfo}>
              <Ionicons name="log-in-outline" size={22} color="#0f62fe" />
              <Text style={[styles.menuText, { color: '#0f62fe', fontWeight:'bold' }]}>
                Login/Signup to Access
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20, paddingTop: 60 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  avatarContainer: { marginBottom: 10, backgroundColor: '#fff', borderRadius: 50, padding: 5 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  status: { fontSize: 14, color: '#6b7280', marginTop: 5 },
  menu: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 10 },
  menuIconInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  menuText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#fee2e2', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
});