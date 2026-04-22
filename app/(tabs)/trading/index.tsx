import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Imports for our custom components and context
import PageTransition from "@/components/PageTransition";
import Watchlist from "../../../components/Watchlist";
import { useTrading } from "../../../context/TradingContext";

const formatCurrency = (value: number) => {
  return "₳" + value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
};

export default function TradingDashboard() {
  const { balance, totalInvestment } = useTrading();
  const currentValue = totalInvestment; 
  const pnl = currentValue - totalInvestment;
  const pnlPercent = totalInvestment > 0 ? (pnl / totalInvestment) * 100 : 0;

  return (
    <PageTransition>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          
          {/* PREMIUM HEADER */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>PORTFOLIO</Text>
              <Text style={styles.username}>Trading Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <MaterialIcons name="notifications-none" size={22} color="#0f62fe" />
            </TouchableOpacity>
          </View>

          {/* MARKET OVERVIEW */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>NIFTY 50</Text>
              <Text style={styles.marketValue}>Live Soon</Text>
              <View style={styles.badgeNeutral}><Text style={styles.neutralText}>--</Text></View>
            </View>

            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>SENSEX</Text>
              <Text style={styles.marketValue}>Live Soon</Text>
              <View style={styles.badgeNeutral}><Text style={styles.neutralText}>--</Text></View>
            </View>
          </View>

          {/* PREMIUM EQUITY CARD */}
          <View style={styles.equityCard}>
            <View style={styles.equityTopRow}>
               <Text style={styles.equityLabel}>Trading Equity</Text>
               <MaterialIcons name="account-balance-wallet" size={20} color="#93C5FD" />
            </View>

            <Text style={styles.equitySub}>Available Margin</Text>
            <Text style={styles.equityAmount}>{formatCurrency(balance)}</Text>

            <View style={styles.equityDivider} />

            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.equitySub}>Margin Used</Text>
                <Text style={styles.white}>{formatCurrency(totalInvestment)}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.equitySub}>Opening Balance</Text>
                <Text style={styles.white}>₳1,00,000.00</Text>
              </View>
            </View>
          </View>

          {/* HOLDINGS CARD */}
          <View style={styles.holdingsCard}>
            <Text style={styles.holdingsTitle}>Holdings Snapshot</Text>

            <View style={styles.holdingsRow}>
              <Text style={styles.holdingsLabel}>Total P&L</Text>
              <View style={[styles.pnlBadge, { backgroundColor: pnl >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
                <Text style={[styles.pnlText, { color: pnl >= 0 ? '#059669' : '#DC2626' }]}>
                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnlPercent.toFixed(2)}%)
                </Text>
              </View>
            </View>

            <View style={styles.holdingsRow}>
              <Text style={styles.holdingsLabel}>Current Value</Text>
              <Text style={styles.holdingsValue}>{formatCurrency(currentValue)}</Text>
            </View>

            <View style={[styles.holdingsRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
              <Text style={styles.holdingsLabel}>Total Investment</Text>
              <Text style={styles.holdingsValue}>{formatCurrency(totalInvestment)}</Text>
            </View>
          </View>

          {/* WATCHLIST */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Watchlist</Text>
          </View>
          <Watchlist showSearch={true} limit={5} />
          
        </ScrollView>
      </SafeAreaView>
    </PageTransition>
  );
}

// ---------------- PREMIUM STYLES ----------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Unified FinTech Gray
    paddingHorizontal: 20,
  },
  
  /* --- HEADER --- */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === 'ios' ? 10 : 30,
    marginBottom: 25,
  },
  greeting: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  username: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  notificationBtn: {
    backgroundColor: '#EFF6FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* --- SECTION HEADERS --- */
  sectionHeader: {
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  /* --- MARKET CARDS --- */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  marketCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    width: "48%",
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  marketLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  marketValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: 6,
  },
  badgeNeutral: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  neutralText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  /* --- EQUITY CARD (The Hero) --- */
  equityCard: {
    backgroundColor: "#0f62fe", // Deep brand blue
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#0f62fe',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  equityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  equityLabel: {
    color: "#EFF6FF",
    fontSize: 16,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  equityAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: 4,
    letterSpacing: 1,
  },
  equitySub: {
    color: "#93C5FD", // Light blue for contrast
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  equityDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 16,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  white: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  /* --- HOLDINGS CARD --- */
  holdingsCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  holdingsTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
    color: "#0F172A",
  },
  holdingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  holdingsLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: '500',
  },
  holdingsValue: {
    fontWeight: "800",
    color: "#0F172A",
    fontSize: 15,
  },
  pnlBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pnlText: {
    fontWeight: "800",
    fontSize: 14,
  },
});