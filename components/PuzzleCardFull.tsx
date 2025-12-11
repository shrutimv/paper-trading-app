// components/PuzzleCardFull.tsx
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PuzzleCardFull({
  image,
  difficulty,
  title,
  subtitle,
  progress,
  buttonLabel = "Continue",
}: {
  image: any;
  difficulty: string;
  title: string;
  subtitle: string;
  progress: number; // 0 to 1
  buttonLabel?: string;
}) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />

      <View style={{ padding: 12 }}>
        <Text style={styles.difficulty}>{difficulty}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>

        <Text style={styles.progressText}>Progress: {progress * 100}%</Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  difficulty: {
    color: "#0f62fe",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },
  progressContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#0f62fe",
    borderRadius: 6,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },
  button: {
    marginTop: 14,
    backgroundColor: "#0f62fe",
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
});
