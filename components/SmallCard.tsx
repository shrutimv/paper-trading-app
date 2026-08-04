// components/SmallCard.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

type SmallCardProps = {
  title: string;
  subtitle: string;
  progress?: number;
  tag?: string;
};

export default function SmallCard({ title, subtitle, progress, tag }: SmallCardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>

      {progress !== undefined ? (
        <View style={{ marginTop: "auto" }}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
            {Math.round(progress * 100)}% complete
          </Text>
        </View>
      ) : null}

      {tag ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ) : null}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.textSecondary, marginTop: 6, fontSize: 12 },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.accent },
  tag: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.isDark ? "#334155" : "#CBD5E1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: colors.isDark ? "#34D399" : "#15803d", // Emerald text
    fontWeight: "700",
  },
});
