// components/CourseCard.tsx
import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

type Props = {
  small?: boolean;
  title?: string;
  subtitle?: string;
  progressLabel?: string;
  image?: ImageSourcePropType; // accepts require(...) or { uri: "..." }
};

export default function CourseCard({
  small,
  title = "Technical Analysis 101",
  subtitle = "Continue Course",
  progressLabel = "25% complete",
  image,
}: Props) {
  // fallback image if none provided (keeps your previous default behavior)
  const imgSource = image ?? require("../assets/images/courses/course.png");

  if (small) {
    return (
      <View style={[styles.smallCard]}>
        <Image source={imgSource} style={styles.smallImage} />
        <View style={styles.smallText}>
          <Text style={styles.smallTitle}>{title}</Text>
          <Text style={styles.smallSubtitle}>{progressLabel}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Image source={imgSource} style={styles.image} />
      <View style={styles.meta}>
        <Text style={styles.metaSubtitle}>{subtitle}</Text>
        <Text style={styles.metaTitle}>{title}</Text>
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
  image: { width: "100%", height: 140, resizeMode: "cover" },
  meta: { padding: 16 },
  metaSubtitle: { color: "#64748B", fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  metaTitle: { fontSize: 18, fontWeight: "800", marginTop: 4, color: "#0F172A" },

  smallCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 0,
    minHeight: 120,
    elevation: 2,
    overflow: "hidden",
  },
  smallImage: {
    width: "100%",
    height: 90,
    resizeMode: "cover",
  },
  smallText: {
    padding: 10,
  },
  smallTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f1724",
  },
  smallSubtitle: {
    color: "#6b7280",
    marginTop: 6,
  },
});
