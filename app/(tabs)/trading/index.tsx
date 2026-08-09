import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
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

export interface IpoItem {
  id: string;
  name: string;
  symbol: string;
  priceBand: string;
  cutoffPrice: number;
  lotSize: number;
  minInvestment: number;
  issueSize: string;
  dates: string;
  gmp: string;
  gmpPositive: boolean;
  subscription: string;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
}

export interface IpoApplication {
  id: string;
  ipoId: string;
  name: string;
  symbol: string;
  lots: number;
  shares: number;
  amountBlocked: number;
  bidPrice: number;
  appliedDate: string;
  allotmentDate: string;
  status: 'BID_PLACED' | 'ALLOTTED' | 'NOT_ALLOTTED';
}

const IPO_DATA: IpoItem[] = [
  {
    id: 'ipo-swiggy',
    name: 'Swiggy Limited',
    symbol: 'SWIGGY',
    priceBand: '₹371 - ₹390',
    cutoffPrice: 390,
    lotSize: 38,
    minInvestment: 14820,
    issueSize: '₹11,327 Cr',
    dates: '06 Nov - 08 Nov',
    gmp: '+₹25 (+6.4%)',
    gmpPositive: true,
    subscription: '3.59x',
    status: 'OPEN',
  },
  {
    id: 'ipo-hyundai',
    name: 'Hyundai Motor India Ltd',
    symbol: 'HYUNDAI',
    priceBand: '₹1,865 - ₹1,960',
    cutoffPrice: 1960,
    lotSize: 7,
    minInvestment: 13720,
    issueSize: '₹27,870 Cr',
    dates: '15 Oct - 17 Oct',
    gmp: '+₹65 (+3.3%)',
    gmpPositive: true,
    subscription: '2.37x',
    status: 'OPEN',
  },
  {
    id: 'ipo-ntpc',
    name: 'NTPC Green Energy Ltd',
    symbol: 'NTPCGREEN',
    priceBand: '₹102 - ₹108',
    cutoffPrice: 108,
    lotSize: 138,
    minInvestment: 14904,
    issueSize: '₹10,000 Cr',
    dates: '19 Nov - 22 Nov',
    gmp: '+₹18 (+16.7%)',
    gmpPositive: true,
    subscription: '8.40x',
    status: 'UPCOMING',
  },
  {
    id: 'ipo-ather',
    name: 'Ather Energy Ltd',
    symbol: 'ATHER',
    priceBand: '₹310 - ₹325',
    cutoffPrice: 325,
    lotSize: 46,
    minInvestment: 14950,
    issueSize: '₹4,500 Cr',
    dates: 'Upcoming (Q4)',
    gmp: '+₹52 (+16.0%)',
    gmpPositive: true,
    subscription: '5.10x',
    status: 'UPCOMING',
  },
  {
    id: 'ipo-bajaj',
    name: 'Bajaj Housing Finance Ltd',
    symbol: 'BAJAJHFL',
    priceBand: '₹66 - ₹70',
    cutoffPrice: 70,
    lotSize: 214,
    minInvestment: 14980,
    issueSize: '₹6,560 Cr',
    dates: '09 Sep - 11 Sep',
    gmp: '+₹75 (+107%)',
    gmpPositive: true,
    subscription: '67.4x',
    status: 'CLOSED',
  },
];

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

const STORAGE_KEY_IPOS = '@papertrade:ipoApplications';

