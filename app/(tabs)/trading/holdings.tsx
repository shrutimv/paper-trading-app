import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { holdings, watchlist } from "../../../src/data/data";

export default function HoldingsScreen() {
  // Calculate totals dynamically from dummy data
  const totalInvestment = holdings.reduce(
    (sum, item) => sum + item.avg * item.qty,
    0,
  );

  const currentValue = holdings.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const totalPL = currentValue - totalInvestment;
  const totalPLPercent = ((totalPL / totalInvestment) * 100).toFixed(2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Holdings</Text>
          <MaterialIcons name="search" size={22} color="#111827" />
        </View>

        {/* MARKET CARDS */}
        <View style={styles.row}>
          <View style={styles.marketCard}>
            <Text style={styles.marketLabel}>NIFTY 50</Text>
            <Text style={styles.marketValue}>22,123.45</Text>
            <Text style={styles.green}>+0.45%</Text>
          </View>

          <View style={styles.marketCard}>
            <Text style={styles.marketLabel}>SENSEX</Text>
            <Text style={styles.marketValue}>72,890.10</Text>
            <Text style={styles.green}>+0.38%</Text>
          </View>
        </View>

        {/* INSTRUMENTS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.section}>Instruments ({holdings.length})</Text>
          <MaterialIcons name="tune" size={18} color="#6b7280" />
        </View>

        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* HEADER */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { width: 130 }]}>
                  INSTRUMENT
                </Text>
                <Text style={styles.headerCell}>QTY</Text>
                <Text style={styles.headerCell}>AVG COST</Text>
                <Text style={styles.headerCell}>LTP</Text>
                <Text style={styles.headerCell}>NET %</Text>
                <Text style={styles.headerCell}>DAY %</Text>
              </View>

              {/* ROWS */}
              {holdings.map((item) => (
                <View key={item.name} style={styles.tableRow}>
                  <Text style={[styles.cellBold, { width: 130 }]}>
                    {item.name}
                  </Text>

                  <Text style={styles.cell}>{item.qty}</Text>
                  <Text style={styles.cell}>₹{item.avg}</Text>
                  <Text style={styles.cell}>₹{item.price}</Text>

                  <Text
                    style={[
                      styles.cell,
                      item.net.includes("-")
                        ? styles.redText
                        : styles.greenText,
                    ]}
                  >
                    {item.net}
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      item.day.includes("-")
                        ? styles.redText
                        : styles.greenText,
                    ]}
                  >
                    {item.day}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.subText}>TOTAL INVESTMENT</Text>
              <Text style={styles.bold}>₹{totalInvestment.toFixed(2)}</Text>
            </View>

            <View>
              <Text style={styles.subText}>CURRENT VALUE</Text>
              <Text style={styles.bold}>₹{currentValue.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.subText}>TOTAL P&L</Text>
            <Text
              style={{
                color: totalPL >= 0 ? "#16a34a" : "#ef4444",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              ₹{totalPL.toFixed(2)} ({totalPLPercent}%)
            </Text>
          </View>
        </View>

        {/* Quick Watchlist */}
        <View style={styles.rowBetween}>
          <Text style={styles.section}>Quick Watchlist</Text>
          <Text style={styles.link}>View All</Text>
        </View>

        {watchlist.map((item) => (
          <View key={item.name} style={styles.stockRow}>
            <View>
              <Text style={styles.stockName}>{item.name}</Text>
              <Text style={styles.stockSub}>NSE • Equity</Text>
            </View>

            <View style={styles.stockRight}>
              <Text style={styles.stockPrice}>₹{item.price}</Text>
              <Text
                style={[
                  styles.stockChange,
                  item.isDown ? styles.redText : styles.greenText,
                ]}
              >
                {item.percent}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  tableCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },

  headerCell: {
    width: 90,
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
  },

  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },

  cell: {
    width: 90,
    fontSize: 13,
    color: "#111827",
  },

  cellBold: {
    fontWeight: "700",
    fontSize: 13,
    color: "#111827",
  },

  stockName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  stockSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  stockPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  stockRight: {
    alignItems: "flex-end",
  },

  stockChange: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  greenText: {
    color: "#16a34a",
  },

  redText: {
    color: "#ef4444",
  },

  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  section: {
    fontSize: 14,
    fontWeight: "700",
    marginVertical: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
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

  instrumentRow: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  instrumentName: {
    fontWeight: "700",
  },

  subText: {
    fontSize: 12,
    color: "#6b7280",
  },

  bold: {
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: "#e0f2fe",
    padding: 16,
    borderRadius: 16,
    marginVertical: 20,
  },

  stockRow: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  link: {
    color: "#2563eb",
    fontSize: 12,
  },
});
