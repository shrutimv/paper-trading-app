import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { watchlist } from "../src/data/data";

type Props = {
  showSearch?: boolean;
  title?: string;
  limit?: number; // optional: show only first n stocks
};

export default function Watchlist({
  showSearch = true,
  title = "Watchlist",
  limit,
}: Props) {
  const [search, setSearch] = React.useState("");

  const filtered = watchlist
    .filter((stock) => stock.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, limit ?? watchlist.length);

  return (
    <View>
      {/* Optional Search */}
      {showSearch && (
        <TextInput
          placeholder="Search stocks..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      )}

      {/* Title */}
      <View style={styles.rowBetween}>
        <Text style={styles.section}>{title}</Text>
      </View>

      {/* Stocks */}
      {filtered.map((stock) => {
        const isUp = !stock.isDown;

        return (
          <View key={stock.name} style={styles.stockRow}>
            <View>
              <Text style={styles.stockName}>{stock.name}</Text>
              <Text style={styles.stockSub}>NSE • Equity</Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.stockPrice}>₹{stock.price.toFixed(2)}</Text>
              <Text
                style={{
                  color: isUp ? "#16a34a" : "#ef4444",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {stock.percent}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 14,
  },

  section: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111827",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  stockRow: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  stockName: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111827",
  },

  stockSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  stockPrice: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111827",
  },
});
