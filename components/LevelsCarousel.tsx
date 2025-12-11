// components/LevelsCarousel.tsx
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  levels: string[];
  active: string;
  onSelect: (level: string) => void;
};

export default function LevelsCarousel({ levels, active, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cont}
      >
        {levels.map((lvl) => {
          const focused = lvl === active;
          return (
            <TouchableOpacity
              key={lvl}
              style={[styles.pill, focused ? styles.pillActive : null]}
              activeOpacity={0.8}
              onPress={() => onSelect(lvl)}
            >
              <Text style={[styles.label, focused ? styles.labelActive : null]}>{lvl}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12, paddingLeft: 16 },
  cont: { alignItems: "center", paddingRight: 16 },
  pill: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  pillActive: { backgroundColor: "#0f62fe", borderColor: "#0f62fe" },
  label: { color: "#374151", fontWeight: "600", fontSize: 13 },
  labelActive: { color: "#fff" },
});
