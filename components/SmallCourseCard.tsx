// components/SmallCourseCard.tsx
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function SmallCourseCard({
  title,
  subtitle,
  progressLabel,
  image,
}: {
  title: string;
  subtitle: string;
  progressLabel: string;
  image: any;
}) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.progress}>{progressLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  image: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },

  textContainer: {
    padding: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f1724",
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },

  progress: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#0f62fe",
  },
});
