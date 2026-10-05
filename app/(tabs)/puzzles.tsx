import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import PageTransition from "@/components/PageTransition";
import LevelsCarousel from "../../components/LevelsCarousel";
import PuzzleItem from "../../components/PuzzleItem";

const { width: SCREEN_W } = Dimensions.get("window");

// --- 1. THE MASTER DATA (Untouched) ---
const MODULES = [
  { id: 'm1', title: 'Why Markets Exist?', level: 'Beginner', desc: 'Concept: Capital, IPOs, Shares.' },
  { id: 'm2', title: 'The Ecosystem', level: 'Beginner', desc: 'Concept: NSE/BSE, SEBI, Brokers.' },
  { id: 'm3', title: 'Stock Basics', level: 'Beginner', desc: 'Concept: Equity, Face Value, Dividends.' },
  { id: 'm4', title: 'Market Cap & Sectors', level: 'Beginner', desc: 'Concept: Large Cap vs Small Cap.' },
  { id: 'm5', title: 'Corporate Actions', level: 'Intermediate', desc: 'Concept: Splits, Bonuses, Buybacks.' },
  { id: 'm6', title: 'Mutual Funds & ETFs', level: 'Intermediate', desc: 'Concept: NAV, Expense Ratio, NiftyBees.' },
  { id: 'm7', title: 'Fundamental Analysis 1', level: 'Intermediate', desc: 'Concept: Revenue, Profit, EPS, P/E.' },
  { id: 'm8', title: 'IPO Analysis', level: 'Intermediate', desc: 'Concept: GMP, Lot Size, Listing Gains.' },
  { id: 'm9', title: 'Candlestick Anatomy', level: 'Advanced', desc: 'Concept: OHLC, Wicks, Bullish vs Bearish.' },
  { id: 'm10', title: 'Trends & Volume', level: 'Advanced', desc: 'Concept: Uptrend, Downtrend, Sideways.' },
  { id: 'm11', title: 'Support & Resistance', level: 'Advanced', desc: 'Concept: Breakouts & Breakdowns.' },
  { id: 'm12', title: 'Order Types & Leverage', level: 'Advanced', desc: 'Concept: Limit, Stop-Loss, Margin.' },
  { id: 'm13', title: 'Future Contracts', level: 'Expert', desc: 'Concept: Expiry, Lot Size, Long/Short.' },
  { id: 'm14', title: 'Options Basics (Buying)', level: 'Expert', desc: 'Concept: CE/PE, Strike Price.' },
  { id: 'm15', title: 'Moneyness & Greeks', level: 'Expert', desc: 'Concept: ATM/ITM/OTM, Theta Decay.' },
  { id: 'm16', title: 'Risk Management', level: 'Expert', desc: 'Concept: Risk-Reward, Position Sizing.' },
];

