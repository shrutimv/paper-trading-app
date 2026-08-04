import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useGamification } from '../context/GamificationContext';

export default function AuthScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { proMode, setProMode } = useGamification();
  const styles = getStyles(colors);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        placeholderTextColor={colors.textSecondary}
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        placeholderTextColor={colors.textSecondary}
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

      {/* QUICK PRE-CONFIGURE SETTINGS SEGMENT */}
      <View style={styles.settingsForm}>
        <Text style={styles.settingsTitle}>Pre-Configure App Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Theme</Text>
          <Switch 
            value={isDark} 
            onValueChange={toggleTheme} 
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Pro Mode (Skip Locks)</Text>
          <Switch 
            value={proMode} 
            onValueChange={setProMode} 
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={proMode ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 30, justifyContent: 'center' },
  logoText: { fontSize: 32, fontWeight: '900', color: colors.accent, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: colors.textSecondary, textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: colors.card, padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border },
  mainBtn: { backgroundColor: colors.accent, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggleText: { color: colors.accent, textAlign: 'center', marginTop: 20, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 25 },
  guestBtn: { borderWidth: 1, borderColor: colors.accent, padding: 15, borderRadius: 12, alignItems: 'center' },
  guestBtnText: { color: colors.accent, fontWeight: 'bold' },

  settingsForm: {
    marginTop: 35,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  }
});