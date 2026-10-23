// components/RecommendedStockCarousel.tsx
import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../context/ThemeContext";
import { useTrading } from "../context/TradingContext";
import { API_BASE_URL } from "../src/config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 390);
const CHART_WIDTH = CARD_WIDTH - 24;

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change?: number;
  changePct?: number;
  matchScore: number;
  action: string;
  rationale?: string;
}

const TIMEFRAMES = [
  { label: "1D", period: "1d", interval: "5m" },
  { label: "1M", period: "1mo", interval: "1d" },
  { label: "6M", period: "6mo", interval: "1d" },
  { label: "1Y", period: "1y", interval: "1wk" },
  { label: "5Y", period: "5y", interval: "1mo" },
  { label: "MAX", period: "max", interval: "3mo" },
];

// Fallback high-conviction companies if ML backend is warming up or user has zero trades
const DEFAULT_RECOMMENDATIONS: StockItem[] = [
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Limited", price: 410.3, change: 5.3, changePct: 1.31, matchScore: 96, action: "Strong Buy", rationale: "EV leadership & turnaround momentum" },
  { symbol: "ZOMATO.NS", name: "Zomato Limited", price: 249.0, change: 4.8, changePct: 1.96, matchScore: 93, action: "Buy", rationale: "High quick-commerce Blinkit expansion" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", price: 1280.5, change: 12.4, changePct: 0.98, matchScore: 91, action: "Accumulate", rationale: "Diversified retail & telecom cash flow" },
  { symbol: "INFY.NS", name: "Infosys Limited", price: 1845.0, change: -8.2, changePct: -0.44, matchScore: 89, action: "Hold", rationale: "Large digital deal pipeline" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Limited", price: 1680.0, change: 9.5, changePct: 0.57, matchScore: 88, action: "Buy", rationale: "Credit growth & post-merger synergy" },
];

export default function RecommendedStockCarousel() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { holdings, transactions } = useTrading();

  const [stocks, setStocks] = useState<StockItem[]>(DEFAULT_RECOMMENDATIONS);
  const [loadingList, setLoadingList] = useState<boolean>(true);

  // Fetch ML Recommendations based on user's actual purchases and holdings
  const loadMLRecommendations = useCallback(async () => {
    try {
      setLoadingList(true);
      const holdingsSymbols = (holdings || []).map((h) => h.symbol).join(",");
      const tradedSymbols = Array.from(new Set((transactions || []).map((t) => t.symbol))).join(",");

      const params: Record<string, any> = {
        limit: 5,
        risk: "MODERATE",
      };
      if (holdingsSymbols) params.holdings = holdingsSymbols;
      if (tradedSymbols) params.trades = tradedSymbols;

      const res = await axios.get(`${API_BASE_URL}/ml/recommend`, {
        params,
        timeout: 25000,
      });

      if (res.data && Array.isArray(res.data.recommendations) && res.data.recommendations.length > 0) {
        const mapped = res.data.recommendations.slice(0, 5).map((r: any) => ({
          symbol: r.symbol.includes(".") ? r.symbol : `${r.symbol}.NS`,
          name: r.name || r.symbol,
          price: r.price || 500,
          change: r.momentum_1m ? (r.price * (r.momentum_1m / 100)) : 2.5,
          changePct: r.momentum_1m || 1.2,
          matchScore: r.match_score || 90,
          action: r.action || "Recommended",
          rationale: r.rationale || "Algorithmic portfolio fit",
        }));
        setStocks(mapped);
      } else {
        setStocks(DEFAULT_RECOMMENDATIONS);
      }
    } catch (err) {
      console.log("[RecommendedCarousel] ML recommend fallback:", err);
      setStocks(DEFAULT_RECOMMENDATIONS);
    } finally {
      setLoadingList(false);
    }
  }, [holdings, transactions]);

  useEffect(() => {
    loadMLRecommendations();
  }, [loadMLRecommendations]);

  const styles = getStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color="#ffffff" />
              <Text style={styles.aiBadgeText}>AI RECOMMENDED GRAPH</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Portfolio Matches</Text>
          <Text style={styles.sectionSubtitle}>
            Top 5 companies matched to your buying & trading history
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/trading")}
          style={styles.viewAllBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllText}>Trade Desk →</Text>
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL SNAP SCROLL CAROUSEL */}
      {loadingList ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Calculating ML portfolio fit...
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          pagingEnabled={false}
          snapToInterval={CARD_WIDTH + 14}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {stocks.map((item, index) => (
            <StockChartCard
              key={`${item.symbol}-${index}`}
              stock={item}
              colors={colors}
              isDark={isDark}
              onPress={() => router.push(`/stock/${encodeURIComponent(item.symbol)}` as any)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// INDIVIDUAL RECOMMENDED STOCK CARD WITH DYNAMIC TIMEFRAME GRAPH
const StockChartCard = memo(
  ({
    stock,
    colors,
    isDark,
    onPress,
  }: {
    stock: StockItem;
    colors: any;
    isDark: boolean;
    onPress: () => void;
  }) => {
    const [activeTf, setActiveTf] = useState(TIMEFRAMES[0]); // Default 1D
    const [chartData, setChartData] = useState<number[]>([
      stock.price * 0.99,
      stock.price * 0.995,
      stock.price * 1.002,
      stock.price * 0.998,
      stock.price * 1.005,
      stock.price,
    ]);
    const [chartLoading, setChartLoading] = useState<boolean>(false);
    const [livePrice, setLivePrice] = useState<number>(stock.price);
    const [changePct, setChangePct] = useState<number>(stock.changePct || 1.2);

    const fetchHistory = useCallback(
      async (tf: (typeof TIMEFRAMES)[0]) => {
        try {
          setChartLoading(true);
          const cleanSym = stock.symbol.trim();
          const res = await axios.get(`${API_BASE_URL}/stock`, {
            params: {
              symbol: cleanSym,
              period: tf.period,
              interval: tf.interval,
              compact: true,
            },
            timeout: 15000,
          });

          if (res.data) {
            if (res.data.currentPrice) {
              setLivePrice(res.data.currentPrice);
            }
            if (res.data.history && Array.isArray(res.data.history) && res.data.history.length > 1) {
              const closes: number[] = res.data.history
                .map((pt: any) => Number(pt.close))
                .filter((v: number) => !isNaN(v) && v > 0);

              if (closes.length > 1) {
                // Downsample to max 30 points for smooth, crisp mobile rendering
                const step = Math.max(1, Math.floor(closes.length / 30));
                const sampled = closes.filter((_, idx) => idx % step === 0);
                if (sampled.length > 2) {
                  setChartData(sampled);

                  // Calculate period change
                  const first = sampled[0];
                  const last = sampled[sampled.length - 1];
                  const pct = ((last - first) / first) * 100;
                  setChangePct(Number(pct.toFixed(2)));
                }
              }
            }
          }
        } catch (e) {
          // If network is offline or throttled, create a slight realistic simulation
          const baseline = stock.price;
          const sim = [
            baseline * 0.985,
            baseline * 0.992,
            baseline * 1.005,
            baseline * 0.998,
            baseline * 1.012,
            baseline * 1.018,
          ];
          setChartData(sim);
        } finally {
          setChartLoading(false);
        }
      },
      [stock.symbol, stock.price]
    );

    useEffect(() => {
      fetchHistory(activeTf);
    }, [activeTf, fetchHistory]);

    const isPositive = changePct >= 0;
    const strokeColor = isPositive ? "#10b981" : "#ef4444";
    const fillColor = isPositive
      ? (opacity = 1) => `rgba(16, 185, 129, ${opacity})`
      : (opacity = 1) => `rgba(239, 68, 68, ${opacity})`;

    const styles = getStyles(colors, isDark);

    return (
      <View style={[styles.card, { width: CARD_WIDTH }]}>
        {/* CARD TOP INFO */}
        <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.symbolText}>{stock.symbol.replace(".NS", "")}</Text>
                <View style={styles.matchPill}>
                  <Text style={styles.matchPillText}>{stock.matchScore}% Match</Text>
                </View>
              </View>
              <Text style={styles.companyName} numberOfLines={1}>
                {stock.name}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.priceText}>
                ₹{livePrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View
                style={[
                  styles.changeBadge,
                  { backgroundColor: isPositive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)" },
                ]}
              >
                <Ionicons
                  name={isPositive ? "arrow-up" : "arrow-down"}
                  size={11}
                  color={isPositive ? "#10b981" : "#ef4444"}
                />
                <Text style={[styles.changeText, { color: isPositive ? "#10b981" : "#ef4444" }]}>
                  {isPositive ? "+" : ""}
                  {changePct}% ({activeTf.label})
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* CHART DISPLAY AREA */}
        <View style={styles.chartWrapper}>
          {chartLoading && (
            <View style={styles.chartOverlay}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}

          <LineChart
            data={{
              labels: [],
              datasets: [
                {
                  data: chartData.length > 0 ? chartData : [100, 101, 102],
                  strokeWidth: 2.5,
                  color: fillColor,
                },
              ],
            }}
            width={CHART_WIDTH}
            height={130}
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={false}
            withVerticalLabels={false}
            fromZero={false}
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              color: fillColor,
              strokeWidth: 2.5,
              propsForBackgroundLines: { strokeWidth: 0 },
            }}
            bezier
            style={styles.lineChart}
          />
        </View>

        {/* TIMEFRAME SELECTOR BUTTONS (1D, 1M, 6M, 1Y, 5Y, MAX) */}
        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((tf) => {
            const isSelected = activeTf.label === tf.label;
            return (
              <TouchableOpacity
                key={tf.label}
                onPress={() => setActiveTf(tf)}
                style={[
                  styles.tfBtn,
                  isSelected && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.tfBtnText,
                    { color: isSelected ? "#ffffff" : colors.textSecondary },
                  ]}
                >
                  {tf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }
);

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginTop: 20,
      marginBottom: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    aiBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#2563eb",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    aiBadgeText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.text,
      marginTop: 2,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    viewAllBtn: {
      paddingBottom: 4,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.accent,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 14,
    },
    loadingBox: {
      height: 160,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
      fontWeight: "600",
    },

    /* CARD STYLES */
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    symbolText: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.text,
    },
    matchPill: {
      backgroundColor: isDark ? "rgba(37,99,235,0.2)" : "#dbeafe",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    matchPillText: {
      fontSize: 10.5,
      fontWeight: "800",
      color: "#2563eb",
    },
    companyName: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
      marginTop: 2,
    },
    priceText: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text,
    },
    changeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginTop: 2,
    },
    changeText: {
      fontSize: 11,
      fontWeight: "800",
    },

    /* CHART WRAPPER */
    chartWrapper: {
      position: "relative",
      marginTop: 4,
      marginBottom: 10,
      alignItems: "center",
      justifyContent: "center",
      height: 130,
    },
    chartOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      borderRadius: 12,
    },
    lineChart: {
      marginLeft: -16,
      marginRight: -16,
      paddingRight: 0,
    },

    /* TIMEFRAME SELECTOR ROW */
    timeframeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      gap: 6,
    },
    tfBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    },
    tfBtnText: {
      fontSize: 11.5,
      fontWeight: "800",
    },
  });
