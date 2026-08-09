import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useGamification } from "../context/GamificationContext";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../src/config/api";

export default function AuthScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { proMode, setProMode } = useGamification();
  const { login, continueAsGuest } = useAuth();
  const styles = getStyles(colors);

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (isLogin) {
      if (!username.trim() || !password) {
        Alert.alert("Error", "Please fill in both username and password.");
        return;
      }
    } else {
      if (!username.trim() || !email.trim() || !password) {
        Alert.alert("Error", "Please fill in all fields (username, email, password).");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        // LOGIN
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          Alert.alert("Login Failed", data.message || "Invalid credentials");
          setLoading(false);
          return;
        }

        const userData = {
          ...data.user,
          isGuest: false,
        };

        await AsyncStorage.setItem("userSession", JSON.stringify(userData));
        if (login) await login(userData);

        router.replace("/(tabs)");
      } else {
        // SIGNUP
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          Alert.alert("Signup Failed", data.message || "Unable to register");
          setLoading(false);
          return;
        }

        const userData = {
          ...data.user,
          isGuest: false,
        };

        Alert.alert("Success", "Account created successfully!");
        await AsyncStorage.setItem("userSession", JSON.stringify(userData));
        if (login) await login(userData);

        router.replace("/(tabs)");
      }
    } catch (err) {
      console.log("Auth error:", err);
      Alert.alert(
        "Connection Error",
        "Unable to connect to the backend server (Port 5000). Please ensure 'node app.js' is running in your backend terminal."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    const guestUser = { username: "Guest User", balance: 100000, isGuest: true };
    await AsyncStorage.setItem("userSession", JSON.stringify(guestUser));
    if (continueAsGuest) await continueAsGuest();
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logoText}>PaperTrade</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        )}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.mainBtn, loading && { opacity: 0.7 }]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setIsLogin(!isLogin);
            setUsername("");
            setEmail("");
            setPassword("");
          }}
        >
          <Text style={styles.toggleText}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"}
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
              trackColor={{ false: "#767577", true: colors.accent }}
              thumbColor={isDark ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Pro Mode (Skip Locks)</Text>
            <Switch
              value={proMode}
              onValueChange={setProMode}
              trackColor={{ false: "#767577", true: colors.accent }}
              thumbColor={proMode ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 30,
      paddingVertical: 50,
      justifyContent: "center",
    },
    logoText: {
      fontSize: 32,
      fontWeight: "900",
      color: colors.accent,
      textAlign: "center",
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 30,
    },
    input: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 12,
      marginBottom: 15,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordInput: {
      flex: 1,
      paddingVertical: 15,
      fontSize: 16,
      color: colors.text,
    },
    mainBtn: {
      backgroundColor: colors.accent,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 10,
    },
    btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    toggleText: {
      color: colors.accent,
      textAlign: "center",
      marginTop: 20,
      fontWeight: "600",
    },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 25 },
    guestBtn: {
      borderWidth: 1,
      borderColor: colors.accent,
      padding: 15,
      borderRadius: 12,
      alignItems: "center",
    },
    guestBtnText: { color: colors.accent, fontWeight: "bold" },
    settingsForm: {
      marginTop: 30,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingsTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    settingLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
  });