import { BASE_URL } from "@/src/config/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";



export default function AuthScreen() {
  const router = useRouter();

  const {
    login,
    continueAsGuest,
  } = useAuth();

  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (isLogin) {
      if (!username || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
    } else {
      if (!username || !email || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
    }

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
            username,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          Alert.alert("Login Failed", data.message);
          return;
        }

        await login({
          id: data.user.id || data.user._id,
          username: data.user.username,
          email: data.user.email,
          balance: data.user.balance,
          isGuest: false,
        });

        router.replace("/(tabs)");
      } else {
        // SIGNUP
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          Alert.alert("Signup Failed", data.message);
          return;
        }

        Alert.alert("Success", "Account created successfully!");

        await login({
          id: data.user.id || data.user._id,
          username: data.user.username,
          email: data.user.email,
          balance: data.user.balance,
          isGuest: false,
        });

        router.replace("/(tabs)");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Unable to connect to the server.");
    }
  };


  const handleGuest = async () => {

    await continueAsGuest();

    router.replace("/(tabs)");

  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>PaperTrade</Text>

      <Text style={styles.subtitle}>
        {isLogin ? "Welcome Back" : "Create Account"}
      </Text>

      {isLogin ? (
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </>
      )}

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#6b7280"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.mainBtn}
        onPress={handleAuth}
      >
        <Text style={styles.btnText}>
          {isLogin ? "Login" : "Sign Up"}
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

      <TouchableOpacity
        style={styles.guestBtn}
        onPress={handleGuest}
      >
        <Text style={styles.guestBtnText}>
          Continue as Guest
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 30,
    justifyContent: "center",
  },

  logoText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f62fe",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 40,
  },

  input: {
    backgroundColor: "#f3f4f6",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },

  mainBtn: {
    backgroundColor: "#0f62fe",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  toggleText: {
    color: "#0f62fe",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 30,
  },

  guestBtn: {
    borderWidth: 1,
    borderColor: "#0f62fe",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  guestBtnText: {
    color: "#0f62fe",
    fontWeight: "bold",
  },
});