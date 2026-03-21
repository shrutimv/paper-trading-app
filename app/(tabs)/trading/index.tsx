import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import Watchlist from "../../../components/Watchlist";

export default function TradingDashboard() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hi, Ananya Sharma!</Text>
            <Text style={styles.sub}>Welcome back to PaperTrade</Text>
          </View>
          <MaterialIcons name="notifications-none" size={24} color="#111827" />
        </View>

        {/* MARKET OVERVIEW */}
        <Text style={styles.section}>MARKET OVERVIEW</Text>

        <View style={styles.row}>
          <View style={styles.marketCard}>
            <Text style={styles.marketLabel}>NIFTY 50</Text>
            <Text style={styles.marketValue}>0.00</Text>
            <Text style={styles.green}>0%</Text>
          </View>

          <View style={styles.marketCard}>
            <Text style={styles.marketLabel}>SENSEX</Text>
            <Text style={styles.marketValue}>0.00</Text>
            <Text style={styles.green}>+0%</Text>
          </View>
        </View>

        {/* EQUITY CARD */}
        <View style={styles.equityCard}>
          <Text style={styles.equityLabel}>Equity</Text>

          <Text style={styles.equitySub}>Margin Available</Text>
          <Text style={styles.equityAmount}>3.74k</Text>

          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.equitySub}>Margin Used</Text>
              <Text style={styles.white}>0</Text>
            </View>

            <View>
              <Text style={styles.equitySub}>Opening Balance</Text>
              <Text style={styles.white}>3.74k</Text>
            </View>
          </View>
        </View>

        {/* HOLDINGS CARD */}
        <View style={styles.holdingsCard}>
          <Text style={styles.holdingsTitle}>Holdings</Text>

          <View style={styles.holdingsRow}>
            <Text style={styles.holdingsLabel}>P&L</Text>
            <Text style={styles.greenBold}>+1.55k (+5.18%)</Text>
          </View>

          <View style={styles.holdingsRow}>
            <Text style={styles.holdingsLabel}>Current Value</Text>
            <Text style={styles.holdingsValue}>₹31.43k</Text>
          </View>

          <View style={styles.holdingsRow}>
            <Text style={styles.holdingsLabel}>Investment</Text>
            <Text style={styles.holdingsValue}>₹29.88k</Text>
          </View>
        </View>

        {/* WATCHLIST COMPONENT */}
        <Watchlist showSearch={true} limit={5} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  },

  equityCard: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },

  equityLabel: {
    color: "#ffffff",
    marginBottom: 8,
    fontSize: 17,
  },

  equityAmount: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginVertical: 8,
  },

  equitySub: {
    color: "#c7d2fe",
    fontSize: 12,
  },

  white: {
    color: "#fff",
    fontWeight: "600",
  },

  holdingsCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
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
    marginBottom: 10,
  },

  holdingsLabel: {
    fontSize: 13,
    color: "#6b7280",
  },

  holdingsValue: {
    fontWeight: "700",
    color: "#111827",
  },

  greenBold: {
    color: "#16a34a",
    fontWeight: "700",
  },
});
