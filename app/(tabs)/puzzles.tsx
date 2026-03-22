import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
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
const CARD_MAX_WIDTH = 900;

// --- 1. THE MASTER DATA (The Full Roadmap) ---
const MODULES = [
  // --- BEGINNER (Green) ---
  { id: 'm1', title: 'Why Markets Exist?', level: 'Beginner', desc: 'Concept: Capital, IPOs, Shares.' },
  { id: 'm2', title: 'The Ecosystem', level: 'Beginner', desc: 'Concept: NSE/BSE, SEBI, Brokers.' },
  { id: 'm3', title: 'Stock Basics', level: 'Beginner', desc: 'Concept: Equity, Face Value, Dividends.' },
  { id: 'm4', title: 'Market Cap & Sectors', level: 'Beginner', desc: 'Concept: Large Cap vs Small Cap.' },

  // --- INTERMEDIATE (Yellow/Orange) ---
  { id: 'm5', title: 'Corporate Actions', level: 'Intermediate', desc: 'Concept: Splits, Bonuses, Buybacks.' },
  { id: 'm6', title: 'Mutual Funds & ETFs', level: 'Intermediate', desc: 'Concept: NAV, Expense Ratio, NiftyBees.' },
  { id: 'm7', title: 'Fundamental Analysis 1', level: 'Intermediate', desc: 'Concept: Revenue, Profit, EPS, P/E.' },
  { id: 'm8', title: 'IPO Analysis', level: 'Intermediate', desc: 'Concept: GMP, Lot Size, Listing Gains.' },

  // --- ADVANCED (Red) ---
  { id: 'm9', title: 'Candlestick Anatomy', level: 'Advanced', desc: 'Concept: OHLC, Wicks, Bullish vs Bearish.' },
  { id: 'm10', title: 'Trends & Volume', level: 'Advanced', desc: 'Concept: Uptrend, Downtrend, Sideways.' },
  { id: 'm11', title: 'Support & Resistance', level: 'Advanced', desc: 'Concept: Breakouts & Breakdowns.' },
  { id: 'm12', title: 'Order Types & Leverage', level: 'Advanced', desc: 'Concept: Limit, Stop-Loss, Margin.' },

  // --- EXPERT (Purple) ---
  { id: 'm13', title: 'Future Contracts', level: 'Expert', desc: 'Concept: Expiry, Lot Size, Long/Short.' },
  { id: 'm14', title: 'Options Basics (Buying)', level: 'Expert', desc: 'Concept: CE/PE, Strike Price.' },
  { id: 'm15', title: 'Moneyness & Greeks', level: 'Expert', desc: 'Concept: ATM/ITM/OTM, Theta Decay.' },
  { id: 'm16', title: 'Risk Management', level: 'Expert', desc: 'Concept: Risk-Reward, Position Sizing.' },
];

