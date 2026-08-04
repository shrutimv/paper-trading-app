import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import PageTransition from "@/components/PageTransition";
import Toast from "../../../components/ui/Toast";
import { useTrading, Holding } from "../../../context/TradingContext";
import { useTheme } from "../../../context/ThemeContext";
import { useGamification } from "../../../context/GamificationContext";
import { API_BASE_URL } from "../../../src/config";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 48; 
const KNOB_SIZE = 54;
const SUCCESS_THRESHOLD = SLIDER_WIDTH - KNOB_SIZE - 8;

const SUBTAB_DATA = {
  recommendations: [
    { symbol: 'RELIANCE.NS', shortname: 'Reliance Industries', price: 2540.20, change: 18.5, changePercent: 0.73 },
    { symbol: 'TCS.NS', shortname: 'Tata Consultancy Services', price: 3410.50, change: 45.2, changePercent: 1.34 },
    { symbol: 'HDFCBANK.NS', shortname: 'HDFC Bank Ltd', price: 1650.00, change: -12.4, changePercent: -0.75 },
    { symbol: 'INFY.NS', shortname: 'Infosys Ltd', price: 1420.30, change: 22.1, changePercent: 1.58 },
  ],
  gainers: [
    { symbol: 'TATAMOTORS.NS', shortname: 'Tata Motors Ltd', price: 620.40, change: 35.80, changePercent: 6.12 },
    { symbol: 'ICICIBANK.NS', shortname: 'ICICI Bank Ltd', price: 980.10, change: 42.50, changePercent: 4.53 },
    { symbol: 'SBIN.NS', shortname: 'State Bank of India', price: 590.20, change: 18.40, changePercent: 3.22 },
  ],
  climbers: [
    { symbol: 'ZOMATO.NS', shortname: 'Zomato Ltd', price: 92.50, change: 6.80, changePercent: 7.93 },
    { symbol: 'ITC.NS', shortname: 'ITC Ltd', price: 440.60, change: 12.20, changePercent: 2.84 },
    { symbol: 'JIOFIN.NS', shortname: 'Jio Financial Services', price: 245.80, change: 9.15, changePercent: 3.87 },
  ],
  losers: [
    { symbol: 'WIPRO.NS', shortname: 'Wipro Ltd', price: 395.20, change: -14.80, changePercent: -3.61 },
    { symbol: 'AXISBANK.NS', shortname: 'Axis Bank Ltd', price: 940.30, change: -28.50, changePercent: -2.94 },
    { symbol: 'BHARTIARTL.NS', shortname: 'Bharti Airtel Ltd', price: 865.00, change: -22.40, changePercent: -2.52 },
  ],
  etfs: [
    { symbol: 'SETFNIF50.NS', shortname: 'SBI ETF Nifty 50', price: 215.40, change: 1.85, changePercent: 0.87 },
    { symbol: 'GOLDBEES.NS', shortname: 'Nippon India ETF Gold BeES', price: 54.20, change: 0.45, changePercent: 0.84 },
    { symbol: 'BANKBEES.NS', shortname: 'Nippon India ETF Bank BeES', price: 462.10, change: -3.40, changePercent: -0.73 },
  ]
};

