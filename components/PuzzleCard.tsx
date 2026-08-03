// components/PuzzleCard.tsx
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PuzzleCard() {
  return (
    <View style={styles.card}>
      <Image 
        source={require("../assets/images/puzzelCard/puzzles.png")}
        style={styles.image} 
      />
      <View style={styles.meta}>
        <Text style={styles.title}>Intro to Candlesticks</Text>
        <Text style={styles.desc}>Learn to identify basic patterns and what they signal about market sentiment.</Text>
        <View style={styles.actions}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Beginner</Text>
          </View>
          <TouchableOpacity style={styles.cta}>
            <Text style={styles.ctaText}>Start Puzzle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    borderRadius: 20, 
    overflow: "hidden", 
    backgroundColor: "#ffffff", 
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  image: { 
    width: "100%", 
    height: 160,
    resizeMode: "cover",
  },
  meta: { 
    padding: 18, 
  },
  title: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#0F172A",
  },
  desc: { 
    color: "#64748B", 
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6, 
    marginBottom: 16,
  },
  actions: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
  },
  badge: { 
    borderRadius: 8, 
    backgroundColor: "#EFF6FF", 
    paddingHorizontal: 12, 
    paddingVertical: 6,
  },
  badgeText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 12,
  },
  cta: { 
    backgroundColor: "#0f62fe", 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 10,
  },
  ctaText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
});

