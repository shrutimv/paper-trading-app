import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTrading } from '../context/TradingContext';
import { API_BASE_URL } from '../src/config';
import Toast from './ui/Toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 48; 
const KNOB_SIZE = 54;
const SUCCESS_THRESHOLD = SLIDER_WIDTH - KNOB_SIZE - 8;

interface WatchlistProps { showSearch?: boolean; limit?: number; }
interface LivePriceData { price: number; change: number; changePercent: number; }

export default function Watchlist({ showSearch = true, limit = 5 }: WatchlistProps) {
  const router = useRouter();
  const { watchlist, addToWatchlist, removeFromWatchlist, balance, buyStock } = useTrading();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [liveData, setLiveData] = useState<Record<string, LivePriceData>>({});

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [quantity, setQuantity] = useState('1'); 

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const pan = useRef(new Animated.Value(0)).current;
  const lastHapticValue = useRef(0); 
  const confirmActionRef = useRef<() => void>();

  useEffect(() => {
    if (watchlist.length > 0) fetchLivePrices();
  }, [watchlist]);

  const handleConfirmBuy = async () => {
    const qty = parseInt(quantity);
    if (!selectedStock || isNaN(qty) || qty <= 0) {
      Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
      return;
    }

    const symbol = selectedStock.symbol;
    const shortName = selectedStock.shortname;
    const price = liveData[symbol]?.price;

    if (!price) {
      setToast({ visible: true, message: "Price unavailable.", type: 'error' });
      Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
      return;
    }

    const success = await buyStock(symbol, shortName, price, qty);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        visible: true,
        message: `Bought ${qty} shares of ${symbol.replace('.NS', '')}`,
        type: 'success'
      });
      setIsBuyModalOpen(false);
      pan.setValue(0);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToast({
        visible: true,
        message: "Insufficient Margin Available.",
        type: 'error'
      });
      Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
    }
  };

  confirmActionRef.current = handleConfirmBuy;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx >= 0 && gestureState.dx <= SUCCESS_THRESHOLD) {
          pan.setValue(gestureState.dx);

          // --- LIGHTER TICK VIBRATION ---
          // Increased threshold to 20px and switched to Light impact for a subtle feel
          if (Math.abs(gestureState.dx - lastHapticValue.current) > 20) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
            lastHapticValue.current = gestureState.dx;
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        lastHapticValue.current = 0; 
        if (gestureState.dx >= SUCCESS_THRESHOLD - 15) {
          Animated.spring(pan, { toValue: SUCCESS_THRESHOLD, useNativeDriver: true }).start(() => {
            confirmActionRef.current?.();
          });
        } else {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${text}&exchange=NSE&limit=5`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) { console.error("Search failed:", error); } finally { setIsSearching(false); }
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

  const openBuyModal = (stock: any) => {
    setSelectedStock(stock);
    setQuantity('1');
    pan.setValue(0);
    setIsBuyModalOpen(true);
  };

  const formatCurrency = (val: number) => "₳" + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const modalLivePrice = selectedStock ? liveData[selectedStock.symbol]?.price || 0 : 0;
  const requiredMargin = modalLivePrice * (parseInt(quantity) || 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watchlist</Text>

      {/* RENDER TOAST HERE: Outside ScrollView, inside main View to keep it floating centered */}
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />

      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9ca3af"
          />
          {isSearching && <ActivityIndicator size="small" color="#0f62fe" style={{ marginRight: 10 }} />}
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsDropdown}>
          {searchResults.map((item) => (
            <TouchableOpacity key={item.symbol} style={styles.resultItem} onPress={() => { addToWatchlist(item); setSearchResults([]); setSearchQuery(''); }}>
              <View>
                <Text style={styles.resultSymbol}>{item.symbol.replace('.NS', '')}</Text>
                <Text style={styles.resultName} numberOfLines={1}>{item.shortname}</Text>
              </View>
              <Ionicons name="add-circle" size={24} color="#0f62fe" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.listContainer}>
        {watchlist.slice(0, limit).map((stock) => {
          const data = liveData[stock.symbol];
          return (
            <TouchableOpacity key={stock.symbol} style={styles.stockCard} onPress={() => router.push(`/stock/${stock.symbol}`)}>
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
                    <Text style={[styles.change, { color: data.change >= 0 ? '#16a34a' : '#dc2626' }]}>
                      {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                    </Text>
                  </>
                ) : <ActivityIndicator size="small" color="#d1d5db" />}
              </View>
              <TouchableOpacity style={styles.buyBtn} onPress={() => openBuyModal(stock)}>
                <Text style={styles.buyText}>BUY</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={isBuyModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Buy {selectedStock?.symbol.replace('.NS', '')}</Text>
                <Text style={styles.modalPrice}>{formatCurrency(modalLivePrice)}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsBuyModalOpen(false)}>
                <Ionicons name="close-circle" size={32} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.counterRow}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <View style={styles.counterGroup}>
                <TouchableOpacity style={styles.countBtn} onPress={() => setQuantity(q => String(Math.max(1, (parseInt(q) || 0) - 1)))}>
                  <Ionicons name="remove" size={24} color="#111827" />
                </TouchableOpacity>
                
                <TextInput 
                   style={styles.quantityInput}
                   keyboardType="number-pad"
                   value={quantity}
                   onChangeText={setQuantity}
                   maxLength={5}
                />

                <TouchableOpacity style={styles.countBtn} onPress={() => setQuantity(q => String((parseInt(q) || 0) + 1))}>
                  <Ionicons name="add" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.marginBox}>
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Required Margin:</Text>
                <Text style={styles.marginValue}>{formatCurrency(requiredMargin)}</Text>
              </View>
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Available:</Text>
                <Text style={[styles.marginValue, { color: balance >= requiredMargin ? '#16a34a' : '#dc2626' }]}>
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>

            <View style={[styles.sliderTrack, balance < requiredMargin && { opacity: 0.5 }]}>
              <Text style={styles.sliderPlaceholder}>
                {balance >= requiredMargin ? 'SLIDE TO BUY' : 'INSUFFICIENT FUNDS'}
              </Text>
              
              {balance >= requiredMargin && (
                <Animated.View 
                  style={[styles.sliderKnob, { transform: [{ translateX: pan }] }]} 
                  {...panResponder.panHandlers}
                >
                  <Ionicons name="chevron-forward" size={28} color="#fff" />
                </Animated.View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, flex: 1 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  searchIcon: { padding: 12 },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: '#111' },
  resultsDropdown: { backgroundColor: '#fff', borderRadius: 12, padding: 8, marginBottom: 16, elevation: 3 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  resultSymbol: { fontSize: 15, fontWeight: '700', color: '#111' },
  resultName: { fontSize: 12, color: '#6b7280', maxWidth: 200 },
  listContainer: { gap: 10 },
  stockCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, elevation: 1 },
  stockInfo: { flex: 1 },
  stockSymbol: { fontSize: 16, fontWeight: '800', color: '#111' },
  stockName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end', marginRight: 16 },
  price: { fontSize: 15, fontWeight: '700', color: '#111' },
  change: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  buyBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  buyText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#111' },
  modalPrice: { fontSize: 18, fontWeight: '700', color: '#16a34a', marginTop: 4 },
  
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  inputLabel: { fontSize: 16, fontWeight: '700', color: '#4b5563' },
  counterGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 15, padding: 4 },
  countBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 1 },
  quantityInput: { fontSize: 20, fontWeight: '900', marginHorizontal: 15, width: 60, textAlign: 'center', color: '#111' },

  marginBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: '#e2e8f0' },
  marginRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  marginLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  marginValue: { fontSize: 16, fontWeight: '800', color: '#0f172a' },

  sliderTrack: { height: 64, backgroundColor: '#f3f4f6', borderRadius: 32, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  sliderPlaceholder: { fontSize: 15, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 },
  sliderKnob: { position: 'absolute', left: 5, width: KNOB_SIZE, height: KNOB_SIZE, backgroundColor: '#10b981', borderRadius: 27, justifyContent: 'center', alignItems: 'center', elevation: 4 }
});