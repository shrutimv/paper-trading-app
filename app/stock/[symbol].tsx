// app/stock/[symbol].tsx
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import PriceBadge from "../../components/PriceBadge";
import SmallChart, { RangeKey } from "../../components/SmallChart";
import { fetchStockBySymbol } from "../../src/api";
import type { HistoryPoint, StockResponse } from "../../src/types";

const RANGE_KEYS: RangeKey[] = ["1D", "5D", "1M", "3M", "6M", "1Y", "2Y", "5Y", "Max"];

const RANGE_MAP: Record<RangeKey, { period: string; interval: string }> = {
  "1D": { period: "5d", interval: "15m" },
  "5D": { period: "5d", interval: "30m" },
  "1M": { period: "1mo", interval: "1d" },
  "3M": { period: "3mo", interval: "1d" },
  "6M": { period: "6mo", interval: "1d" },
  "1Y": { period: "1y", interval: "1d" },
  "2Y": { period: "2y", interval: "1d" },
  "5Y": { period: "5y", interval: "1d" },
  "Max": { period: "max", interval: "1wk" },
};

export default function StockDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const symbol = (params?.symbol as string) || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<StockResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState<string>("1");
  const [range, setRange] = useState<RangeKey>("1M");

  const chartContainerRef = useRef<View | null>(null);

  useEffect(() => {
    if (!symbol) {
      setError("No symbol provided");
      setLoading(false);
      return;
    }
    fetchForRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, range]);

  async function fetchForRange(r: RangeKey) {
    try {
      setLoading(true);
      setError(null);
      const opts = RANGE_MAP[r];
      const res = await fetchStockBySymbol(symbol, {
        period: opts.period,
        interval: opts.interval,
        max_points: 1200,
        compact: false,
      });
      setData(res);
    } catch (err: any) {
      console.error("fetchStockBySymbol error:", err?.response ?? err);
      const msg = err?.response?.data?.detail?.error || err?.message || "Failed to load stock details.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  const history = data?.history ?? [];
  const historyNewestFirst = [...history].reverse().slice(0, 200); // for FlatList data

  const onBuy = () => {
    if (!data) return;
    const price = data.meta?.regularMarketPrice ?? 0;
    const units = Number(qty || "0");
    if (!units || units <= 0) {
      Alert.alert("Invalid quantity", "Enter a positive number of units.");
      return;
    }
    const cost = price * units;
    Alert.alert("Confirm Buy", `Buy ${units} units of ${data.meta.symbol} for ${data.meta.currency}${cost.toFixed(2)}?`);
  };

  function renderHistory({ item }: { item: HistoryPoint }) {
    return (
      <View style={styles.historyRow}>
        <Text style={styles.historyDate}>{item.date}</Text>
        <Text style={styles.historyClose}>{item.close == null ? "—" : Number(item.close).toFixed(2)}</Text>
      </View>
    );
  }

  // Header content that sits above the history list
  const ListHeader = () => {
    if (loading) {
      return <ActivityIndicator size="large" style={{ marginTop: 24 }} />;
    }
    if (error) {
      return (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      );
    }
    if (!data) {
      return null;
    }

    const historyForChart = history; // oldest -> newest expected by chart

    return (
      <View style={styles.topContainer}>
        <View style={styles.headerRow}>
          <Button title="Back" onPress={() => router.back()} />
          <Text style={styles.headerSymbol}>{symbol}</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title} numberOfLines={2}>
            {data.meta.resolved_name ?? data.selected.shortname ?? data.selected.symbol}
          </Text>
          <Text style={styles.subtitle}>{data.meta.symbol}</Text>

          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <PriceBadge
                price={data.meta.regularMarketPrice}
                change={
                  data.meta.regularMarketPrice != null && data.meta.previousClose != null
                    ? Number(data.meta.regularMarketPrice) - Number(data.meta.previousClose)
                    : undefined
                }
                changePct={
                  data.meta.regularMarketPrice != null && data.meta.previousClose != null
                    ? ((Number(data.meta.regularMarketPrice) - Number(data.meta.previousClose)) / Number(data.meta.previousClose)) * 100
                    : undefined
                }
                currency={data.meta.currency ?? ""}
              />
              <Text style={styles.metaSmall}>
                Market Cap: {data.meta.marketCap ? String(data.meta.marketCap) : "—"} • Sector: {data.meta.sector ?? "—"}
              </Text>
            </View>
          </View>

          {/* Range buttons */}
          <View style={styles.rangeRow}>
            {RANGE_KEYS.map((r) => (
              <TouchableOpacity key={r} onPress={() => setRange(r)} style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}>
                <Text style={range === r ? styles.rangeTextActive : styles.rangeText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart container (Victory-based SmallChart handles tooltips internally) */}
          <View ref={(c) => { chartContainerRef.current = c; }} collapsable={false}>
            <SmallChart history={historyForChart} range={range} />
          </View>

          {/* New Trade Box */}
          <View style={styles.tradeBox}>
            <Text style={{ fontWeight: "700", marginBottom: 6 }}>New Trade</Text>
            <View style={styles.tradeRow}>
              <TextInput style={styles.qtyInput} keyboardType="numeric" value={qty} onChangeText={setQty} placeholder="Qty" placeholderTextColor="#999" />
              <Button title="Buy" onPress={onBuy} />
            </View>

            <View style={styles.estimate}>
              <Text style={{ color: "#666" }}>Estimated Cost</Text>
              <Text style={{ fontSize: 16, fontWeight: "800" }}>{data.meta.currency ?? ""}{Number((Number(qty || 0) * (data.meta.regularMarketPrice ?? 0))).toLocaleString()}</Text>
              <Text style={{ fontSize: 12, color: "#888" }}>Based on market price {data.meta.currency ?? ""}{Number(data.meta.regularMarketPrice ?? 0).toLocaleString()}</Text>
            </View>
          </View>

          <Text style={{ marginTop: 12, fontWeight: "700" }}>Recent history (newest first)</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Use Stack.Screen to customize the native stack header for this route.
          To hide the header entirely, change `headerShown` to `false`. */}
      <Stack.Screen
        options={{
          title: symbol ?? "Stock Details",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#000",
          // headerShown: false, // <-- uncomment this line to completely remove the header
        }}
      />

      {/* FlatList is the top-level scroll container; header contains the UI above the list */}
      <FlatList
        style={styles.page}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 12 }}
        data={historyNewestFirst}
        keyExtractor={(item, index) => `${item.date}_${index}`}
        renderItem={renderHistory}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 2 }} />}
        ListEmptyComponent={() => (
          <View style={{ padding: 20 }}>
            <Text style={{ color: "#666" }}>{loading ? "Loading..." : "No history available"}</Text>
          </View>
        )}
        ListHeaderComponent={ListHeader}
        // improvement flags:
        keyboardShouldPersistTaps="handled"
        // avoid nested scroll issues on Android
        nestedScrollEnabled={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f7fb" },
  topContainer: { paddingTop: Platform.OS === "web" ? 4 : 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  headerSymbol: { fontWeight: "700", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginHorizontal: 12,
  },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { color: "#666", marginTop: 4 },
  rowTop: { marginTop: 8, flexDirection: "row", alignItems: "center" },
  metaSmall: { color: "#666", marginTop: 8, fontSize: 12 },

  rangeRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, justifyContent: "flex-start" },
  rangeBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: "#eee", margin: 4 },
  rangeBtnActive: { backgroundColor: "#007aff", borderColor: "#007aff" },
  rangeText: { color: "#333" },
  rangeTextActive: { color: "#fff" },

  tradeBox: { marginTop: 12, padding: 12, backgroundColor: "#f7fbff", borderRadius: 10 },
  tradeRow: { flexDirection: "row", alignItems: "center" },
  qtyInput: { borderWidth: 1, borderColor: "#eee", padding: 8, borderRadius: 8, marginRight: 8, flex: 1 },
  estimate: { marginTop: 10, backgroundColor: "#eef6ff", padding: 10, borderRadius: 8 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 8 },
  historyDate: { color: "#555" },
  historyClose: { fontWeight: "700" },
});