export default function TradingDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const { balance, holdings, buyStock, sellStock, totalInvestment, setHoldings, setBalance } = useTrading();
  const { xp, proMode, addXp } = useGamification();

  // Gamification states
  const limitUnlocked = proMode || xp >= 500;
  const stopLossUnlocked = proMode || xp >= 1500;
  const intradayUnlocked = proMode || xp >= 3000;

  // Tabs & Search States
  const [activeSubtab, setActiveSubtab] = useState<'recommendations' | 'ipos' | 'gainers' | 'climbers' | 'losers' | 'etfs'>('recommendations');
  const [ipoTab, setIpoTab] = useState<'live' | 'myBids'>('live');
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

  // IPO States
  const [isIpoModalOpen, setIsIpoModalOpen] = useState(false);
  const [selectedIpo, setSelectedIpo] = useState<IpoItem | null>(null);
  const [ipoLots, setIpoLots] = useState(1);
  const [useCutoff, setUseCutoff] = useState(true);
  const [myApplications, setMyApplications] = useState<IpoApplication[]>([]);
  
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'loading' | 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const pan = useRef(new Animated.Value(0)).current;
  const lastHapticValue = useRef(0);
  const confirmActionRef = useRef<(() => void) | null>(null);

  const formatCurrency = (value: number) => {
    return "₹" + (value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  };

  useEffect(() => {
    loadIpoApplications();
  }, []);

  const loadIpoApplications = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_IPOS);
      if (stored) {
        setMyApplications(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load IPO applications", e);
    }
  };

  const saveIpoApplications = async (apps: IpoApplication[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_IPOS, JSON.stringify(apps));
    } catch (e) {
      console.warn("Failed to save IPO applications", e);
    }
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
      price: stock.price,
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
    const livePrice = selectedStock.price || 100;

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

  // Simulate Market Close (3:30 PM Square-Off for MIS)
  const handleMarketCloseSimulation = async () => {
    const misHoldings = holdings.filter(h => h.productType === 'mis');
    if (misHoldings.length === 0) {
      setToast({
        visible: true,
        message: "No open intraday MIS positions to square off.",
        type: 'success'
      });
      return;
    }

    Alert.alert(
      "Simulate 3:30 PM Auto Square-Off",
      `Are you sure you want to trigger 3:30 PM market close? All ${misHoldings.length} MIS intraday positions will be automatically squared off at current market prices.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Auto Square-Off", 
          style: "destructive",
          onPress: async () => {
            let totalRealized = 0;
            for (const pos of misHoldings) {
              await sellStock(pos.symbol, pos.averagePrice, pos.quantity, 'mis');
              totalRealized += pos.quantity;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setToast({
              visible: true,
              message: `3:30 PM Square-Off Complete: ${totalRealized} MIS shares closed.`,
              type: 'success'
            });
          }
        }
      ]
    );
  };

  // --- IPO BIDDING HANDLERS ---
  const openIpoBidModal = (ipo: IpoItem) => {
    setSelectedIpo(ipo);
    setIpoLots(1);
    setUseCutoff(true);
    setIsIpoModalOpen(true);
  };

  const handleApplyIpo = async () => {
    if (!selectedIpo) return;
    const totalAmount = ipoLots * selectedIpo.minInvestment;

    if (balance < totalAmount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToast({
        visible: true,
        message: "Insufficient balance to place IPO bid.",
        type: 'error',
      });
      return;
    }

    // Deduct blocked amount from balance
    setBalance(prev => prev - totalAmount);

    const newApp: IpoApplication = {
      id: `IPO-${Math.floor(100000 + Math.random() * 900000)}`,
      ipoId: selectedIpo.id,
      name: selectedIpo.name,
      symbol: selectedIpo.symbol,
      lots: ipoLots,
      shares: ipoLots * selectedIpo.lotSize,
      amountBlocked: totalAmount,
      bidPrice: selectedIpo.cutoffPrice,
      appliedDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      allotmentDate: 'Allotment in 3 Days',
      status: 'BID_PLACED',
    };

    const updated = [newApp, ...myApplications];
    setMyApplications(updated);
    await saveIpoApplications(updated);

    if (addXp) addXp(50); // XP reward for participating in IPO!

    setIsIpoModalOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast({
      visible: true,
      message: `IPO Bid Placed! App #${newApp.id} (+50 XP) 🚀`,
      type: 'success',
    });
  };

  const handleCancelIpoBid = (app: IpoApplication) => {
    Alert.alert(
      "Cancel IPO Application",
      `Are you sure you want to cancel your bid for ${app.name}? ${formatCurrency(app.amountBlocked)} will be immediately unblocked and refunded to your virtual cash balance.`,
      [
        { text: "Keep Bid", style: "cancel" },
        {
          text: "Cancel Bid",
          style: "destructive",
          onPress: async () => {
            setBalance(prev => prev + app.amountBlocked);
            const filtered = myApplications.filter(a => a.id !== app.id);
            setMyApplications(filtered);
            await saveIpoApplications(filtered);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setToast({
              visible: true,
              message: `Bid #${app.id} Cancelled. Refunded ${formatCurrency(app.amountBlocked)}`,
              type: 'success',
            });
          },
        },
      ]
    );
  };

  // Margin calculation for Buy Modal
  const modalLivePrice = selectedStock?.price || 100;
  const tradePrice = orderType === 'limit' ? parseFloat(limitPrice) || modalLivePrice : modalLivePrice;
  const tradeValue = tradePrice * (parseInt(quantity) || 0);
  const requiredMargin = productType === 'mis' ? tradeValue * 0.20 : tradeValue;

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
              { id: 'ipos', label: '🚀 IPOs & Bids' },
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

          {/* 4. SUBTAB LISTINGS */}
          {activeSubtab === 'ipos' ? (
            /* --- IPO SECTION --- */
            <View style={styles.listSection}>
              {/* IPO Sub-toggle */}
              <View style={styles.ipoNavRow}>
                <TouchableOpacity 
                  style={[styles.ipoNavBtn, ipoTab === 'live' && styles.ipoNavBtnActive]}
                  onPress={() => setIpoTab('live')}
                >
                  <Text style={[styles.ipoNavText, ipoTab === 'live' && styles.ipoNavTextActive]}>
                    🔥 Live & Upcoming ({IPO_DATA.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.ipoNavBtn, ipoTab === 'myBids' && styles.ipoNavBtnActive]}
                  onPress={() => setIpoTab('myBids')}
                >
                  <Text style={[styles.ipoNavText, ipoTab === 'myBids' && styles.ipoNavTextActive]}>
                    📋 My Bids ({myApplications.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {ipoTab === 'live' ? (
                /* LIVE IPOS LIST */
                IPO_DATA.map((ipo) => {
                  const isOpen = ipo.status === 'OPEN';
                  const isUpcoming = ipo.status === 'UPCOMING';
                  return (
                    <View key={ipo.id} style={styles.ipoCard}>
                      <View style={styles.ipoHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ipoTitle}>{ipo.name}</Text>
                          <Text style={styles.ipoDates}>{ipo.dates}</Text>
                        </View>
                        <View style={[
                          styles.ipoStatusBadge,
                          isOpen ? styles.ipoStatusOpen : isUpcoming ? styles.ipoStatusUpcoming : styles.ipoStatusClosed
                        ]}>
                          <Text style={[
                            styles.ipoStatusText,
                            isOpen ? styles.ipoStatusTextOpen : isUpcoming ? styles.ipoStatusTextUpcoming : styles.ipoStatusTextClosed
                          ]}>
                            {isOpen ? '🟢 BID OPEN' : isUpcoming ? '🟡 UPCOMING' : '🟣 CLOSED'}
                          </Text>
                        </View>
                      </View>

                      {/* KEY METRICS GRID */}
                      <View style={styles.ipoMetricsGrid}>
                        <View style={styles.ipoMetricCol}>
                          <Text style={styles.ipoMetricLabel}>Price Band</Text>
                          <Text style={styles.ipoMetricVal}>{ipo.priceBand}</Text>
                        </View>
                        <View style={styles.ipoMetricCol}>
                          <Text style={styles.ipoMetricLabel}>Min Investment</Text>
                          <Text style={styles.ipoMetricVal}>{formatCurrency(ipo.minInvestment)}</Text>
                        </View>
                        <View style={styles.ipoMetricCol}>
                          <Text style={styles.ipoMetricLabel}>Est. GMP Gain</Text>
                          <Text style={[styles.ipoMetricVal, { color: '#16a34a' }]}>{ipo.gmp}</Text>
                        </View>
                      </View>

                      {/* SUBSCRIPTION PROGRESS */}
                      <View style={styles.ipoSubRow}>
                        <Text style={styles.ipoSubText}>Subscription: <Text style={{ fontWeight: '800', color: colors.text }}>{ipo.subscription}</Text></Text>
                        <Text style={styles.ipoSubText}>Issue: <Text style={{ fontWeight: '700' }}>{ipo.issueSize}</Text></Text>
                      </View>

                      {/* ACTION BUTTON */}
                      {isOpen ? (
                        <TouchableOpacity 
                          style={styles.ipoApplyBtn}
                          onPress={() => openIpoBidModal(ipo)}
                        >
                          <Ionicons name="rocket-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.ipoApplyBtnText}>Apply for IPO ({ipo.lotSize} Shares / Lot)</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.ipoUpcomingBanner}>
                          <Text style={styles.ipoUpcomingBannerText}>
                            {isUpcoming ? '🔔 Bidding opens soon • Add to Watchlist' : 'Closed for subscription'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                /* MY IPO APPLICATIONS LIST */
                myApplications.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyText}>You haven't placed any IPO bids yet.</Text>
                    <TouchableOpacity 
                      style={[styles.ipoNavBtnActive, { paddingHorizontal: 16, paddingVertical: 8, marginTop: 12, borderRadius: 10 }]}
                      onPress={() => setIpoTab('live')}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Browse Live IPOs</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  myApplications.map((app) => (
                    <View key={app.id} style={styles.ipoAppCard}>
                      <View style={styles.ipoHeaderRow}>
                        <View>
                          <Text style={styles.ipoTitle}>{app.name}</Text>
                          <Text style={styles.ipoAppId}>Application #{app.id} • {app.appliedDate}</Text>
                        </View>
                        <View style={[styles.ipoStatusBadge, styles.ipoStatusOpen]}>
                          <Text style={[styles.ipoStatusText, styles.ipoStatusTextOpen]}>BID PLACED</Text>
                        </View>
                      </View>

                      <View style={[styles.ipoMetricsGrid, { marginVertical: 10 }]}>
                        <View style={styles.ipoMetricCol}>
                          <Text style={styles.ipoMetricLabel}>Lots Applied</Text>
                          <Text style={styles.ipoMetricVal}>{app.lots} ({app.shares} sh)</Text>
                        </View>
                        <View style={styles.ipoMetricCol}>
                          <Text style={styles.ipoMetricLabel}>Bid Price</Text>
                          <Text style={styles.ipoMetricVal}>{formatCurrency(app.bidPrice)}</Text>
                        </View>
                        <View style={styles.ipoMetricCol}>
                          <Text style={styles.ipoMetricLabel}>Amount Blocked</Text>
                          <Text style={[styles.ipoMetricVal, { color: '#2563eb' }]}>{formatCurrency(app.amountBlocked)}</Text>
                        </View>
                      </View>

                      <View style={styles.ipoAppActionRow}>
                        <Text style={styles.ipoAllotmentText}>⏳ {app.allotmentDate}</Text>
                        <TouchableOpacity 
                          style={styles.cancelBidBtn}
                          onPress={() => handleCancelIpoBid(app)}
                        >
                          <Text style={styles.cancelBidText}>Cancel Bid & Refund</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )
              )}
            </View>
          ) : (
            /* STOCK SUBTAB LISTINGS */
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
          )}

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

        {/* 6. ADVANCED TRADING BUY MODAL */}
        <Modal visible={isBuyModalOpen} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedStock?.symbol?.replace('.NS', '')}</Text>
                  <Text style={styles.modalSub}>{selectedStock?.shortname}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsBuyModalOpen(false)}>
                  <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* CNC vs MIS Selection */}
              <View style={styles.segmentRow}>
                <TouchableOpacity 
                  style={[styles.segmentBtn, productType === 'cnc' && styles.segmentBtnActive]}
                  onPress={() => setProductType('cnc')}
                >
                  <Text style={[styles.segmentBtnText, productType === 'cnc' && styles.segmentBtnTextActive]}>
                    Longterm (CNC)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.segmentBtn, 
                    productType === 'mis' && styles.segmentBtnActive,
                    !intradayUnlocked && { opacity: 0.4 }
                  ]}
                  onPress={() => intradayUnlocked ? setProductType('mis') : null}
                >
                  <Text style={[styles.segmentBtnText, productType === 'mis' && styles.segmentBtnTextActive]}>
                    {intradayUnlocked ? "Intraday (MIS 5x)" : "🔒 MIS (Gold)"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Market vs Limit Order Selection */}
              <View style={styles.segmentRow}>
                <TouchableOpacity 
                  style={[styles.segmentBtn, orderType === 'market' && styles.segmentBtnActive]}
                  onPress={() => setOrderType('market')}
                >
                  <Text style={[styles.segmentBtnText, orderType === 'market' && styles.segmentBtnTextActive]}>
                    Market Order
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.segmentBtn, 
                    orderType === 'limit' && styles.segmentBtnActive,
                    !limitUnlocked && { opacity: 0.4 }
                  ]}
                  onPress={() => limitUnlocked ? setOrderType('limit') : null}
                >
                  <Text style={[styles.segmentBtnText, orderType === 'limit' && styles.segmentBtnTextActive]}>
                    {limitUnlocked ? "Limit Order" : "🔒 Limit (Bronze)"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quantity Counter */}
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

        {/* 7. IPO BIDDING MODAL */}
        <Modal visible={isIpoModalOpen} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedIpo?.name}</Text>
                  <Text style={styles.modalSub}>Price Band: {selectedIpo?.priceBand}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsIpoModalOpen(false)}>
                  <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* LOT SELECTOR */}
              <View style={styles.counterRow}>
                <View>
                  <Text style={styles.inputLabel}>Number of Lots</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {selectedIpo ? ipoLots * selectedIpo.lotSize : 0} Shares ({selectedIpo?.lotSize} shares/lot)
                  </Text>
                </View>

                <View style={styles.counterGroup}>
                  <TouchableOpacity 
                    style={styles.countBtn} 
                    onPress={() => setIpoLots(l => Math.max(1, l - 1))}
                  >
                    <Ionicons name="remove" size={22} color={colors.text} />
                  </TouchableOpacity>
                  
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, paddingHorizontal: 14 }}>
                    {ipoLots}
                  </Text>

                  <TouchableOpacity 
                    style={styles.countBtn} 
                    onPress={() => setIpoLots(l => Math.min(10, l + 1))}
                  >
                    <Ionicons name="add" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CUT-OFF TOGGLE */}
              <TouchableOpacity 
                style={[styles.optionSection, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setUseCutoff(!useCutoff)}
              >
                <View>
                  <Text style={styles.sectionLabel}>Apply at Cut-Off Price</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    Bid at highest price (₹{selectedIpo?.cutoffPrice}) for highest allotment probability
                  </Text>
                </View>
                <Ionicons 
                  name={useCutoff ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={useCutoff ? colors.accent : colors.textSecondary} 
                />
              </TouchableOpacity>

              {/* MARGIN BREAKDOWN */}
              <View style={styles.marginBox}>
                <View style={styles.marginRow}>
                  <Text style={styles.marginLabel}>Total Amount to Block:</Text>
                  <Text style={[styles.marginValue, { color: '#2563eb', fontSize: 18 }]}>
                    {selectedIpo ? formatCurrency(ipoLots * selectedIpo.minInvestment) : '₹0'}
                  </Text>
                </View>
                <View style={styles.marginRow}>
                  <Text style={styles.marginLabel}>Available Balance:</Text>
                  <Text style={[styles.marginValue, { color: balance >= (selectedIpo ? ipoLots * selectedIpo.minInvestment : 0) ? '#16a34a' : '#dc2626' }]}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
              </View>

              {/* SUBMIT BUTTON */}
              <TouchableOpacity 
                style={[
                  styles.ipoApplyModalBtn,
                  balance < (selectedIpo ? ipoLots * selectedIpo.minInvestment : 0) && { opacity: 0.5 }
                ]}
                disabled={balance < (selectedIpo ? ipoLots * selectedIpo.minInvestment : 0)}
                onPress={handleApplyIpo}
              >
                <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.ipoApplyModalBtnText}>
                  {balance >= (selectedIpo ? ipoLots * selectedIpo.minInvestment : 0)
                    ? `Submit Bid & Block ${selectedIpo ? formatCurrency(ipoLots * selectedIpo.minInvestment) : ''}`
                    : 'Insufficient Balance'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </PageTransition>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    backgroundColor: '#dc2626',
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
    backgroundColor: isDark ? '#1D2433' : colors.card,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsDropdown: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  resultSymbol: { fontSize: 15, fontWeight: '800', color: colors.text },
  resultName: { fontSize: 12, color: colors.textSecondary, maxWidth: 180 },
  rowBuyBtn: { backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  rowBuyBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  subtabsContainer: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  subtabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subtabBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  subtabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  subtabBtnTextActive: {
    color: '#fff',
    fontWeight: '800',
  },

  listSection: {
    gap: 10,
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
    marginRight: 14,
  },
  stockPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  stockChangeText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  stockRowBuy: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stockRowBuyText: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 12,
  },

  // IPO Specific Styles
  ipoNavRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ipoNavBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  ipoNavBtnActive: {
    backgroundColor: colors.accent,
  },
  ipoNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  ipoNavTextActive: {
    color: '#fff',
    fontWeight: '800',
  },

  ipoCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 6,
  },
  ipoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ipoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  ipoDates: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  ipoStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ipoStatusOpen: { backgroundColor: 'rgba(34, 197, 94, 0.12)' },
  ipoStatusUpcoming: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  ipoStatusClosed: { backgroundColor: 'rgba(148, 163, 184, 0.15)' },
  ipoStatusText: { fontSize: 10, fontWeight: '800' },
  ipoStatusTextOpen: { color: '#16a34a' },
  ipoStatusTextUpcoming: { color: '#d97706' },
  ipoStatusTextClosed: { color: '#64748b' },

  ipoMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  ipoMetricCol: {},
  ipoMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  ipoMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  ipoSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  ipoSubText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ipoApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  ipoApplyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  ipoUpcomingBanner: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
    borderRadius: 10,
  },
  ipoUpcomingBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  ipoAppCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  ipoAppId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ipoAppActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  ipoAllotmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  cancelBidBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelBidText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },

  ipoApplyModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  ipoApplyModalBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  // Portfolio Segments
  portfolioContainer: {
    marginTop: 10,
  },
  portfolioSectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  portfolioRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
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
    fontSize: 10,
    fontWeight: '800',
  },
  portDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  squareOffBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  squareOffText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: colors.text,
    fontWeight: '800',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  countBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  quantityInput: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    minWidth: 50,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  numericTextInput: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'right',
  },
  optionSection: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  marginBox: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
    padding: 14,
    borderRadius: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marginLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  marginValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sliderTrack: {
    height: 58,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 6,
  },
  sliderPlaceholder: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  sliderKnob: {
    position: 'absolute',
    left: 2,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});