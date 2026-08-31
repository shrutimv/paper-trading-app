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
  RefreshControl,
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
  type?: string;
  sector?: string;
  rating?: string;
  highlights?: string;
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

export interface ScreenerStock {
  symbol: string;
  shortname: string;
  price: number;
  change: number;
  changePercent: number;
  volumeMultiplier: string;
  catalyst: string;
  signal: string;
  score: number;
  entryZone: string;
  target1: number;
  target2: number;
  stopLoss: number;
  riskReward: string;
}

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

  // Main Top Segment Switcher
  const [mainTab, setMainTab] = useState<'screener' | 'ipos' | 'portfolio'>('screener');

  // Screener Filter Category
  const [screenerCategory, setScreenerCategory] = useState<'volume_shockers' | 'breakouts_52w' | 'golden_crossover' | 'oversold_rsi' | 'value_picks'>('volume_shockers');
  const [screenerData, setScreenerData] = useState<Record<string, ScreenerStock[]>>({});
  const [loadingScreener, setLoadingScreener] = useState(false);

  // Dynamic Live IPOs
  const [ipos, setIpos] = useState<IpoItem[]>([]);
  const [ipoTab, setIpoTab] = useState<'live' | 'myBids'>('live');
  const [loadingIpos, setLoadingIpos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search States
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

  // IPO Modal States
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
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      fetchLiveIpos(),
      fetchScreenerData(),
      loadIpoApplications(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const fetchLiveIpos = async () => {
    setLoadingIpos(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ipos`);
      const data = await res.json();
      if (data && data.ipos) {
        setIpos(data.ipos);
      }
    } catch (e) {
      console.warn("Failed fetching live IPOs", e);
    } finally {
      setLoadingIpos(false);
    }
  };

  const fetchScreenerData = async () => {
    setLoadingScreener(true);
    try {
      const res = await fetch(`${API_BASE_URL}/screener`);
      const data = await res.json();
      if (data && data.screener) {
        setScreenerData(data.screener);
      }
    } catch (e) {
      console.warn("Failed fetching screener data", e);
    } finally {
      setLoadingScreener(false);
    }
  };

  const loadIpoApplications = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_IPOS);
      if (stored) {
        setMyApplications(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed loading IPO applications", e);
    }
  };

  const saveIpoApplications = async (apps: IpoApplication[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_IPOS, JSON.stringify(apps));
    } catch (e) {
      console.warn("Failed saving IPO applications", e);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);

    const qLower = text.toLowerCase().trim();
    // 1. Search in dynamic IPO Registry (Ardee, Swiggy, Hyundai, Ather, etc.)
    const matchingIpos = ipos.filter(ipo => 
      ipo.name.toLowerCase().includes(qLower) || 
      ipo.symbol.toLowerCase().includes(qLower)
    ).map(ipo => ({
      symbol: ipo.symbol,
      shortname: ipo.name,
      price: ipo.cutoffPrice,
      isIpo: true,
      ipoData: ipo,
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${text}&exchange=NSE&limit=5`);
      const data = await response.json();
      const stockResults = (data.results || []).map((s: any) => ({ ...s, isIpo: false }));
      setSearchResults([...matchingIpos, ...stockResults]);
    } catch (error) { 
      console.error("Search failed:", error);
      setSearchResults(matchingIpos);
    } finally { 
      setIsSearching(false); 
    }
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

  const handleConfirmBuy = () => {
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

    // 1. INSTANT UI FEEDBACK (Close modal immediately & slide smoothly)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsBuyModalOpen(false);
    pan.setValue(0);

    setToast({
      visible: true,
      message: `Placing order for ${qty} shares of ${symbol.replace('.NS', '')}...`,
      type: 'loading'
    });

    // 2. ASYNC BACKGROUND PROCESSING
    (async () => {
      try {
        const success = await buyStock(symbol, shortName, tradePrice, qty, productType, slVal);
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setToast({
            visible: true,
            message: `Order Executed: ${qty} shares of ${symbol.replace('.NS', '')} bought (${productType.toUpperCase()})`,
            type: 'success'
          });
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setToast({
            visible: true,
            message: "Order Failed: Insufficient Margin Available.",
            type: 'error'
          });
        }
      } catch (err) {
        setToast({
          visible: true,
          message: "Order Failed: Connection Error.",
          type: 'error'
        });
      } finally {
        setTimeout(() => {
          setToast(t => ({ ...t, visible: false }));
        }, 3500);
      }
    })();
  };

  confirmActionRef.current = handleConfirmBuy;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const clamped = Math.max(0, Math.min(gestureState.dx, SUCCESS_THRESHOLD));
        pan.setValue(clamped);

        if (Math.abs(gestureState.dx - lastHapticValue.current) > 20) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
          lastHapticValue.current = gestureState.dx;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        lastHapticValue.current = 0; 
        if (gestureState.dx >= SUCCESS_THRESHOLD * 0.65) {
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

    if (addXp) addXp(50);

    setIsIpoModalOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast({
      visible: true,
      message: `IPO Bid Placed for ${selectedIpo.name}! (+50 XP)`,
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

  const currentScreenerList = screenerData[screenerCategory] || [];

  return (
    <PageTransition>
      <SafeAreaView style={styles.safe}>
        
        <Toast 
          visible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />

        <ScrollView 
          contentContainerStyle={{ paddingBottom: 120 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          
          {/* HEADER SECTION */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>MARKET INTELLIGENCE</Text>
              <Text style={styles.username}>Trading Desk</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity 
                style={styles.compareHeaderBtn}
                onPress={() => router.push('/compare')}
              >
                <Ionicons name="git-compare-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.compareHeaderBtnText}>Studio</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.simulateBtn} onPress={handleMarketCloseSimulation}>
                <Ionicons name="time-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.simulateBtnText}>End Day</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 1. PORTFOLIO WALLET CARD */}
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

          {/* 2. UNIFIED SEARCH BAR (STOCKS & UNLISTED IPOS) */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search stocks or IPOs (e.g. Ardee, Swiggy, INFY)"
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
                  key={item.symbol + (item.isIpo ? '-ipo' : '')} 
                  style={styles.resultItem} 
                  onPress={() => {
                    if (item.isIpo) {
                      openIpoBidModal(item.ipoData);
                    } else {
                      router.push(`/stock/${item.symbol}`);
                    }
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.resultSymbol}>{item.symbol.replace('.NS', '')}</Text>
                      {item.isIpo && (
                        <View style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#2563eb' }}>IPO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {item.isIpo ? `${item.shortname} • ${item.ipoData.priceBand}` : item.shortname}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.rowBuyBtn, item.isIpo && { backgroundColor: '#2563eb' }]} 
                    onPress={() => {
                      if (item.isIpo) {
                        openIpoBidModal(item.ipoData);
                      } else {
                        const price = item.price || 150;
                        openBuyModal({ ...item, price });
                      }
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.rowBuyBtnText}>{item.isIpo ? 'APPLY' : 'BUY'}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 3. MAIN TOP SEGMENTED NAV (REPLACES CLUTTERED BOTTOM BAR) */}
          <View style={styles.mainSegmentNav}>
            <TouchableOpacity 
              style={[styles.mainSegmentBtn, mainTab === 'screener' && styles.mainSegmentBtnActive]}
              onPress={() => setMainTab('screener')}
            >
              <Ionicons name="trending-up" size={16} color={mainTab === 'screener' ? '#fff' : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.mainSegmentText, mainTab === 'screener' && styles.mainSegmentTextActive]}>
                Top Movers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mainSegmentBtn, mainTab === 'ipos' && styles.mainSegmentBtnActive]}
              onPress={() => setMainTab('ipos')}
            >
              <Ionicons name="layers-outline" size={16} color={mainTab === 'ipos' ? '#fff' : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.mainSegmentText, mainTab === 'ipos' && styles.mainSegmentTextActive]}>
                IPO Hub
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mainSegmentBtn, mainTab === 'portfolio' && styles.mainSegmentBtnActive]}
              onPress={() => setMainTab('portfolio')}
            >
              <Ionicons name="briefcase-outline" size={16} color={mainTab === 'portfolio' ? '#fff' : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.mainSegmentText, mainTab === 'portfolio' && styles.mainSegmentTextActive]}>
                Portfolio ({holdings.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. TAB 1: TOP MOVERS */}
          {mainTab === 'screener' && (
            <View>
              {/* Filter Pills Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { id: 'volume_shockers', label: 'Volume Shockers' },
                    { id: 'breakouts_52w', label: '52W Breakouts' },
                    { id: 'golden_crossover', label: 'Golden Crossovers' },
                    { id: 'value_picks', label: 'Value & ROCE' },
                    { id: 'oversold_rsi', label: 'Oversold Bounces' },
                  ].map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catPill,
                        screenerCategory === cat.id && styles.catPillActive
                      ]}
                      onPress={() => setScreenerCategory(cat.id as any)}
                    >
                      <Text style={[
                        styles.catPillText,
                        screenerCategory === cat.id && styles.catPillTextActive
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {loadingScreener ? (
                <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 30 }} />
              ) : (
                <View style={{ gap: 10 }}>
                  {currentScreenerList.map(stock => {
                    const isUp = stock.changePercent >= 0;
                    return (
                      <View key={stock.symbol} style={styles.screenerCard}>
                        {/* Header */}
                        <TouchableOpacity 
                          style={styles.screenerCardHeader}
                          onPress={() => router.push(`/stock/${stock.symbol}`)}
                          activeOpacity={0.8}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={styles.stockSymbolText}>{stock.symbol.replace('.NS', '')}</Text>
                              <View style={styles.volBadge}>
                                <Text style={styles.volBadgeText}>{stock.volumeMultiplier}</Text>
                              </View>
                            </View>
                            <Text style={styles.stockNameText} numberOfLines={1}>{stock.shortname}</Text>
                          </View>

                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.stockPriceText}>{formatCurrency(stock.price)}</Text>
                            <Text style={[styles.stockChangeText, { color: isUp ? '#16a34a' : '#dc2626' }]}>
                              {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Action buttons */}
                        <View style={styles.screenerActionsRow}>
                          <TouchableOpacity 
                            style={styles.comparePillBtn}
                            onPress={() => router.push(`/compare?symbols=${stock.symbol}`)}
                          >
                            <Ionicons name="git-compare-outline" size={14} color={colors.accent} />
                            <Text style={styles.comparePillBtnText}>Analyze in Studio</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.buyPillBtn}
                            onPress={() => openBuyModal(stock)}
                          >
                            <Ionicons name="flash" size={14} color="#fff" />
                            <Text style={styles.buyPillBtnText}>Buy</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* 5. TAB 2: 🚀 DYNAMIC LIVE IPO HUB */}
          {mainTab === 'ipos' && (
            <View style={styles.listSection}>
              {/* IPO Sub-toggle */}
              <View style={styles.ipoNavRow}>
                <TouchableOpacity 
                  style={[styles.ipoNavBtn, ipoTab === 'live' && styles.ipoNavBtnActive]}
                  onPress={() => setIpoTab('live')}
                >
                  <Text style={[styles.ipoNavText, ipoTab === 'live' && styles.ipoNavTextActive]}>
                    Live & Upcoming ({ipos.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.ipoNavBtn, ipoTab === 'myBids' && styles.ipoNavBtnActive]}
                  onPress={() => setIpoTab('myBids')}
                >
                  <Text style={[styles.ipoNavText, ipoTab === 'myBids' && styles.ipoNavTextActive]}>
                    My Bids ({myApplications.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingIpos ? (
                <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 30 }} />
              ) : ipoTab === 'live' ? (
                /* LIVE IPOS LIST */
                ipos.map((ipo) => {
                  const isOpen = ipo.status === 'OPEN';
                  const isUpcoming = ipo.status === 'UPCOMING';
                  return (
                    <View key={ipo.id} style={styles.ipoCard}>
                      <View style={styles.ipoHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.ipoTitle}>{ipo.name}</Text>
                            {ipo.type && (
                              <View style={styles.ipoTypeBadge}>
                                <Text style={styles.ipoTypeBadgeText}>{ipo.type}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.ipoDates}>{ipo.dates} • {ipo.sector || 'Mainboard'}</Text>
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

                      {/* HIGHLIGHTS */}
                      {ipo.highlights && (
                        <Text style={styles.ipoHighlightsText} numberOfLines={2}>
                          {ipo.highlights}
                        </Text>
                      )}

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
                            {isUpcoming ? 'Bidding opens soon • Notifications active' : 'Closed for subscription'}
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
          )}

          {/* 6. TAB 3: 💼 PORTFOLIO SEGMENTS (POSITIONS & CNC HOLDINGS) */}
          {mainTab === 'portfolio' && (
            <View style={styles.portfolioContainer}>
              {/* Open Positions (Intraday MIS) */}
              <Text style={styles.portfolioSectionHeader}>Active Positions (MIS Intraday 5x)</Text>
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
          )}

        </ScrollView>

        {/* 7. ADVANCED TRADING BUY MODAL */}
        <Modal visible={isBuyModalOpen} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
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

              {/* Market vs Limit Selection */}
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

              {/* Stop-Loss Option */}
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
              ) : null}

              {/* Margin Breakdown */}
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

              {/* Slider Track */}
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

        {/* 8. DYNAMIC IPO BIDDING MODAL */}
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

              {/* Lot Selector */}
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

              {/* Cut-Off Toggle */}
              <TouchableOpacity 
                style={[styles.optionSection, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setUseCutoff(!useCutoff)}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.sectionLabel}>Apply at Cut-Off Price</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    Bid at ₹{selectedIpo?.cutoffPrice} for maximum allotment probability
                  </Text>
                </View>
                <Ionicons 
                  name={useCutoff ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={useCutoff ? colors.accent : colors.textSecondary} 
                />
              </TouchableOpacity>

              {/* Margin Breakdown */}
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

              {/* Submit Bid Button */}
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
    paddingHorizontal: 16,
  },
  
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === 'ios' ? 10 : 25,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    marginTop: 2,
  },
  compareHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  compareHeaderBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
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
    padding: 18,
    borderRadius: 22,
    backgroundColor: isDark ? '#1D2433' : colors.card,
    marginBottom: 16,
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
    fontSize: 10,
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
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginTop: 6,
  },
  walletDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  walletGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  gridValue: {
    fontSize: 14,
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
    marginBottom: 14,
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
    marginBottom: 14,
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
  resultSymbol: { fontSize: 14, fontWeight: '800', color: colors.text },
  resultName: { fontSize: 12, color: colors.textSecondary, maxWidth: 180 },
  rowBuyBtn: { backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  rowBuyBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Unified Top Segment Switcher
  mainSegmentNav: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  mainSegmentBtnActive: {
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  mainSegmentTextActive: {
    color: '#fff',
    fontWeight: '800',
  },

  // Category Pills
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catPillTextActive: {
    color: colors.accent,
    fontWeight: '800',
  },

  // Screener Card Styles
  screenerCard: {
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
  },
  screenerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stockSymbolText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },
  volBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  volBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
  },
  stockNameText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stockPriceText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },
  stockChangeText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  catalystBox: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catalystText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 16,
  },
  tradeSetupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  setupLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  setupVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  screenerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  comparePillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    gap: 6,
  },
  comparePillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
  },
  buyPillBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    gap: 6,
  },
  buyPillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },

  // IPO Specific Styles
  listSection: {
    gap: 10,
    marginBottom: 20,
  },
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
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },
  ipoTypeBadge: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ipoTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  ipoDates: {
    fontSize: 11,
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
    marginBottom: 10,
  },
  ipoMetricCol: {},
  ipoMetricLabel: {
    fontSize: 9,
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
  ipoHighlightsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
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
    marginTop: 6,
  },
  portfolioSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: colors.card,
    padding: 24,
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