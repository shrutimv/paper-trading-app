// components/SmallCard.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

type SmallCardProps = {
  title: string;
  subtitle: string;
  progress?: number;
  tag?: string;
  onPress?: () => void;
};

export default function SmallCard({ title, subtitle, progress, tag, onPress }: SmallCardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const content = (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>

      {progress !== undefined ? (
        <View style={{ marginTop: "auto", paddingTop: 8 }}>
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

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 15, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.textSecondary, marginTop: 4, fontSize: 12, lineHeight: 16 },
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
    backgroundColor: colors.isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7",
    borderWidth: 1,
    borderColor: colors.isDark ? "rgba(16, 185, 129, 0.3)" : "#bbf7d0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: colors.isDark ? "#34D399" : "#15803d",
    fontWeight: "800",
  },
});
