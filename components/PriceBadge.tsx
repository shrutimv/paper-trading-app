// components/PriceBadge.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  price?: number | null;
  change?: number | null; // absolute change
  changePct?: number | null; // in percent, e.g. 0.43
  currency?: string;
}

export default function PriceBadge({ price, change, changePct, currency = "₳" }: Props) {
  const isUp = (change ?? 0) > 0;
  const color = isUp ? styles.up : styles.down;

  return (
    <View style={styles.row}>
      <Text style={styles.priceText}>{price == null ? "—" : `${currency}${Number(price).toLocaleString()}`}</Text>
      <View style={[styles.deltaBox, color]}>
        <Text style={styles.deltaText}>
          {change == null ? "—" : `${(change > 0 ? "+" : "")}${Number(change).toFixed(2)} (${changePct != null ? (changePct>0?"+":"") + Number(changePct).toFixed(2) + "%" : "—"})`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceText: { fontSize: 18, fontWeight: "700" },
  deltaBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  deltaText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  up: { backgroundColor: "#2ecc71" },
  down: { backgroundColor: "#e74c3c" },
});
