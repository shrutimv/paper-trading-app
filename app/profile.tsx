// app/(tabs)/profile.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();

  const user = {
    name: "Ananya Sharma",
    subtitle: "Aspiring Trader",
    avatar: require("../assets/images/ProfilePage/image 1.png"),
    stats: [
      { key: "earnings", label: "Total Earnings", value: "₹ 1,50,000" },
      { key: "puzzles", label: "Puzzles Solved", value: "24" },
      { key: "courses", label: "Courses Completed", value: "8" },
      { key: "streak", label: "Current Streak", value: "12 days" },
    ],
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        
        

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image source={user.avatar} style={styles.avatar} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.subtitle}>{user.subtitle}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {user.stats.map((s) => (
            <View key={s.key} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu (Edit + Settings disabled) */}
        <View style={styles.menu}>

            <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/edit-profile')}>
              <View style={styles.menuIconWrap}>
                <MaterialIcons name="person-outline" size={20} color="#111827" />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9aa3b2" />
            </TouchableOpacity>

          <View style={[styles.menuRow, { opacity: 0.6 }]}>
            <View style={styles.menuIconWrap}>
              <MaterialIcons name="settings" size={20} color="#111827" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9aa3b2" />
          </View>

          {/* Logout is clickable */}
          <TouchableOpacity style={styles.menuRow} onPress={() => console.log("logout")}>
            <View style={[styles.menuIconWrap, { backgroundColor: "#feecec" }]}>
              <MaterialIcons name="logout" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.menuText, { color: "#ef4444" }]}>Logout</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9aa3b2" />
          </TouchableOpacity>

        </View>

        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { paddingBottom: 36 },

  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBack: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f1724" },

  avatarWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "800", color: "#0f1724" },
  subtitle: { color: "#6b7280", marginTop: 4 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 16, fontWeight: "800", color: "#0f1724" },
  statLabel: { color: "#6b7280", marginTop: 6 },

  menu: { marginTop: 12, paddingHorizontal: 16 },
  menuRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f2f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: { fontSize: 16, flex: 1, color: "#0f1724" },
});
