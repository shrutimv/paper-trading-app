// components/StockCard.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SelectedResult } from "../src/types";
import PriceBadge from "./PriceBadge";

interface Props {
  item: {
    selected?: SelectedResult;
    meta?: any;
  };
  onPress?: () => void;
}

export default function StockCard({ item, onPress }: Props) {
  const name = item.meta?.resolved_name ?? item.selected?.shortname ?? item.selected?.symbol;
  const price = item.meta?.regularMarketPrice ?? null;
  const previous = item.meta?.previousClose ?? null;
  const change = price != null && previous != null ? Number(price) - Number(previous) : null;
  const changePct = price != null && previous != null ? (change! / previous!) * 100 : null;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.symbol}>{item.selected?.symbol ?? "—"}</Text>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>
        <View style={{ marginLeft: 12 }}>
          <PriceBadge price={price} change={change} changePct={changePct} currency={item.meta?.currency ?? "₳"} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  symbol: { fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  name: { fontSize: 12, color: "#666", marginTop: 2 },
});