// --- 2. THE DAILY PUZZLES DATA ---
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
  // Add more puzzles here if needed
];

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export default function PuzzlesScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null); 

  const [activeLevel, setActiveLevel] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<'puzzles' | 'roadmap'>('roadmap'); // Default to Roadmap
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  // --- 3. CHECK PROGRESS (Runs every time you open the tab) ---
  useFocusEffect(
    useCallback(() => {
      const checkProgress = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          // Find keys like "module_completed_m1"
          const completed = keys
            .filter(k => k.startsWith('module_completed_'))
            .map(k => k.replace('module_completed_', ''));
          setCompletedIds(completed);
        } catch (e) { console.error(e); }
      };
      checkProgress();
    }, [])
  );

  // --- SCROLL TO SECTION ---
  const scrollToSection = (level: string) => {
    const index = MODULES.findIndex(m => m.level === level);
    if (index !== -1 && scrollViewRef.current) {
      const yOffset = index * 110; // Approx height per card
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  // --- COLORS ---
  const getBackgroundColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#ecfdf5'; // Light Green
      case 'Intermediate': return '#fffbeb'; // Light Yellow
      case 'Advanced': return '#fef2f2'; // Light Red
      case 'Expert': return '#f3e8ff'; // Light Purple
      default: return '#fff';
    }
  };

  const getBorderColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#10b981'; 
      case 'Intermediate': return '#f59e0b'; 
      case 'Advanced': return '#ef4444'; 
      case 'Expert': return '#7c3aed'; 
      default: return '#ccc';
    }
  };

  return (
  <PageTransition>
    <SafeAreaView style={styles.screen}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        {/* Back Button (Optional if this is a main tab) */}
        {/* <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/")}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity> */}
        <Text style={styles.title}>Learning Hub</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* Tabs Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'puzzles' && styles.activeTab]} 
          onPress={() => setActiveTab('puzzles')}
        >
          <Text style={[styles.tabText, activeTab === 'puzzles' && styles.activeTabText]}>Daily Puzzles</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'roadmap' && styles.activeTab]} 
          onPress={() => setActiveTab('roadmap')}
        >
          <Text style={[styles.tabText, activeTab === 'roadmap' && styles.activeTabText]}>Full Roadmap</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'puzzles' ? (
        // --- TAB 1: DAILY PUZZLES ---
        <>
          <LevelsCarousel levels={LEVELS} active={activeLevel} onSelect={(lvl) => setActiveLevel(lvl)} />
          <FlatList
            data={PUZZLE_DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
               <View style={{paddingHorizontal:16, marginTop:10}}>
                 <PuzzleItem {...item} onPress={() => router.push('/play-puzzle')} />
               </View>
            )}
            contentContainerStyle={{paddingBottom: 100}}
          />
        </>
      ) : (
        // --- TAB 2: FULL ROADMAP ---
        <View style={{flex: 1}}>
          
          {/* Quick Jump Buttons */}
          <View style={styles.filterRow}>
            {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
              <TouchableOpacity 
                key={lvl} 
                style={[styles.filterBtn, { borderColor: getBorderColor(lvl) }]}
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
              const borderColor = getBorderColor(module.level);

              return (
                <TouchableOpacity 
                  key={module.id} 
                  style={[
                    styles.quizCard, 
                    { backgroundColor: bgColor, borderLeftColor: borderColor }
                  ]}
                  // Navigate to Learn Screen
                  onPress={() => router.push({ 
                    pathname: "/learn", 
                    params: { moduleId: module.id, level: module.level } 
                  })}
                >
                  <View style={styles.quizInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.quizTitle}>{module.title}</Text>
                      {isDone && (
                        <View style={[styles.badge, { backgroundColor: borderColor }]}>
                          <Text style={styles.badgeText}>DONE</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.quizDesc}>{module.desc}</Text>
                    <Text style={[styles.levelLabel, { color: borderColor }]}>
                      {module.level} • {isDone ? "100% Score" : "Start Learning"}
                    </Text>
                  </View>

                  {/* Icon on the Right */}
                  {isDone ? (
                     <Ionicons name="checkmark-circle" size={32} color={borderColor} />
                  ) : (
                     <Ionicons name="lock-open" size={24} color={borderColor} style={{opacity: 0.5}} />
                  )}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  topNav: { height: 60, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  iconBtn: { padding: 4, position: 'absolute', left: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#111" },
  
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#f3f4f6' },
  activeTab: { borderBottomColor: '#0f62fe' },
  tabText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
  activeTabText: { color: '#0f62fe' },

  filterRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingHorizontal: 8, backgroundColor: '#fff' },
  filterBtn: { borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fff' },
  filterText: { fontSize: 11, fontWeight: '700' },

  listContainer: { paddingBottom: 100, paddingHorizontal: 16, paddingTop: 10 },
  
  quizCard: { 
    marginBottom: 12, 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  },
  quizInfo: { flex: 1, paddingRight: 10 },
  quizTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  quizDesc: { color: '#6b7280', marginTop: 4, fontSize: 13 },
  levelLabel: { fontWeight: '600', marginTop: 8, fontSize: 11, textTransform: 'uppercase' },
  
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' }
});