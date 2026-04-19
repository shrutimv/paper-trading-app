import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (isLogin) {
      // LOGIN LOGIC
      const storedUser = await AsyncStorage.getItem(email);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.password === password) {
          await AsyncStorage.setItem('userSession', JSON.stringify({ email, isGuest: false }));
          router.replace('/(tabs)');
        } else {
          Alert.alert("Error", "Invalid password");
        }
      } else {
        Alert.alert("Error", "User not found. Please sign up.");
      }
    } else {
      // SIGNUP LOGIC
      const userExists = await AsyncStorage.getItem(email);
      if (userExists) {
        Alert.alert("Error", "Email already registered");
      } else {
        await AsyncStorage.setItem(email, JSON.stringify({ email, password }));
        Alert.alert("Success", "Account created! Please login.");
        setIsLogin(true);
      }
    }
  };

  const handleGuest = async () => {
    await AsyncStorage.setItem('userSession', JSON.stringify({ isGuest: true }));
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>PaperTrade</Text>
      <Text style={styles.subtitle}>{isLogin ? "Welcome Back" : "Create Account"}</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity style={styles.mainBtn} onPress={handleAuth}>
        <Text style={styles.btnText}>{isLogin ? "Login" : "Sign Up"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
        <Text style={styles.guestBtnText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30, justifyContent: 'center' },
  logoText: { fontSize: 32, fontWeight: '900', color: '#0f62fe', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  mainBtn: { backgroundColor: '#0f62fe', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggleText: { color: '#0f62fe', textAlign: 'center', marginTop: 20, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 30 },
  guestBtn: { borderWidth: 1, borderColor: '#0f62fe', padding: 15, borderRadius: 12, alignItems: 'center' },
  guestBtnText: { color: '#0f62fe', fontWeight: 'bold' }
});