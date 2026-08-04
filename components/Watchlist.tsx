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
import { useTheme } from '../context/ThemeContext';
import { useGamification } from '../context/GamificationContext';
import { API_BASE_URL } from '../src/config';
import Toast from './ui/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 48; 
const KNOB_SIZE = 54;
const SUCCESS_THRESHOLD = SLIDER_WIDTH - KNOB_SIZE - 8;

interface WatchlistProps { showSearch?: boolean; limit?: number; onBuyComplete?: () => void; }
interface LivePriceData { price: number; change: number; changePercent: number; }

export default function Watchlist({ showSearch = true, limit = 5, onBuyComplete }: WatchlistProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const { watchlist, addToWatchlist, removeFromWatchlist, balance, buyStock } = useTrading();
  const { xp, proMode } = useGamification();

  // Gamification Unlocking Thresholds
  const limitUnlocked = proMode || xp >= 500;
  const stopLossUnlocked = proMode || xp >= 1500;
  const intradayUnlocked = proMode || xp >= 3000;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [liveData, setLiveData] = useState<Record<string, LivePriceData>>({});
  
  // Modal Trading Settings States
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [productType, setProductType] = useState<'cnc' | 'mis'>('cnc'); // CNC = LongTerm, MIS = Intraday
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLossActive, setStopLossActive] = useState(false);
  const [stopLossTrigger, setStopLossTrigger] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  const pan = useRef(new Animated.Value(0)).current;
  const lastHapticValue = useRef(0);
  const confirmActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000);
    return () => clearInterval(interval);
  }, [watchlist]);

  const handleConfirmBuy = async () => {
    const qty = parseInt(quantity);
    if (!selectedStock || isNaN(qty) || qty <= 0) {
      Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
      return;
    }

    const symbol = selectedStock.symbol;
    const shortName = selectedStock.shortname;
    const livePrice = liveData[symbol]?.price;

    if (!livePrice) {
      setToast({ visible: true, message: "Price unavailable.", type: 'error' });
      Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
      return;
    }

    const tradePrice = orderType === 'limit' ? parseFloat(limitPrice) || livePrice : livePrice;
    const slVal = stopLossActive ? parseFloat(stopLossTrigger) || undefined : undefined;

    const success = await buyStock(symbol, shortName, tradePrice, qty, productType, slVal);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        visible: true,
        message: `Bought ${qty} shares of ${symbol.replace('.NS', '')} (${productType.toUpperCase()})`,
        type: 'success'
      });
      setIsBuyModalOpen(false);
      pan.setValue(0);
      if (onBuyComplete) onBuyComplete();
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
    setProductType('cnc');
    setOrderType('market');
    setLimitPrice('');
    setStopLossActive(false);
    setStopLossTrigger('');
    pan.setValue(0);
    setIsBuyModalOpen(true);
  };

  const modalLivePrice = selectedStock ? liveData[selectedStock.symbol]?.price || 0 : 0;
  
  // Margin calculation based on product types
  const tradePrice = orderType === 'limit' ? parseFloat(limitPrice) || modalLivePrice : modalLivePrice;
  const tradeValue = tradePrice * (parseInt(quantity) || 0);
  const requiredMargin = productType === 'mis' ? tradeValue * 0.20 : tradeValue; // 5x leverage for MIS

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watchlist</Text>

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />

      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search stock (e.g. INFOSYS)"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="characters"
          />
          {isSearching && <ActivityIndicator style={{ marginRight: 12 }} color={colors.accent} />}
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsDropdown}>
          {searchResults.map((item) => (
            <TouchableOpacity 
              key={item.symbol} 
              style={styles.resultItem} 
              onPress={() => {
                addToWatchlist(item);
                setSearchResults([]);
                setSearchQuery('');
              }}
            >
              <View>
                <Text style={styles.resultSymbol}>{item.symbol.replace('.NS', '')}</Text>
                <Text style={styles.resultName} numberOfLines={1}>{item.shortname}</Text>
              </View>
              <Ionicons name="add-circle" size={24} color={colors.accent} />
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
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Buy {selectedStock?.symbol.replace('.NS', '')}</Text>
                <Text style={styles.modalPrice}>{formatCurrency(modalLivePrice)}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsBuyModalOpen(false)}>
                <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Novice mode educational message */}
            {!limitUnlocked && (
              <View style={styles.bannerBox}>
                <Text style={styles.bannerText}>
                  💡 Novice Mode Active. Earn 500 XP in quizzes to unlock Limit Orders & Stop-Loss protection!
                </Text>
              </View>
            )}

            {/* Product Selection Tab Selector (Long-Term CNC vs Intraday MIS) */}
            <View style={styles.optionSection}>
              <Text style={styles.sectionLabel}>Product Type</Text>
              <View style={styles.tabTrack}>
                <TouchableOpacity 
                  style={[styles.tabSegment, productType === 'cnc' && styles.tabSegmentActive]}
                  onPress={() => setProductType('cnc')}
                >
                  <Text style={[styles.tabSegmentText, productType === 'cnc' && styles.tabSegmentTextActive]}>
                    Long-Term (CNC)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.tabSegment, 
                    productType === 'mis' && styles.tabSegmentActive,
                    !intradayUnlocked && styles.tabSegmentLocked
                  ]}
                  onPress={() => intradayUnlocked ? setProductType('mis') : null}
                >
                  <Text style={[styles.tabSegmentText, productType === 'mis' && styles.tabSegmentTextActive]}>
                    {intradayUnlocked ? 'Intraday (MIS 5x)' : '🔒 Intraday (Gold)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Order Type Selection Tab Selector (Market vs Limit) */}
            <View style={styles.optionSection}>
              <Text style={styles.sectionLabel}>Order Type</Text>
              <View style={styles.tabTrack}>
                <TouchableOpacity 
                  style={[styles.tabSegment, orderType === 'market' && styles.tabSegmentActive]}
                  onPress={() => setOrderType('market')}
                >
                  <Text style={[styles.tabSegmentText, orderType === 'market' && styles.tabSegmentTextActive]}>
                    Market
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.tabSegment, 
                    orderType === 'limit' && styles.tabSegmentActive,
                    !limitUnlocked && styles.tabSegmentLocked
                  ]}
                  onPress={() => limitUnlocked ? setOrderType('limit') : null}
                >
                  <Text style={[styles.tabSegmentText, orderType === 'limit' && styles.tabSegmentTextActive]}>
                    {limitUnlocked ? 'Limit Price' : '🔒 Limit (Bronze)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quantity Row */}
            <View style={styles.counterRow}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <View style={styles.counterGroup}>
                <TouchableOpacity style={styles.countBtn} onPress={() => setQuantity(q => String(Math.max(1, (parseInt(q) || 0) - 1)))}>
                  <Ionicons name="remove" size={24} color={colors.text} />
                </TouchableOpacity>
                
                <TextInput 
                   style={styles.quantityInput}
                   keyboardType="number-pad"
                   value={quantity}
                   onChangeText={setQuantity}
                   maxLength={5}
                />

                <TouchableOpacity style={styles.countBtn} onPress={() => setQuantity(q => String((parseInt(q) || 0) + 1))}>
                  <Ionicons name="add" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Limit Price Input Field */}
            {orderType === 'limit' && (
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Limit Price</Text>
                <TextInput
                  style={styles.numericTextInput}
                  keyboardType="numeric"
                  value={limitPrice}
                  onChangeText={setLimitPrice}
                  placeholder={String(modalLivePrice)}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}

            {/* Stop Loss (SL) Protection Feature */}
            {stopLossUnlocked ? (
              <View style={styles.optionSection}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}
                  onPress={() => setStopLossActive(!stopLossActive)}
                >
                  <Text style={styles.sectionLabel}>Add Stop-Loss Protection</Text>
                  <Ionicons 
                    name={stopLossActive ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={stopLossActive ? colors.accent : colors.textSecondary} 
                  />
                </TouchableOpacity>
                {stopLossActive && (
                  <View style={[styles.inputRow, { marginTop: 10 }]}>
                    <Text style={styles.inputLabel}>Trigger Price</Text>
                    <TextInput
                      style={styles.numericTextInput}
                      keyboardType="numeric"
                      value={stopLossTrigger}
                      onChangeText={setStopLossTrigger}
                      placeholder={String((modalLivePrice * 0.95).toFixed(1))}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.optionSection, { opacity: 0.5 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                  <Text style={styles.sectionLabel}>🔒 Stop-Loss Protection (Silver Rank)</Text>
                  <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
                </View>
              </View>
            )}

            {/* Margin Calculation Summary */}
            <View style={styles.marginBox}>
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Required Margin:</Text>
                <Text style={styles.marginValue}>{formatCurrency(requiredMargin)}</Text>
              </View>
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Available Balance:</Text>
                <Text style={[styles.marginValue, { color: balance >= requiredMargin ? '#16a34a' : '#dc2626' }]}>
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>

            {/* Swipe to Confirm Button */}
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

const getStyles = (colors: any) => StyleSheet.create({
  container: { marginTop: 10, flex: 1 },
  title: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  searchIcon: { padding: 12 },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: colors.text },
  resultsDropdown: { backgroundColor: colors.card, borderRadius: 12, padding: 8, marginBottom: 16, borderWidth: 1, borderColor: colors.border, elevation: 3, zIndex: 10 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  resultSymbol: { fontSize: 15, fontWeight: '700', color: colors.text },
  resultName: { fontSize: 12, color: colors.textSecondary, maxWidth: 200 },
  listContainer: { gap: 10 },
  stockCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, elevation: 1 },
  stockInfo: { flex: 1 },
  stockSymbol: { fontSize: 16, fontWeight: '800', color: colors.text },
  stockName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  priceContainer: { alignItems: 'flex-end', marginRight: 16 },
  price: { fontSize: 15, fontWeight: '700', color: colors.text },
  change: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  buyBtn: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  buyText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 50, borderWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  modalPrice: { fontSize: 18, fontWeight: '700', color: colors.isDark ? '#34D399' : '#16a34a', marginTop: 4 },
  
  bannerBox: { backgroundColor: colors.isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  bannerText: { fontSize: 12, color: colors.accent, fontWeight: '600', lineHeight: 16 },

  optionSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  tabTrack: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 12, padding: 3, borderWidth: 0.5, borderColor: colors.border },
  tabSegment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabSegmentActive: { backgroundColor: colors.card, elevation: 1 },
  tabSegmentLocked: { opacity: 0.6 },
  tabSegmentText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  tabSegmentTextActive: { color: colors.text },

  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  counterGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border, borderRadius: 12, padding: 3 },
  countBtn: { padding: 8, backgroundColor: colors.card, borderRadius: 9, elevation: 1 },
  quantityInput: { fontSize: 18, fontWeight: '900', marginHorizontal: 12, width: 50, textAlign: 'center', color: colors.text },

  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  numericTextInput: { fontSize: 16, fontWeight: '800', borderBottomWidth: 1.5, borderBottomColor: colors.accent, width: 100, textAlign: 'right', color: colors.text, paddingVertical: 4 },

  marginBox: { backgroundColor: colors.background, padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  marginRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  marginLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  marginValue: { fontSize: 15, fontWeight: '800', color: colors.text },

  sliderTrack: { height: 60, backgroundColor: colors.border, borderRadius: 30, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: colors.isDark ? '#334155' : '#CBD5E1' },
  sliderPlaceholder: { fontSize: 14, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1 },
  sliderKnob: { position: 'absolute', left: 4, width: 52, height: 52, backgroundColor: '#10B981', borderRadius: 26, justifyContent: 'center', alignItems: 'center', elevation: 4 }
});