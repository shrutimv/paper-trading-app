import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // <-- NEW: Imported Router
import { API_BASE_URL } from '../src/config'; 
import { useTrading } from '../context/TradingContext'; 

interface WatchlistProps { showSearch?: boolean; limit?: number; }
interface LivePriceData { price: number; change: number; changePercent: number; }

export default function Watchlist({ showSearch = true, limit = 5 }: WatchlistProps) {
  const router = useRouter(); // <-- NEW: Initialize Router
  
  // 1. PULL BALANCE & BUY FUNCTION FROM GLOBAL BANK
  const { watchlist, addToWatchlist, removeFromWatchlist, balance, buyStock } = useTrading();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [liveData, setLiveData] = useState<Record<string, LivePriceData>>({});

  // --- NEW: ORDER PAD STATE ---
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (watchlist.length > 0) fetchLivePrices();
  }, [watchlist]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${text}&exchange=NSE&limit=5`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchLivePrices = async () => {
    const newData: Record<string, LivePriceData> = {};
    try {
      await Promise.all(
        watchlist.slice(0, limit).map(async (stock) => {
          const response = await fetch(`${API_BASE_URL}/stock?symbol=${stock.symbol}`);
          const data = await response.json();
          if (data && data.meta) {
            const price = data.meta.regularMarketPrice;
            const prevClose = data.meta.previousClose;
            newData[stock.symbol] = { price, change: price - prevClose, changePercent: ((price - prevClose) / prevClose) * 100 };
          }
        })
      );
      setLiveData(newData);
    } catch (error) { console.error("Failed to fetch prices", error); }
  };

  const handleAddStock = (item: any) => {
    addToWatchlist(item);
    setSearchQuery('');
    setSearchResults([]);
  };

  // --- NEW: OPEN ORDER PAD ---
  const openBuyModal = (stock: any) => {
    setSelectedStock(stock);
    setQuantity('1'); // Reset to 1 every time they open it
    setIsBuyModalOpen(true);
  };

  // --- NEW: EXECUTE THE TRADE ---
  const handleConfirmBuy = async () => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid number of shares.");
      return;
    }

    const price = liveData[selectedStock.symbol]?.price;
    if (!price) {
      Alert.alert("Error", "Live price is currently unavailable.");
      return;
    }

    // Call the global buyStock function!
    const success = await buyStock(selectedStock.symbol, selectedStock.shortname, price, qty);
    
    if (success) {
      Alert.alert("Trade Successful! 🎉", `You bought ${qty} shares of ${selectedStock.symbol.replace('.NS', '')}`);
      setIsBuyModalOpen(false);
    } else {
      Alert.alert("Trade Failed ❌", "Insufficient Margin Available for this trade.");
    }
  };

  const formatCurrency = (val: number) => "₹" + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calculate Required Margin for the Modal dynamically
  const modalLivePrice = selectedStock ? liveData[selectedStock.symbol]?.price || 0 : 0;
  const requiredMargin = modalLivePrice * (parseInt(quantity) || 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watchlist</Text>

      {/* SEARCH BAR */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks (e.g., TCS)..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9ca3af"
          />
          {isSearching && <ActivityIndicator size="small" color="#0f62fe" style={{ marginRight: 10 }} />}
        </View>
      )}

      {/* SEARCH RESULTS DROPDOWN */}
      {searchResults.length > 0 && (
        <View style={styles.resultsDropdown}>
          {searchResults.map((item) => (
            <TouchableOpacity key={item.symbol} style={styles.resultItem} onPress={() => handleAddStock(item)}>
              <View>
                <Text style={styles.resultSymbol}>{item.symbol.replace('.NS', '')}</Text>
                <Text style={styles.resultName} numberOfLines={1}>{item.shortname}</Text>
              </View>
              <Ionicons name="add-circle" size={24} color="#0f62fe" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* TRACKED STOCKS LIST */}
      <View style={styles.listContainer}>
        {watchlist.length === 0 ? (
          <Text style={styles.emptyText}>Search and add stocks to track them here!</Text>
        ) : (
          watchlist.slice(0, limit).map((stock) => {
            const data = liveData[stock.symbol];
            const isUp = data?.change >= 0;

            return (
              // <-- NEW: Changed to TouchableOpacity to navigate to the Chart!
              <TouchableOpacity 
                key={stock.symbol} 
                style={styles.stockCard}
                onPress={() => router.push(`/stock/${stock.symbol}`)}
              >
                <TouchableOpacity onPress={() => removeFromWatchlist(stock.symbol)} style={{ marginRight: 12 }}>
                   <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>

                <View style={styles.stockInfo}>
                  <Text style={styles.stockSymbol}>{stock.symbol.replace('.NS', '')}</Text>
                  <Text style={styles.stockName} numberOfLines={1}>{stock.shortname}</Text>
                </View>

                <View style={styles.priceContainer}>
                  {data ? (
                    <>
                      <Text style={styles.price}>{formatCurrency(data.price)}</Text>
                      <Text style={[styles.change, { color: isUp ? '#16a34a' : '#dc2626' }]}>
                        {isUp ? '+' : ''}{data.changePercent.toFixed(2)}%
                      </Text>
                    </>
                  ) : <ActivityIndicator size="small" color="#d1d5db" />}
                </View>

                {/* BUY BUTTON TRIGGERS MODAL */}
                <TouchableOpacity style={styles.buyBtn} onPress={() => openBuyModal(stock)}>
                  <Text style={styles.buyText}>BUY</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ========================================= */}
      {/* THE ORDER PAD MODAL (SLIDES UP FROM BOTTOM) */}
      {/* ========================================= */}
      <Modal visible={isBuyModalOpen} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Buy {selectedStock?.symbol.replace('.NS', '')}</Text>
                <Text style={styles.modalPrice}>{formatCurrency(modalLivePrice)}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsBuyModalOpen(false)}>
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Quantity Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity (Shares)</Text>
              <TextInput 
                style={styles.numberInput} 
                keyboardType="number-pad" 
                value={quantity}
                onChangeText={setQuantity}
                maxLength={5}
              />
            </View>

            {/* Margin Info */}
            <View style={styles.marginBox}>
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Margin Required:</Text>
                <Text style={styles.marginValue}>{formatCurrency(requiredMargin)}</Text>
              </View>
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Margin Available:</Text>
                <Text style={[styles.marginValue, { color: balance >= requiredMargin ? '#16a34a' : '#dc2626' }]}>
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity 
              style={[styles.confirmBtn, balance < requiredMargin && styles.confirmBtnDisabled]} 
              onPress={handleConfirmBuy}
              disabled={balance < requiredMargin}
            >
              <Text style={styles.confirmBtnText}>
                {balance >= requiredMargin ? 'SWIPE TO BUY' : 'INSUFFICIENT FUNDS'}
              </Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { marginTop: 10 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  searchIcon: { padding: 12 },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: '#111' },
  resultsDropdown: { backgroundColor: '#fff', borderRadius: 12, padding: 8, marginBottom: 16, elevation: 3 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  resultSymbol: { fontSize: 15, fontWeight: '700', color: '#111' },
  resultName: { fontSize: 12, color: '#6b7280', maxWidth: 200 },
  listContainer: { gap: 10 },
  emptyText: { color: '#6b7280', textAlign: 'center', padding: 20, fontStyle: 'italic' },
  stockCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, elevation: 1 },
  stockInfo: { flex: 1 },
  stockSymbol: { fontSize: 16, fontWeight: '800', color: '#111' },
  stockName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end', marginRight: 16 },
  price: { fontSize: 15, fontWeight: '700', color: '#111' },
  change: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  buyBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  buyText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111' },
  modalPrice: { fontSize: 18, fontWeight: '700', color: '#16a34a', marginTop: 4 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  numberInput: { backgroundColor: '#f3f4f6', borderRadius: 12, fontSize: 24, fontWeight: '800', padding: 16, textAlign: 'center', color: '#111' },
  marginBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  marginRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  marginLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  marginValue: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  confirmBtn: { backgroundColor: '#2563eb', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#94a3b8' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});