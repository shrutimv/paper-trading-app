import { useRouter } from "expo-router";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { Transaction, useTrading } from "../../../context/TradingContext";
import Watchlist from "../../../components/Watchlist";

const fmtCurrency = (val: number) =>
  "₹" +
  (val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (isoString?: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrdersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { transactions } = useTrading();
  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");

  const styles = getStyles(colors, isDark);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    return tx.type === filter;
  });

  const totalBuyCount = transactions.filter((t) => t.type === "BUY").length;
  const totalSellCount = transactions.filter((t) => t.type === "SELL").length;

  const renderTransactionCard = ({ item }: { item: Transaction }) => {
    const isBuy = item.type === "BUY";
    const badgeColor = isBuy ? "#10B981" : "#EF4444";
    const badgeBg = isBuy
      ? isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7"
      : isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2";

    return (
      <View style={styles.orderCard}>
        {/* TOP ROW */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.symbolText}>{item.symbol}</Text>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.companyName || item.symbol}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <MaterialIcons
              name={isBuy ? "arrow-upward" : "arrow-downward"}
              size={12}
              color={badgeColor}
            />
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {item.type}
            </Text>
          </View>
        </View>

        {/* METRICS GRID */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Executed Price</Text>
            <Text style={styles.metricValue}>{fmtCurrency(item.price)}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Quantity</Text>
            <Text style={styles.metricValue}>{item.quantity} Qty</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Amount</Text>
            <Text style={styles.metricValue}>{fmtCurrency(item.totalAmount)}</Text>
          </View>
        </View>

        {/* BOTTOM METADATA ROW */}
        <View style={styles.cardFooter}>
          <View style={styles.footerPillWrap}>
            <View style={styles.productPill}>
              <Text style={styles.productPillText}>
                {(item.productType || "cnc").toUpperCase()}
              </Text>
            </View>

            {item.stopLoss ? (
              <View style={styles.stopLossPill}>
                <MaterialIcons name="shield" size={11} color="#3B82F6" />
                <Text style={styles.stopLossPillText}> SL: ₹{item.stopLoss}</Text>
              </View>
            ) : null}

            {item.type === "SELL" && item.pnl !== undefined ? (
              <View
                style={[
                  styles.pnlPill,
                  {
                    backgroundColor:
                      item.pnl >= 0
                        ? isDark ? "rgba(16, 185, 129, 0.12)" : "#dcfce7"
                        : isDark ? "rgba(239, 68, 68, 0.12)" : "#fee2e2",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: item.pnl >= 0 ? "#10B981" : "#EF4444",
                  }}
                >
                  P&L: {item.pnl >= 0 ? "+" : ""}{fmtCurrency(item.pnl)}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={{ flexDirection: "row", alignItems: "center" }}
          onPress={() => router.push("/(tabs)/trading")}
        >
          <MaterialCommunityIcons name="history" size={24} color={colors.accent} />
          <Text style={styles.headerTitle}> Trade Logs & Orders</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY STATS BAR */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{transactions.length}</Text>
          <Text style={styles.statLabel}>Total Executed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: "#10B981" }]}>{totalBuyCount}</Text>
          <Text style={styles.statLabel}>Buys</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: "#EF4444" }]}>{totalSellCount}</Text>
          <Text style={styles.statLabel}>Sells</Text>
        </View>
      </View>

      {/* FILTER CHIPS */}
      <View style={styles.filterRow}>
        {(["ALL", "BUY", "SELL"] as const).map((chip) => {
          const isActive = filter === chip;
          return (
            <TouchableOpacity
              key={chip}
              onPress={() => setFilter(chip)}
              style={[styles.filterChip, isActive && styles.activeFilterChip]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.activeFilterChipText,
                ]}
              >
                {chip === "ALL" ? "All Orders" : chip === "BUY" ? "Buy Orders" : "Sell Orders"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ORDERS LIST */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="receipt-long" size={40} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No trade logs recorded yet</Text>
          <Text style={styles.emptySub}>
            Place your first buy or sell order on any stock to view transaction execution details here.
          </Text>
          <Watchlist showSearch={false} />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item, index) => item.id || item._id || index.toString()}
          renderItem={renderTransactionCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      marginLeft: 6,
    },
    statsBar: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "space-around",
    },
    statBox: { alignItems: "center" },
    statNumber: { fontSize: 16, fontWeight: "800", color: colors.text },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: "600" },
    statDivider: { width: 1, height: 24, backgroundColor: colors.border },

    filterRow: {
      flexDirection: "row",
      marginBottom: 14,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeFilterChip: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    activeFilterChipText: {
      color: "#FFFFFF",
    },

    orderCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    symbolText: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
    },
    companyName: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
      marginTop: 2,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 3,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "800",
    },

    metricsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
      padding: 10,
      borderRadius: 10,
      marginBottom: 10,
    },
    metricItem: { flex: 1, alignItems: "flex-start" },
    metricLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    metricValue: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },

    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerPillWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    productPill: {
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    productPillText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.text,
    },
    stopLossPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#dbeafe",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    stopLossPillText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#3B82F6",
    },
    pnlPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    dateText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "500",
    },

    emptyContainer: {
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 24,
      borderRadius: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: isDark ? "rgba(59, 130, 246, 0.12)" : "#dbeafe",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 6,
    },
    emptySub: {
      textAlign: "center",
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
    },
  });
