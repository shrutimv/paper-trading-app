// components/SmallCard.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  progress?: number;
  tag?: string;
};

export default function SmallCard({
  title,
  subtitle,
  progress = 0,
  tag,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {typeof progress === "number" && progress > 0 ? (
        <View style={{ marginTop: 8 }}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>
      ) : null}

      {tag ? (
        <View style={styles.tag}>
          <Text style={{ fontSize: 12 }}>{tag}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    marginRight: 8,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#0f1724" },
  subtitle: { color: "#6b7280", marginTop: 6 },
  progressBar: {
    height: 6,
    backgroundColor: "#e6e9ef",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#2563eb" },
  tag: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
