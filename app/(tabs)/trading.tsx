// app/(tabs)/search.tsx
import { useRouter } from "expo-router";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { searchCompanies } from "../../src/api";
import type { SelectedResult } from "../../src/types";

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [exchange, setExchange] = useState<"Auto" | "NSE" | "BSE">("Auto");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SelectedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // debounce the backend calls to 350 ms
  const doSearch = useMemo(
    () =>
      debounce(async (term: string, exch: string) => {
        if (!term || term.trim().length === 0) {
          setResults([]);
          setLoading(false);
          return;
        }
        setError(null);
        setLoading(true);
        try {
          const res = await searchCompanies(term.trim(), exch, 80, 0);
          setResults(res);
        } catch (e: any) {
          setError(e?.message || "Search failed");
        } finally {
          setLoading(false);
        }
      }, 350),
    []
  );

  useEffect(() => {
    doSearch(q, exchange);
    return () => {
      doSearch.cancel();
    };
  }, [q, exchange]);

  function onPick(item: SelectedResult) {
    // navigate to dynamic route by symbol
    // use router.push with pathname+params and cast to any to avoid union typing issues
    router.push({ pathname: "/stock/[symbol]", params: { symbol: item.symbol } } as any);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Stocks</Text>

      <TextInput
        style={styles.input}
        placeholder="Type company or symbol (e.g. Godrej)"
        value={q}
        onChangeText={setQ}
        returnKeyType="search"
        onSubmitEditing={() => {
          Keyboard.dismiss();
          doSearch.flush();
        }}
      />

      <View style={styles.segment}>
        {(["Auto", "NSE", "BSE"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setExchange(s)}
            style={[styles.segmentBtn, exchange === s && styles.segmentBtnActive]}
          >
            <Text style={exchange === s ? styles.segmentTextActive : styles.segmentText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

      {error && <Text style={{ color: "red", marginTop: 12 }}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => onPick(item)}>
            <View>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={styles.short}>{item.shortname}</Text>
            </View>
            <Text style={styles.exchange}>{item.exchange ?? ""}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() =>
          !loading && q ? <Text style={{ marginTop: 12, textAlign: "center" }}>No matches</Text> : null
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#f4f7fb" },
  title: { textAlign: "center", marginBottom: 12, fontWeight: "700", fontSize: 16 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#eee" },
  segment: { flexDirection: "row", marginTop: 8, justifyContent: "space-around" },
  segmentBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  segmentBtnActive: { backgroundColor: "#007aff", borderColor: "#007aff" },
  segmentText: { color: "#333" },
  segmentTextActive: { color: "#fff" },
  item: { padding: 12, backgroundColor: "#fff", marginTop: 8, borderRadius: 10, flexDirection: "row", justifyContent: "space-between" },
  symbol: { fontWeight: "800" },
  short: { color: "#666", marginTop: 2, maxWidth: 240 },
  exchange: { color: "#444", fontWeight: "600", alignSelf: "center" },
});
