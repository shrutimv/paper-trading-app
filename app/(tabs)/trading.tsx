// app/(tabs)/trading.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TradingScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Trading (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 40 },
  text: { fontSize: 18, fontWeight: "700" }
});
