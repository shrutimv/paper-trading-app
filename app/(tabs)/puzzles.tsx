import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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
        <>
          <View style={{ marginBottom: 10 }}>
             <LevelsCarousel levels={LEVELS} active={activeLevel} onSelect={(lvl) => setActiveLevel(lvl)} />
          </View>
          <FlatList
            data={PUZZLE_DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
               <View style={styles.puzzleItemWrapper}>
                 <PuzzleItem {...item} onPress={() => router.push('/play-puzzle')} />
               </View>
            )}
            contentContainerStyle={{paddingBottom: 120}}
          />
        </>
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
                  <View style={[styles.iconWrapper, { backgroundColor: isDone ? bgColor : '#F1F5F9' }]}>
                    {isDone ? (
                        <Ionicons name="checkmark-done" size={20} color={accentColor} />
                    ) : (
                        <Ionicons name="lock-open-outline" size={20} color="#94A3B8" />
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
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  
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
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { fontSize: 26, fontWeight: "900", color: "#0F172A", marginTop: 2 },
  notificationBtn: {
    backgroundColor: '#EFF6FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /* --- TAB SWITCHER --- */
  tabContainer: { paddingHorizontal: 20, marginBottom: 15 },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0', // Inner gray track
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  activeTabText: { color: '#0F172A' },

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
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 6, // Thick colored accent on the left
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  quizInfo: { flex: 1, paddingRight: 10 },
  quizTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  quizDesc: { color: '#64748B', fontSize: 13, lineHeight: 18 },
  
  levelTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  levelLabel: { fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
  actionText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  }
});