export default function TradingDashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { balance, holdings, buyStock, sellStock, totalInvestment, setHoldings, setBalance } = useTrading();
  const { xp, proMode } = useGamification();

  // Gamification states
  const limitUnlocked = proMode || xp >= 500;
  const stopLossUnlocked = proMode || xp >= 1500;
  const intradayUnlocked = proMode || xp >= 3000;

  // Tabs & Search States
  const [activeSubtab, setActiveSubtab] = useState<'recommendations' | 'gainers' | 'climbers' | 'losers' | 'etfs'>('recommendations');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Buy Modal States
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [productType, setProductType] = useState<'cnc' | 'mis'>('cnc');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLossActive, setStopLossActive] = useState(false);
  const [stopLossTrigger, setStopLossTrigger] = useState('');
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  const pan = useRef(new Animated.Value(0)).current;
  const lastHapticValue = useRef(0);
  const confirmActionRef = useRef<(() => void) | null>(null);

  const formatCurrency = (value: number) => {
    return "₳" + value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  };

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

  const openBuyModal = (stock: any) => {
    setSelectedStock({
      symbol: stock.symbol,
      shortname: stock.shortname,
    });
    setQuantity('1');
    setProductType('cnc');
    setOrderType('market');
    setLimitPrice('');
    setStopLossActive(false);
    setStopLossTrigger('');
    pan.setValue(0);
    setIsBuyModalOpen(true);
  };

  const handleConfirmBuy = async () => {
    const qty = parseInt(quantity);
    if (!selectedStock || isNaN(qty) || qty <= 0) {
      Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
      return;
    }

    const symbol = selectedStock.symbol;
    const shortName = selectedStock.shortname;
    const livePrice = selectedStock.price || 100; // Fallback default price

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

  // Manual Position Square-Off
  const handleSquareOff = async (stock: Holding) => {
    const success = await sellStock(stock.symbol, stock.averagePrice, stock.quantity, stock.productType || 'cnc');
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        visible: true,
        message: `Squared off ${stock.quantity} shares of ${stock.symbol.replace('.NS', '')}`,
        type: 'success'
      });
    }
  };

  // Simulate end of day market close
  const handleMarketCloseSimulation = async () => {
    const misPositions = holdings.filter(h => h.productType === 'mis');
    if (misPositions.length === 0) {
      setToast({
        visible: true,
        message: "No active Intraday (MIS) positions to square off.",
        type: 'error'
      });
      return;
    }

    let netBalanceCredit = 0;
    for (const pos of misPositions) {
      // Simulate close price with a minor random change (+/- 1.5%)
      const closePrice = pos.averagePrice * (1 + (Math.random() * 0.03 - 0.015));
      const revenue = (closePrice * pos.quantity) - (pos.averagePrice * pos.quantity * 0.80);
      netBalanceCredit += revenue;
    }

    setBalance(prev => prev + netBalanceCredit);
    setHoldings(prev => prev.filter(h => h.productType !== 'mis'));
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast({
      visible: true,
      message: `Market Close Simulation Complete! Auto-squared ${misPositions.length} positions.`,
      type: 'success'
    });
  };

  const modalLivePrice = selectedStock ? selectedStock.price || 100 : 100;
  const calTradePrice = orderType === 'limit' ? parseFloat(limitPrice) || modalLivePrice : modalLivePrice;
  const calTradeValue = calTradePrice * (parseInt(quantity) || 0);
  const requiredMargin = productType === 'mis' ? calTradeValue * 0.20 : calTradeValue;

  return (
    <PageTransition>
      <SafeAreaView style={styles.safe}>
        
        <Toast 
          visible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          
          {/* HEADER SECTION */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>SIMULATOR</Text>
              <Text style={styles.username}>Trading Desk</Text>
            </View>
            <TouchableOpacity style={styles.simulateBtn} onPress={handleMarketCloseSimulation}>
              <Ionicons name="time-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.simulateBtnText}>End Day</Text>
            </TouchableOpacity>
          </View>

          {/* 1. AMOUNT IN BANK (PORTFOLIO WALLET CARD) */}
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <Text style={styles.walletLabel}>TOTAL BALANCE (MARGIN)</Text>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Live SIM</Text>
              </View>
            </View>
            <Text style={styles.walletAmount}>{formatCurrency(balance + totalInvestment)}</Text>
            
            <View style={styles.walletDivider} />

            <View style={styles.walletGrid}>
              <View>
                <Text style={styles.gridLabel}>Available Cash</Text>
                <Text style={styles.gridValue}>{formatCurrency(balance)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.gridLabel}>Invested Margin</Text>
                <Text style={styles.gridValue}>{formatCurrency(totalInvestment)}</Text>
              </View>
            </View>
          </View>

          {/* 2. PRIMARY SEARCH COMPONENT */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search stock ticker to trade (e.g. INFY)"
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="characters"
            />
            {isSearching && <ActivityIndicator color={colors.accent} />}
          </View>

          {searchResults.length > 0 && (
            <View style={styles.resultsDropdown}>
              {searchResults.map((item) => (
                <TouchableOpacity 
                  key={item.symbol} 
                  style={styles.resultItem} 
                  onPress={() => {
                    const price = item.price || 150; 
                    openBuyModal({ ...item, price });
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                >
                  <View>
                    <Text style={styles.resultSymbol}>{item.symbol.replace('.NS', '')}</Text>
                    <Text style={styles.resultName} numberOfLines={1}>{item.shortname}</Text>
                  </View>
                  <TouchableOpacity style={styles.rowBuyBtn} onPress={() => {
                    const price = item.price || 150;
                    openBuyModal({ ...item, price });
                    setSearchResults([]);
                    setSearchQuery('');
                  }}>
                    <Text style={styles.rowBuyBtnText}>BUY</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 3. DYNAMIC SUBTABS SELECTOR */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.subtabsContainer}
          >
            {[
              { id: 'recommendations', label: 'Recommendations' },
              { id: 'gainers', label: 'Top Return' },
              { id: 'climbers', label: 'Top Climb' },
              { id: 'losers', label: 'Top Loss' },
              { id: 'etfs', label: 'ETFs & Indices' }
            ].map((tab) => (
              <TouchableOpacity 
                key={tab.id}
                style={[styles.subtabBtn, activeSubtab === tab.id && styles.subtabBtnActive]}
                onPress={() => setActiveSubtab(tab.id as any)}
              >
                <Text style={[styles.subtabBtnText, activeSubtab === tab.id && styles.subtabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 4. SUBTAB STOCK LISTINGS */}
          <View style={styles.listSection}>
            {SUBTAB_DATA[activeSubtab].map((stock) => {
              const isUp = stock.changePercent >= 0;
              return (
                <View key={stock.symbol} style={styles.stockRowCard}>
                  <TouchableOpacity 
                    style={{ flex: 1 }} 
                    onPress={() => router.push(`/stock/${stock.symbol}`)}
                  >
                    <Text style={styles.stockSymbolText}>{stock.symbol.replace('.NS', '')}</Text>
                    <Text style={styles.stockNameText} numberOfLines={1}>{stock.shortname}</Text>
                  </TouchableOpacity>

                  <View style={styles.stockPriceCol}>
                    <Text style={styles.stockPriceText}>{formatCurrency(stock.price)}</Text>
                    <Text style={[styles.stockChangeText, { color: isUp ? '#16a34a' : '#dc2626' }]}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.stockRowBuy} onPress={() => openBuyModal(stock)}>
                    <Text style={styles.stockRowBuyText}>BUY</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* 5. PORTFOLIO SEGMENTS (POSITIONS & CNC HOLDINGS) */}
          <View style={styles.portfolioContainer}>
            
            {/* Open Positions (Intraday MIS) */}
            <Text style={styles.portfolioSectionHeader}>Active Positions (MIS Intraday)</Text>
            {holdings.filter(h => h.productType === 'mis').length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No active intraday positions open.</Text>
              </View>
            ) : (
              holdings.filter(h => h.productType === 'mis').map((pos) => (
                <View key={pos.symbol + "-mis"} style={styles.portfolioRowCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.portSymbol}>{pos.symbol.replace('.NS', '')}</Text>
                      <View style={[styles.miniBadge, { backgroundColor: 'rgba(230, 242, 255, 0.12)' }]}>
                        <Text style={[styles.miniBadgeText, { color: colors.accent }]}>MIS</Text>
                      </View>
                    </View>
                    <Text style={styles.portDetails}>Qty: {pos.quantity} • Avg: {formatCurrency(pos.averagePrice)}</Text>
                  </View>
                  <TouchableOpacity style={styles.squareOffBtn} onPress={() => handleSquareOff(pos)}>
                    <Text style={styles.squareOffText}>Square Off</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Demat Assets (CNC Delivery) */}
            <Text style={[styles.portfolioSectionHeader, { marginTop: 24 }]}>Demat Assets (CNC Holdings)</Text>
            {holdings.filter(h => (h.productType || 'cnc') === 'cnc').length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No settled long-term portfolio holdings.</Text>
              </View>
            ) : (
              holdings.filter(h => (h.productType || 'cnc') === 'cnc').map((pos) => (
                <View key={pos.symbol + "-cnc"} style={styles.portfolioRowCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.portSymbol}>{pos.symbol.replace('.NS', '')}</Text>
                      <View style={[styles.miniBadge, { backgroundColor: 'rgba(209, 250, 229, 0.12)' }]}>
                        <Text style={[styles.miniBadgeText, { color: '#10b981' }]}>CNC</Text>
                      </View>
                    </View>
                    <Text style={styles.portDetails}>Qty: {pos.quantity} • Avg: {formatCurrency(pos.averagePrice)}</Text>
                  </View>
                  <TouchableOpacity style={[styles.squareOffBtn, { borderColor: '#ef4444' }]} onPress={() => handleSquareOff(pos)}>
                    <Text style={[styles.squareOffText, { color: '#ef4444' }]}>Sell</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

          </View>

        </ScrollView>

        {/* 6. MODAL BUY SHEET */}
        <Modal visible={isBuyModalOpen} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Buy {selectedStock?.symbol.replace('.NS', '')}</Text>
                  <Text style={styles.modalPrice}>{formatCurrency(modalLivePrice)}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsBuyModalOpen(false)}>
                  <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {!limitUnlocked && (
                <View style={styles.bannerBox}>
                  <Text style={styles.bannerText}>
                    💡 Novice Mode Active. Earn 500 XP in quizzes to unlock Limit Orders & Stop-Loss protection!
                  </Text>
                </View>
              )}

              {/* Product Selection Tab Segment */}
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

              {/* Order Type Selection Tab Segment */}
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

              {/* Quantity Selection */}
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

              {/* Limit Price Input */}
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

              {/* Stop Loss (SL) Protection */}
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

              {/* Margin Calculations */}
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

              {/* Slide To Buy Track */}
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

      </SafeAreaView>
    </PageTransition>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === 'ios' ? 10 : 30,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  username: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    marginTop: 2,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626', // Warning Red
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  simulateBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  walletCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.isDark ? '#1D2433' : colors.card,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '800',
  },
  walletAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
    marginTop: 8,
  },
  walletDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  walletGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  
  resultsDropdown: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    elevation: 4,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  resultName: {
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  rowBuyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rowBuyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  subtabsContainer: {
    paddingBottom: 16,
  },
  subtabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subtabBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  subtabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  subtabBtnTextActive: {
    color: '#fff',
  },

  listSection: {
    gap: 12,
    marginBottom: 20,
  },
  stockRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockSymbolText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  stockNameText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stockPriceCol: {
    alignItems: 'flex-end',
    marginRight: 16,
  },
  stockPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  stockChangeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  stockRowBuy: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stockRowBuyText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },

  portfolioContainer: {
    marginTop: 10,
  },
  portfolioSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  portfolioRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  portSymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  portDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  squareOffBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  squareOffText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: 'bold',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 50, borderWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  modalPrice: { fontSize: 18, fontWeight: '700', color: colors.isDark ? '#34D399' : '#16a34a', marginTop: 4 },
  
  bannerBox: { backgroundColor: colors.isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  bannerText: { fontSize: 12, color: colors.accent, fontWeight: '600', lineHeight: 16 },

  optionSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  tabTrack: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 12, padding: 3, borderWidth: 0.5, borderColor: colors.border },
  tabSegment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabSegmentActive: { backgroundColor: colors.card, elevation: 1 },
  tabSegmentLocked: { opacity: 0.6 },
  tabSegmentText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  tabSegmentTextActive: { color: colors.text },

  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
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