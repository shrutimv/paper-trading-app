// components/PuzzleItem.tsx
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  image?: { uri: string } | any;
  level?: string;
  title: string;
  description?: string;
  progress?: number; // 0..1
  buttonLabel?: string;
  onPress?: () => void;
};

export default function PuzzleItem({
  image,
  level = "Beginner",
  title,
  description,
  progress = 0,
  buttonLabel = "Start",
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      {image ? <Image source={image} style={styles.image} /> : <View style={styles.imagePlaceholder} />}

      <View style={styles.body}>
        <Text style={styles.level}>{level}</Text>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}

        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>Progress: {Math.round(progress * 100)}%</Text>
        </View>

        <TouchableOpacity style={styles.cta} activeOpacity={0.8} onPress={onPress}>
          <Text style={styles.ctaText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  image: { width: "100%", height: 160, resizeMode: "cover" },
  imagePlaceholder: { width: "100%", height: 160, backgroundColor: "#f1f5f9" },
  body: { padding: 14 },
  level: { color: "#0f62fe", fontSize: 13, fontWeight: "700", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "800", color: "#0f1724", marginBottom: 8 },
  desc: { color: "#6b7280", marginBottom: 12 },
  progressWrap: { marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: "#eef2f6", borderRadius: 6, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2563eb" },
  progressLabel: { marginTop: 6, color: "#6b7280", fontSize: 12 },
  cta: { backgroundColor: "#0f62fe", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  ctaText: { color: "#fff", fontWeight: "700" },
});
