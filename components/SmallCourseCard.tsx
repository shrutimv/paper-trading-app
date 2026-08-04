// components/SmallCourseCard.tsx
import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

type SmallCourseCardProps = {
  title: string;
  subtitle: string;
  progressLabel: string;
  image: ImageSourcePropType;
};

export default function SmallCourseCard({
  title,
  subtitle,
  progressLabel,
  image,
}: SmallCourseCardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.progress}>{progressLabel}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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
    color: colors.text,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },

  progress: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent, // Dynamic accent color (blue / glowing blue)
  },
});
