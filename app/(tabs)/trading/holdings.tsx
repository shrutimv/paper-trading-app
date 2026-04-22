import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Holding, useTrading } from "../../../context/TradingContext";
import { API_BASE_URL } from "../../../src/config";

const formatCurrency = (val: number) => "₳" + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function HoldingsScreen() {
  const { holdings, watchlist, sellStock, totalInvestment } = useTrading();
  
  const [liveData, setLiveData] = useState<Record<string, { price: number, changePercent: number }>>({});
  const [isFetching, setIsFetching] = useState(false);

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [sellQuantity, setSellQuantity] = useState('1');

  useEffect(() => {
    const fetchLivePrices = async () => {
      if (holdings.length === 0 && watchlist.length === 0) return;
      setIsFetching(true);
      const newData: Record<string, { price: number, changePercent: number }> = {};
      const symbolsToFetch = Array.from(new Set([...holdings.map(h => h.symbol), ...watchlist.map(w => w.symbol)]));

      try {
        await Promise.all(
          symbolsToFetch.map(async (symbol) => {
            const response = await fetch(`${API_BASE_URL}/stock?symbol=${symbol}`);
            const data = await response.json();
            if (data && data.meta) {
              const price = data.meta.regularMarketPrice;
              const prevClose = data.meta.previousClose;
              newData[symbol] = { price, changePercent: ((price - prevClose) / prevClose) * 100 };
            }
          })
        );
        setLiveData(newData);
      } catch (error) {
        console.error("Failed to fetch live prices", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchLivePrices();
  }, [holdings, watchlist]);

  const currentValue = holdings.reduce((sum, item) => {
    const livePrice = liveData[item.symbol]?.price || item.averagePrice;
    return sum + (livePrice * item.quantity);
  }, 0);

  const totalPL = currentValue - totalInvestment;
  const totalPLPercent = totalInvestment > 0 ? ((totalPL / totalInvestment) * 100).toFixed(2) : "0.00";

  const openSellModal = (holding: Holding) => {
    setSelectedHolding(holding);
    setSellQuantity(holding.quantity.toString()); 
    setIsSellModalOpen(true);
  };

  const handleConfirmSell = async () => {
    if (!selectedHolding) return;
    const qty = parseInt(sellQuantity);
    
    if (isNaN(qty) || qty <= 0 || qty > selectedHolding.quantity) {
      Alert.alert("Invalid Quantity", `You only own ${selectedHolding.quantity} shares.`);
      return;
    }

    const livePrice = liveData[selectedHolding.symbol]?.price;
    if (!livePrice) {
      Alert.alert("Error", "Live price unavailable.");
      return;
    }

    const success = await sellStock(selectedHolding.symbol, livePrice, qty);
    if (success) {
      Alert.alert("Trade Successful! 💰", `Sold ${qty} shares of ${selectedHolding.symbol.replace('.NS', '')}`);
      setIsSellModalOpen(false);
    } else {
      Alert.alert("Trade Failed", "Something went wrong.");
    }
  };

  // --- MODAL EXPLICIT MATH CALCULATIONS ---
  const modalLivePrice = selectedHolding ? (liveData[selectedHolding.symbol]?.price || 0) : 0;
  const modalAvgPrice = selectedHolding?.averagePrice || 0;
  const qtyToSell = parseInt(sellQuantity) || 0;
  
  const investedInSoldShares = qtyToSell * modalAvgPrice;
  const totalValueReceived = qtyToSell * modalLivePrice;
  const projectedPL = totalValueReceived - investedInSoldShares;
  const isProfit = projectedPL >= 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Holdings</Text>
          {isFetching ? <ActivityIndicator size="small" color="#0f62fe" /> : <MaterialIcons name="search" size={22} color="#111827" />}
        </View>

        {/* MARKET CARDS */}
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

        {/* INSTRUMENTS LIST (NO MORE HORIZONTAL SCROLLING!) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.section}>Instruments ({holdings.length})</Text>
          <MaterialIcons name="tune" size={18} color="#6b7280" />
        </View>

        {holdings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>You don't own any stocks yet. Go to the dashboard to buy some!</Text>
          </View>
        ) : (
          <View style={styles.instrumentsContainer}>
            {holdings.map((item) => {
              const ltp = liveData[item.symbol]?.price || item.averagePrice;
              const netPercent = (((ltp - item.averagePrice) / item.averagePrice) * 100);
              const rowPnl = (ltp - item.averagePrice) * item.quantity;
              const isRowProfit = rowPnl >= 0;

              return (
                <View key={item.symbol} style={styles.instrumentCard}>
                  {/* Top Row: Info & LTP */}
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.instrumentSymbol}>{item.symbol.replace('.NS', '')}</Text>
                      <Text style={styles.instrumentSub}>
                        Qty: <Text style={{fontWeight: '700', color: '#111'}}>{item.quantity}</Text> • Avg: {formatCurrency(item.averagePrice)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.instrumentLtp}>{formatCurrency(ltp)}</Text>
                      <Text style={[styles.instrumentChange, isRowProfit ? styles.greenText : styles.redText]}>
                        {isRowProfit ? '+' : ''}{netPercent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Row: P&L and Action */}
                  <View style={styles.instrumentActionRow}>
                    <Text style={styles.instrumentPnlText}>
                      P&L: <Text style={isRowProfit ? styles.greenText : styles.redText}>{isRowProfit ? '+' : ''}{formatCurrency(rowPnl)}</Text>
                    </Text>
                    <TouchableOpacity style={styles.sellBtnSmall} onPress={() => openSellModal(item)}>
                      <Text style={styles.sellBtnSmallText}>SELL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.subText}>TOTAL INVESTMENT</Text>
              <Text style={styles.bold}>{formatCurrency(totalInvestment)}</Text>
            </View>
            <View>
              <Text style={styles.subText}>CURRENT VALUE</Text>
              <Text style={styles.bold}>{formatCurrency(currentValue)}</Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.subText}>TOTAL P&L</Text>
            <Text style={{ color: totalPL >= 0 ? "#16a34a" : "#ef4444", fontWeight: "800", fontSize: 18 }}>
              {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)} ({totalPL >= 0 ? '+' : ''}{totalPLPercent}%)
            </Text>
          </View>
        </View>

        {/* QUICK WATCHLIST */}
        <View style={styles.rowBetween}>
          <Text style={styles.section}>Quick Watchlist</Text>
        </View>

        {watchlist.length === 0 ? (
          <Text style={{ color: '#6b7280', fontStyle: 'italic', marginTop: 10 }}>Your watchlist is empty.</Text>
        ) : (
          watchlist.slice(0, 5).map((item) => {
            const data = liveData[item.symbol];
            const isUp = data?.changePercent >= 0;

            return (
              <View key={item.symbol} style={styles.stockRow}>
                <View>
                  <Text style={styles.stockName}>{item.symbol.replace('.NS', '')}</Text>
                  <Text style={styles.stockSub} numberOfLines={1}>{item.shortname}</Text>
                </View>
                <View style={styles.stockRight}>
                  {data ? (
                    <>
                      <Text style={styles.stockPrice}>{formatCurrency(data.price)}</Text>
                      <Text style={[styles.stockChange, isUp ? styles.greenText : styles.redText]}>
                        {isUp ? '+' : ''}{data.changePercent.toFixed(2)}%
                      </Text>
                    </>
                  ) : <ActivityIndicator size="small" color="#d1d5db" />}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ========================================= */}
      {/* THE SELL PAD MODAL (WITH EXPLICIT MATH)   */}
      {/* ========================================= */}
      <Modal visible={isSellModalOpen} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Sell {selectedHolding?.symbol.replace('.NS', '')}</Text>
                <Text style={styles.modalSub}>LTP: <Text style={{fontWeight: '800', color: '#111'}}>{formatCurrency(modalLivePrice)}</Text></Text>
              </View>
              <TouchableOpacity onPress={() => setIsSellModalOpen(false)}>
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Quantity Input */}
            <View style={styles.inputGroup}>
              <View style={styles.rowBetween}>
                <Text style={styles.inputLabel}>Shares to Sell</Text>
                <Text style={styles.maxText}>Owned: {selectedHolding?.quantity}</Text>
              </View>
              <TextInput 
                style={[styles.numberInput, { color: '#ef4444' }]} 
                keyboardType="number-pad" 
                value={sellQuantity}
                onChangeText={setSellQuantity}
                maxLength={5}
              />
            </View>

            {/* THE EXPLICIT MATH BREAKDOWN */}
            <View style={styles.breakdownBox}>
              
              <Text style={styles.mathHeader}>Your Investment</Text>
              <View style={styles.mathRow}>
                <Text style={styles.mathEquation}>{formatCurrency(modalAvgPrice)} × {qtyToSell} shares</Text>
                <Text style={styles.mathResult}>{formatCurrency(investedInSoldShares)}</Text>
              </View>

              <View style={styles.dividerRow} />

              <Text style={styles.mathHeader}>Selling For (Live Price)</Text>
              <View style={styles.mathRow}>
                <Text style={styles.mathEquation}>{formatCurrency(modalLivePrice)} × {qtyToSell} shares</Text>
                <Text style={[styles.mathResult, { color: '#111', fontWeight: '800' }]}>{formatCurrency(totalValueReceived)}</Text>
              </View>

              <View style={[styles.dividerRow, { borderTopWidth: 2, borderTopColor: '#cbd5e1' }]} />

              {/* Dynamic P&L */}
              <View style={styles.mathRow}>
                <Text style={[styles.breakdownLabel, { fontSize: 16, fontWeight: '700' }]}>Estimated P&L:</Text>
                <Text style={[styles.breakdownValue, { color: isProfit ? '#16a34a' : '#ef4444', fontWeight: '900', fontSize: 18 }]}>
                  {isProfit ? '+' : ''}{formatCurrency(projectedPL)}
                </Text>
              </View>
            </View>

            {/* Full Width Confirm Button */}
            <TouchableOpacity style={styles.fullWidthBtn} onPress={handleConfirmSell}>
              <Text style={styles.fullWidthBtnText}>CONFIRM SELL</Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111" },
  section: { fontSize: 14, fontWeight: "700", marginVertical: 12, color: '#4b5563' },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  marketCard: { backgroundColor: "#fff", padding: 14, borderRadius: 12, width: "48%", elevation: 1 },
  marketLabel: { fontSize: 12, color: "#6b7280" },
  marketValue: { fontSize: 16, fontWeight: "700", marginVertical: 4 },
  green: { color: "#16a34a", fontSize: 12, fontWeight: '600' },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  
  // NEW INSTRUMENT CARD STYLES
  instrumentsContainer: { gap: 12, marginBottom: 20 },
  instrumentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  instrumentSymbol: { fontSize: 16, fontWeight: '800', color: '#111827' },
  instrumentSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  instrumentLtp: { fontSize: 16, fontWeight: '800', color: '#111827' },
  instrumentChange: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  instrumentActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  instrumentPnlText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  sellBtnSmall: { backgroundColor: '#fee2e2', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 8 },
  sellBtnSmallText: { color: '#ef4444', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  greenText: { color: "#16a34a", fontWeight: '700' },
  redText: { color: "#ef4444", fontWeight: '700' },
  
  emptyBox: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  emptyText: { color: '#6b7280', textAlign: 'center', fontStyle: 'italic' },

  summaryCard: { backgroundColor: "#e0f2fe", padding: 20, borderRadius: 16, marginVertical: 10, borderWidth: 1, borderColor: '#bae6fd' },
  subText: { fontSize: 12, color: "#0369a1", fontWeight: '600', marginBottom: 4 },
  bold: { fontWeight: "800", fontSize: 16, color: '#0f172a' },

  stockRow: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: 'center', elevation: 1 },
  stockName: { fontSize: 16, fontWeight: "800", color: "#111827" },
  stockSub: { fontSize: 12, color: "#6b7280", marginTop: 2, maxWidth: 180 },
  stockPrice: { fontSize: 15, fontWeight: "800", color: "#111827" },
  stockRight: { alignItems: "flex-end" },
  stockChange: { fontSize: 13, fontWeight: "700", marginTop: 2 },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111' },
  modalSub: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  maxText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  numberInput: { backgroundColor: '#fef2f2', borderRadius: 12, fontSize: 28, fontWeight: '800', padding: 12, textAlign: 'center', borderWidth: 1, borderColor: '#fecaca' },
  
  // Modal Math Breakdown Styles
  breakdownBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  mathHeader: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  mathRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  mathEquation: { fontSize: 14, color: '#475569', fontWeight: '500' },
  mathResult: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  dividerRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', marginVertical: 10 },
  breakdownLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  
  fullWidthBtn: { width: '100%', backgroundColor: '#ef4444', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  fullWidthBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});