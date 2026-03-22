import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

// Imports for our custom components and context
import PageTransition from "@/components/PageTransition";
import Watchlist from "../../../components/Watchlist";
import { useTrading } from "../../../context/TradingContext";

// Helper function to format money nicely (e.g., 100000 -> ₹1,00,000.00)
const formatCurrency = (value: number) => {
  return "₹" + value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
};

export default function TradingDashboard() {
  // Pull live data from our Global Bank
  const { balance, totalInvestment } = useTrading();

  // For the dashboard overview, we calculate P&L. 
  // (Note: Once we fetch live prices for holdings, currentValue will update dynamically!)
  const currentValue = totalInvestment; 
  const pnl = currentValue - totalInvestment;
  const pnlPercent = totalInvestment > 0 ? (pnl / totalInvestment) * 100 : 0;

  return (
    <PageTransition>
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hi, Trader!</Text>
            <Text style={styles.sub}>Welcome back to PaperTrade</Text>
          </View>
          <MaterialIcons name="notifications-none" size={24} color="#111827" />
        </View>

        {/* MARKET OVERVIEW */}
        <Text style={styles.section}>MARKET OVERVIEW</Text>

        <View style={styles.row}>
          <View style={styles.marketCard}>
            <Text style={styles.marketLabel}>NIFTY 50</Text>
            <Text style={styles.marketValue}>Live Soon</Text>
            <Text style={styles.green}>--</Text>
          </View>

          <View style={styles.marketCard}>
            <Text style={styles.marketLabel}>SENSEX</Text>
            <Text style={styles.marketValue}>Live Soon</Text>
            <Text style={styles.green}>--</Text>
          </View>
        </View>

        {/* EQUITY CARD */}
        <View style={styles.equityCard}>
          <Text style={styles.equityLabel}>Equity</Text>

          <Text style={styles.equitySub}>Margin Available</Text>
          {/* LIVE BALANCE DISPLAYED HERE */}
          <Text style={styles.equityAmount}>{formatCurrency(balance)}</Text>

          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.equitySub}>Margin Used</Text>
              <Text style={styles.white}>{formatCurrency(totalInvestment)}</Text>
            </View>

            <View>
              <Text style={styles.equitySub}>Opening Balance</Text>
              <Text style={styles.white}>₹1,00,000.00</Text>
            </View>
          </View>
        </View>

        {/* HOLDINGS CARD */}
        <View style={styles.holdingsCard}>
          <Text style={styles.holdingsTitle}>Holdings Snapshot</Text>

          <View style={styles.holdingsRow}>
            <Text style={styles.holdingsLabel}>Total P&L</Text>
            <Text style={[styles.greenBold, { color: pnl >= 0 ? '#16a34a' : '#dc2626' }]}>
              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnlPercent.toFixed(2)}%)
            </Text>
          </View>

          <View style={styles.holdingsRow}>
            <Text style={styles.holdingsLabel}>Current Value</Text>
            <Text style={styles.holdingsValue}>{formatCurrency(currentValue)}</Text>
          </View>

          <View style={styles.holdingsRow}>
            <Text style={styles.holdingsLabel}>Total Investment</Text>
            <Text style={styles.holdingsValue}>{formatCurrency(totalInvestment)}</Text>
          </View>
        </View>

        {/* WATCHLIST COMPONENT */}
        <Watchlist showSearch={true} limit={5} />
      </ScrollView>
    </SafeAreaView>
    </PageTransition>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  hello: {
    fontSize: 20,
    fontWeight: "800",
  },
  sub: {
    color: "#6b7280",
    fontSize: 13,
  },
  section: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 10,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marketCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  marketLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  marketValue: {
    fontSize: 16,
    fontWeight: "700",
    marginVertical: 4,
  },
  green: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "600",
  },
  equityCard: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  equityLabel: {
    color: "#ffffff",
    marginBottom: 8,
    fontSize: 17,
    fontWeight: "600",
  },
  equityAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  equitySub: {
    color: "#c7d2fe",
    fontSize: 12,
    marginBottom: 2,
  },
  white: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  holdingsCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  holdingsTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 14,
    color: "#111827",
  },
  holdingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  holdingsLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  holdingsValue: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 14,
  },
  greenBold: {
    color: "#16a34a",
    fontWeight: "700",
    fontSize: 14,
  },
});