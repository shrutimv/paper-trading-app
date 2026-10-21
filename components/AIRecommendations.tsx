import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { useTrading } from "../context/TradingContext";
import { API_BASE_URL } from "../src/config";

interface StockRecommendation {
  symbol: string;
  name: string;
  sector: string;
  market_cap: string;
  price: number;
  beta: number;
  rsi: number;
  momentum_1m: number;
  trend: string;
  match_score: number;
  action: string;
  risk_level: string;
  rationale: string;
}

const RISK_PROFILES = [
  { id: "CONSERVATIVE", label: "Conservative", icon: "shield-checkmark", desc: "Low Risk & Dividends" },
  { id: "MODERATE", label: "Moderate", icon: "scale", desc: "Balanced Growth" },
  { id: "AGGRESSIVE", label: "Aggressive", icon: "rocket", desc: "High Momentum & Beta" },
];

const SECTOR_OPTIONS = ["All", "IT", "Banking", "Automobile", "Energy", "FMCG", "Pharma"];

export default function AIRecommendations() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { holdings, transactions } = useTrading();

  const [selectedRisk, setSelectedRisk] = useState<string>("MODERATE");
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        risk: selectedRisk,
        limit: 6,
      };

      if (selectedSector !== "All") {
        params.sectors = selectedSector;
      }

      // Feed user's actual buying and selling history to the ML engine
      const holdingsSymbols = holdings.map((h) => h.symbol).join(",");
      const tradedSymbols = Array.from(new Set((transactions || []).map((t) => t.symbol))).join(",");

      if (holdingsSymbols) params.holdings = holdingsSymbols;
      if (tradedSymbols) params.trades = tradedSymbols;

      const res = await axios.get(`${API_BASE_URL}/ml/recommend`, {
        params,
        timeout: 8000,
      });

      if (res.data && Array.isArray(res.data.recommendations)) {
        setRecommendations(res.data.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (err: any) {
      console.log("AI recommendations fetch error:", err.message);
      setError("AI model is warming up. Tap to retry.");
    } finally {
      setLoading(false);
    }
  }, [selectedRisk, selectedSector, holdings, transactions]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const styles = getStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#ffffff" />
            <Text style={styles.aiBadgeText}>AI ENGINE</Text>
          </View>
          <Text style={styles.heading}>Recommendations</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/trading")}
          style={styles.exploreLink}
        >
          <Text style={styles.exploreText}>Trading Hub →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subheading}>
        Personalized to your buying & selling activity, risk profile, and market momentum.
      </Text>

      {/* Risk Profile Segmented Controller */}
      <View style={styles.riskSelectorRow}>
        {RISK_PROFILES.map((rp) => {
          const isActive = selectedRisk === rp.id;
          return (
            <TouchableOpacity
              key={rp.id}
              activeOpacity={0.8}
              onPress={() => setSelectedRisk(rp.id)}
              style={[styles.riskTab, isActive && styles.riskTabActive]}
            >
              <Ionicons
                name={rp.icon as any}
                size={16}
                color={isActive ? "#ffffff" : colors.textSecondary}
              />
              <Text style={[styles.riskTabText, isActive && styles.riskTabTextActive]}>
                {rp.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sector Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectorScroll}
      >
        {SECTOR_OPTIONS.map((sec) => {
          const isSecActive = selectedSector === sec;
          return (
            <TouchableOpacity
              key={sec}
              onPress={() => setSelectedSector(sec)}
              style={[styles.sectorChip, isSecActive && styles.sectorChipActive]}
            >
              <Text style={[styles.sectorChipText, isSecActive && styles.sectorChipTextActive]}>
                {sec}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content Area */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>ML Model scoring Nifty stock universe...</Text>
        </View>
      ) : error ? (
        <TouchableOpacity onPress={fetchRecommendations} style={styles.errorBox}>
          <Ionicons name="refresh-circle" size={24} color="#2563eb" />
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        >
          {recommendations.map((stock) => {
            const isBullish = stock.momentum_1m >= 0;
            return (
              <TouchableOpacity
                key={stock.symbol}
                activeOpacity={0.85}
                onPress={() => router.push(`/stock/${stock.symbol}`)}
                style={styles.stockCard}
              >
                {/* Top Card Bar: Sector & Match Badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.sectorTag}>
                    <Text style={styles.sectorTagText}>{stock.sector}</Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>{stock.match_score}% MATCH</Text>
                  </View>
                </View>

                {/* Symbol & Name */}
                <Text style={styles.symbolText}>{stock.symbol.replace(".NS", "")}</Text>
                <Text numberOfLines={1} style={styles.companyName}>
                  {stock.name}
                </Text>

                {/* Price & Momentum */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{stock.price.toLocaleString("en-IN")}</Text>
                  <View style={[styles.momentumPill, isBullish ? styles.pillGreen : styles.pillRed]}>
                    <Ionicons
                      name={isBullish ? "trending-up" : "trending-down"}
                      size={13}
                      color={isBullish ? "#16a34a" : "#dc2626"}
                    />
                    <Text style={[styles.momentumText, isBullish ? styles.textGreen : styles.textRed]}>
                      {isBullish ? "+" : ""}{stock.momentum_1m}% 1M
                    </Text>
                  </View>
                </View>

                {/* Explainable AI Rationale */}
                <View style={styles.rationaleBox}>
                  <Text numberOfLines={3} style={styles.rationaleText}>
                    💡 {stock.rationale}
                  </Text>
                </View>

                {/* Bottom Action Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionText}>{stock.action.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.analyzeBtn}>Analyze →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginTop: 25,
      marginBottom: 10,
      paddingHorizontal: 16,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    titleWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    aiBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#2563eb",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    aiBadgeText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    heading: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    exploreLink: {
      paddingVertical: 4,
    },
    exploreText: {
      fontSize: 13,
      color: "#2563eb",
      fontWeight: "700",
    },
    subheading: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 14,
      lineHeight: 18,
    },
    riskSelectorRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
      padding: 4,
      borderRadius: 14,
      marginBottom: 12,
    },
    riskTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      borderRadius: 10,
    },
    riskTabActive: {
      backgroundColor: "#2563eb",
      shadowColor: "#2563eb",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    riskTabText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    riskTabTextActive: {
      color: "#ffffff",
    },
    sectorScroll: {
      paddingBottom: 14,
      gap: 8,
    },
    sectorChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
      borderWidth: 1,
      borderColor: "transparent",
    },
    sectorChipActive: {
      backgroundColor: isDark ? "rgba(37, 99, 235, 0.2)" : "rgba(37, 99, 235, 0.12)",
      borderColor: "#2563eb",
    },
    sectorChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    sectorChipTextActive: {
      color: "#2563eb",
      fontWeight: "800",
    },
    cardsScroll: {
      paddingRight: 16,
      gap: 14,
      paddingVertical: 4,
    },
    stockCard: {
      width: 250,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    sectorTag: {
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    sectorTagText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    matchBadge: {
      backgroundColor: "rgba(34, 197, 94, 0.14)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    matchText: {
      color: "#16a34a",
      fontSize: 10,
      fontWeight: "900",
    },
    symbolText: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: 0.5,
    },
    companyName: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 10,
      fontWeight: "500",
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    priceText: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
    },
    momentumPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    pillGreen: {
      backgroundColor: "rgba(34, 197, 94, 0.12)",
    },
    pillRed: {
      backgroundColor: "rgba(239, 68, 68, 0.12)",
    },
    momentumText: {
      fontSize: 11,
      fontWeight: "800",
    },
    textGreen: {
      color: "#16a34a",
    },
    textRed: {
      color: "#dc2626",
    },
    rationaleBox: {
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
      padding: 8,
      borderRadius: 10,
      marginBottom: 12,
      minHeight: 52,
      justifyContent: "center",
    },
    rationaleText: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
      fontWeight: "500",
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
    },
    actionBadge: {
      backgroundColor: "rgba(37, 99, 235, 0.1)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    actionText: {
      fontSize: 10,
      fontWeight: "900",
      color: "#2563eb",
    },
    analyzeBtn: {
      fontSize: 12,
      fontWeight: "700",
      color: "#2563eb",
    },
    loadingBox: {
      paddingVertical: 35,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    errorBox: {
      paddingVertical: 25,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    errorText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
    },
  });
