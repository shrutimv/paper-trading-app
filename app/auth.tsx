import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // --- STEP 1: SEND EMAIL VERIFICATION CODE (ANTI-BOT) ---
  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address first.");
      return;
    }

    setSendingOtp(true);
    setDevOtpHint(null);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Verification Error", data.message || "Failed to send verification code.");
        return;
      }

      setOtpSent(true);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }

      Alert.alert(
        "Code Sent! 📬",
        `A 6-digit code has been dispatched to ${email.trim()}. Please enter it below to verify your account.`
      );
    } catch (err) {
      console.error("sendOtp error:", err);
      Alert.alert(
        "Connection Error",
        "Could not connect to backend server. Make sure port 5000 is running."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // --- STEP 2: AUTHENTICATE / REGISTER ---
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
      if (!otp.trim()) {
        Alert.alert("Verification Required", "Please enter the 6-digit verification code sent to your email.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        // LOGIN
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        // SIGNUP WITH OTP
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
            otp: otp.trim(),
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

        Alert.alert("Welcome aboard! 🎉", `Account created! Your unique Friend Code is: ${data.user.friendCode}`);
        await AsyncStorage.setItem("userSession", JSON.stringify(userData));
        if (login) await login(userData);

        router.replace("/(tabs)");
      }
    } catch (err) {
      console.log("Auth error:", err);
      Alert.alert(
        "Connection Error",
        "Unable to connect to the backend server. Please verify backend terminal status."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    const guestUser = { username: "Guest User", balance: 100000, isGuest: true, friendCode: "GUEST-TRADER" };
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
          {isLogin ? "Welcome Back, Trader" : "Create Verified Account"}
        </Text>

        {/* USERNAME */}
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Unique Username (e.g. trader_raj)"
          placeholderTextColor={colors.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* EMAIL + SEND OTP ROW (SIGNUP ONLY) */}
        {!isLogin && (
          <View style={{ marginBottom: 15 }}>
            <View style={styles.emailRow}>
              <TextInput
                style={[
                  styles.emailInput,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="Email Address"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setOtpSent(false);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[
                  styles.otpSendBtn,
                  { backgroundColor: otpSent ? '#10b981' : colors.accent },
                  sendingOtp && { opacity: 0.7 },
                ]}
                onPress={handleSendOtp}
                disabled={sendingOtp}
                activeOpacity={0.8}
              >
                {sendingOtp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.otpSendBtnText}>{otpSent ? "Resend" : "Send OTP"}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* OTP INPUT BOX */}
            {otpSent && (
              <View style={styles.otpContainer}>
                <View style={[styles.otpBox, { backgroundColor: colors.card, borderColor: '#10b981' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                  <TextInput
                    style={[styles.otpTextInput, { color: colors.text }]}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={colors.textSecondary}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                {devOtpHint && (
                  <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '800', marginTop: 4 }}>
                    ⚡ Dev Mode OTP: {devOtpHint}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* PASSWORD */}
        <View
          style={[
            styles.passwordContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.passwordInput, { color: colors.text }]}
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

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.mainBtn, { backgroundColor: colors.accent }, loading && { opacity: 0.7 }]}
          onPress={handleAuth}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {loading ? "Processing..." : isLogin ? "Login to Terminal" : "Verify & Register"}
          </Text>
        </TouchableOpacity>

        {/* TOGGLE LOGIN / SIGNUP */}
        <TouchableOpacity
          onPress={() => {
            setIsLogin(!isLogin);
            setUsername("");
            setEmail("");
            setPassword("");
            setOtp("");
            setOtpSent(false);
            setDevOtpHint(null);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: colors.accent }]}>
            {isLogin ? "Don't have an account? Sign Up with OTP" : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* GUEST ACCESS */}
        <TouchableOpacity
          style={[styles.guestBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGuest}
          activeOpacity={0.8}
        >
          <Ionicons name="flash-outline" size={18} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.guestBtnText, { color: colors.text }]}>Continue as Guest Trader</Text>
        </TouchableOpacity>

        {/* QUICK SETTINGS */}
        <View style={[styles.settingsForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>Quick Preferences</Text>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>Dark Theme</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: colors.accent }}
              thumbColor={isDark ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>Pro Mode (Skip Locks)</Text>
            <Switch
              value={proMode}
              onValueChange={setProMode}
              trackColor={{ false: "#767577", true: colors.accent }}
              thumbColor={proMode ? "#fff" : "#f4f3f4"}
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
      paddingHorizontal: 26,
      paddingVertical: 50,
      justifyContent: "center",
    },
    logoText: {
      fontSize: 32,
      fontWeight: "900",
      color: colors.accent,
      textAlign: "center",
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 26,
      fontWeight: "600",
    },
    input: {
      padding: 14,
      borderRadius: 14,
      marginBottom: 14,
      fontSize: 15,
      borderWidth: 1,
    },
    emailRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    emailInput: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      fontSize: 15,
      borderWidth: 1,
    },
    otpSendBtn: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    otpSendBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "800",
    },
    otpContainer: {
      marginTop: 10,
    },
    otpBox: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      gap: 10,
    },
    otpTextInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 2,
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      paddingHorizontal: 14,
      marginBottom: 16,
      borderWidth: 1,
    },
    passwordInput: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 15,
    },
    mainBtn: {
      padding: 16,
      borderRadius: 14,
      alignItems: "center",
      marginBottom: 16,
      elevation: 2,
    },
    btnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    toggleText: {
      textAlign: "center",
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 20,
    },
    divider: {
      height: 1,
      marginVertical: 16,
    },
    guestBtn: {
      flexDirection: "row",
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      borderWidth: 1,
    },
    guestBtnText: {
      fontSize: 14,
      fontWeight: "700",
    },
    settingsForm: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
    },
    settingsTitle: {
      fontSize: 13,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: "600",
    },
  });