const PUZZLE_DATA = [
  {
    id: "p1",
    level: "Beginner",
    title: "The Bullish Engulfing Pattern",
    description: "Identify the correct entry point based on the chart pattern.",
    progress: 0.5,
    image: require("../../assets/images/Puzzle/p1.png"),
    buttonLabel: "Continue",
  },
];

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export default function PuzzlesScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null); 
  const { colors } = useTheme();
  const styles = getStyles(colors); 

  const [activeLevel, setActiveLevel] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<'puzzles' | 'roadmap'>('roadmap');
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const checkProgress = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const completed = keys
            .filter(k => k.startsWith('module_completed_'))
            .map(k => k.replace('module_completed_', ''));
          setCompletedIds(completed);
        } catch (e) { console.error(e); }
      };
      checkProgress();
    }, [])
  );

  const scrollToSection = (level: string) => {
    const index = MODULES.findIndex(m => m.level === level);
    if (index !== -1 && scrollViewRef.current) {
      const yOffset = index * 120; 
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  const getBackgroundColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#ECFDF5'; 
      case 'Intermediate': return '#FEF3C7'; 
      case 'Advanced': return '#FEF2F2'; 
      case 'Expert': return '#F3E8FF'; 
      default: return '#FFFFFF';
    }
  };

  const getBorderColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#059669'; 
      case 'Intermediate': return '#D97706'; 
      case 'Advanced': return '#DC2626'; 
      case 'Expert': return '#7C3AED'; 
      default: return '#94A3B8';
    }
  };

  return (
  <PageTransition>
    <SafeAreaView style={styles.screen}>
      
      {/* PREMIUM HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>GAMIFICATION</Text>
          <Text style={styles.title}>Daily Hub</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="medal-outline" size={22} color="#0f62fe" />
        </TouchableOpacity>
      </View>

      {/* MODERN TAB BAR */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'roadmap' && styles.activeTab]} 
            onPress={() => setActiveTab('roadmap')}
          >
            <Text style={[styles.tabText, activeTab === 'roadmap' && styles.activeTabText]}>Syllabus</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'puzzles' && styles.activeTab]} 
            onPress={() => setActiveTab('puzzles')}
          >
            <Text style={[styles.tabText, activeTab === 'puzzles' && styles.activeTabText]}>Puzzles</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'puzzles' ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          
          {/* DAILY INDEX SENTIMENT PREDICTOR (NIFTY 50 & SENSEX) */}
          <View style={[styles.predictionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="analytics" size={22} color={colors.accent} />
                <Text style={[styles.predictionTitle, { color: colors.text }]}>Daily Index Predictor (3:30 PM IST)</Text>
              </View>
              <View style={styles.liveTag}>
                <Text style={styles.liveTagText}>LIVE 3:30 PM</Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14, lineHeight: 18 }}>
              Predict whether <Text style={{ fontWeight: '800', color: colors.text }}>NIFTY 50</Text> or <Text style={{ fontWeight: '800', color: colors.text }}>SENSEX</Text> will close GREEN or RED today. Predictions lock for 3:30 PM settlement to earn +100 XP!
            </Text>

            {/* PREDICTION BUTTONS */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <TouchableOpacity 
                style={[
                  styles.predBtn, 
                  { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10b981' }
                ]}
                onPress={async () => {
                  await AsyncStorage.setItem('paper_daily_nifty_pred', 'BULLISH');
                  alert("Prediction Locked! 🚀 You predicted NIFTY 50 to close BULLISH (GREEN) at 3:30 PM IST. Check back after market close for +100 XP!");
                }}
              >
                <Ionicons name="trending-up" size={24} color="#10b981" />
                <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 13, marginTop: 4 }}>BULLISH (GREEN)</Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>Closes Up ↑</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.predBtn, 
                  { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef4444' }
                ]}
                onPress={async () => {
                  await AsyncStorage.setItem('paper_daily_nifty_pred', 'BEARISH');
                  alert("Prediction Locked! 📉 You predicted NIFTY 50 to close BEARISH (RED) at 3:30 PM IST. Check back after market close for +100 XP!");
                }}
              >
                <Ionicons name="trending-down" size={24} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 13, marginTop: 4 }}>BEARISH (RED)</Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>Closes Down ↓</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TRADING ARCADE GAMES HEADER */}
          <View style={[styles.arcadeHeaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Ionicons name="game-controller-outline" size={24} color={colors.accent} />
              <Text style={[styles.arcadeTitle, { color: colors.text }]}>Practical Trading Minigames</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
              Learn real market concepts (Order Execution, Intraday 5x Margin, and Risk-Reward Ratios) through interactive challenges.
            </Text>
          </View>

          {/* GAME CARDS GRID */}
          <View style={{ gap: 12, marginBottom: 20 }}>
            {/* GAME 1 */}
            <TouchableOpacity 
              style={[styles.gameCard, { backgroundColor: colors.card, borderColor: '#3b82f6' }]}
              onPress={() => router.push('/play-puzzle')}
            >
              <View style={[styles.gameIconBadge, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.gameCardTitle, { color: colors.text }]}>Order Matcher Arena</Text>
                  <View style={[styles.xpTag, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                    <Text style={[styles.xpTagText, { color: '#3b82f6' }]}>+150 XP</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Match trading scenarios with CNC (Delivery), MIS (5x Intraday), Market, & Stop-Loss.
                </Text>
              </View>
              <Ionicons name="play-circle" size={32} color="#3b82f6" />
            </TouchableOpacity>

            {/* GAME 2 */}
            <TouchableOpacity 
              style={[styles.gameCard, { backgroundColor: colors.card, borderColor: '#f59e0b' }]}
              onPress={() => router.push('/play-puzzle')}
            >
              <View style={[styles.gameIconBadge, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Ionicons name="calculator" size={24} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.gameCardTitle, { color: colors.text }]}>Risk-Reward Sizer</Text>
                  <View style={[styles.xpTag, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                    <Text style={[styles.xpTagText, { color: '#f59e0b' }]}>+100 XP</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Calculate entry, stop-loss, and target ratios to achieve 1:2 risk management.
                </Text>
              </View>
              <Ionicons name="play-circle" size={32} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={{flex: 1}}>
          
          {/* QUICK JUMP PILLS */}
          <View style={styles.filterRow}>
            {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
              <TouchableOpacity 
                key={lvl} 
                style={[styles.filterBtn, { backgroundColor: getBackgroundColor(lvl), borderColor: getBackgroundColor(lvl) }]}
                onPress={() => scrollToSection(lvl)}
              >
                <Text style={[styles.filterText, { color: getBorderColor(lvl) }]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {MODULES.map((module) => {
              const isDone = completedIds.includes(module.id);
              const bgColor = getBackgroundColor(module.level);
              const accentColor = getBorderColor(module.level);

              return (
                <TouchableOpacity 
                  key={module.id} 
                  style={[ styles.quizCard, { borderLeftColor: accentColor } ]}
                  onPress={() => router.push({ 
                    pathname: "/learn", 
                    params: { moduleId: module.id, level: module.level } 
                  })}
                >
                  <View style={styles.quizInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={styles.quizTitle}>{module.title}</Text>
                      {isDone && (
                        <View style={[styles.badge, { backgroundColor: bgColor, marginLeft: 8 }]}>
                          <Text style={[styles.badgeText, { color: accentColor }]}>COMPLETED</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.quizDesc}>{module.desc}</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                       <View style={[styles.levelTag, { backgroundColor: bgColor }]}>
                          <Text style={[styles.levelLabel, { color: accentColor }]}>{module.level}</Text>
                       </View>
                       <Text style={styles.actionText}>{isDone ? "Review Module" : "Start Learning"}</Text>
                    </View>
                  </View>

                  {/* Icon */}
                  <View style={[styles.iconWrapper, { backgroundColor: isDone ? bgColor : colors.border }]}>
                    {isDone ? (
                        <Ionicons name="checkmark-done" size={20} color={accentColor} />
                    ) : (
                        <Ionicons name="lock-open-outline" size={20} color={colors.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  </PageTransition>  
  );
}

/* PREMIUM STYLES */
const getStyles = (colors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  
  header: {
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 30,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { fontSize: 26, fontWeight: "900", color: colors.text, marginTop: 2 },
  notificationBtn: {
    backgroundColor: colors.card,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  /* --- TAB SWITCHER --- */
  tabContainer: { paddingHorizontal: 20, marginBottom: 15 },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: colors.border, // Inner gray track
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.card,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: '700' },
  activeTabText: { color: colors.text },

  /* --- ROADMAP FILTERS --- */
  filterRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 10,
  },
  filterBtn: { 
    borderWidth: 1, 
    borderRadius: 12, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderColor: colors.border,
  },
  filterText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  /* --- LISTS & CARDS --- */
  listContainer: { paddingBottom: 120, paddingHorizontal: 20, paddingTop: 10 },
  puzzleItemWrapper: { paddingHorizontal: 20, marginBottom: 15 },
  
  quizCard: { 
    marginBottom: 16, 
    padding: 18, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.card,
    borderLeftWidth: 6, // Thick colored accent on the left
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  quizInfo: { flex: 1, paddingRight: 10 },
  quizTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  quizDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  
  levelTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  levelLabel: { fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* --- PREDICTOR CARD STYLES --- */
  predictionCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 16,
    elevation: 3,
  },
  predictionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  liveTag: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  predBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* --- TRADING GAMES ARCADE STYLES --- */
  arcadeHeaderCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
  },
  arcadeTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
    elevation: 2,
  },
  gameIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  xpTag: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  xpTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
});