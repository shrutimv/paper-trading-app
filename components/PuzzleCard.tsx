// components/PuzzleCard.tsx
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PuzzleCard() {
  return (
    <View style={styles.card}>
      <Image 
      source={require("../assets/images/puzzelCard/puzzles.png")}
      style={styles.image} />
      <View style={styles.meta}>
        <Text style={styles.title}>Intro to Candlesticks</Text>
        <Text style={styles.desc}>Learn to identify basic patterns and what they signal about market sentiment.</Text>
        <View style={styles.actions}>
          <View style={styles.badge}><Text style={{ color: "#3b82f6" }}>Beginner</Text></View>
          <TouchableOpacity style={styles.cta}><Text style={{ color: "#fff" }}>Start Puzzle</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", elevation: 3 },
  image: { width: "100%", height: 160 },
  meta: { padding: 14 },
  title: { fontSize: 18, fontWeight: "800", color: "#0f1724" },
  desc: { color: "#6b7280", marginTop: 6, marginBottom: 10 },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { borderRadius: 12, backgroundColor: "#eef2ff", paddingHorizontal: 10, paddingVertical: 6 },
  cta: { backgroundColor: "#0f62fe", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
});
