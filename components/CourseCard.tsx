// components/CourseCard.tsx
import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

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
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  // fallback image if none provided
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

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.card,
    elevation: 3,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: 140, resizeMode: "cover" },
  meta: { padding: 16 },
  metaSubtitle: { color: colors.textSecondary, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  metaTitle: { fontSize: 18, fontWeight: "800", marginTop: 4, color: colors.text },

  smallCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 0,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    overflow: "hidden",
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    color: colors.text,
  },
  smallSubtitle: {
    color: colors.textSecondary,
    marginTop: 6,
  },
});
