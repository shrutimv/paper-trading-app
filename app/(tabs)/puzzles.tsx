import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageTransition from "@/components/PageTransition";
import { LEARNING_DATA } from "../../constants/LearningData";
import { useGamification } from "../../context/GamificationContext";
import { useTheme } from "../../context/ThemeContext";

const { width: SCREEN_W } = Dimensions.get("window");

export interface AcademyModule {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  readTime: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: 'm1',
    title: 'Origins of Stocks & Why Markets Exist',
    level: 'Beginner',
    readTime: '4 min',
    desc: 'The 1602 spice voyages, Dalal Street banyan tree, and equity vs bank loans.',
    icon: 'compass-outline',
  },
  {
    id: 'm2',
    title: 'The Market Ecosystem & Regulators',
    level: 'Beginner',
    readTime: '4 min',
    desc: 'NSE vs BSE, SEBI watchdog, Demat accounts, and Nifty 50 / Sensex indices.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'm3',
    title: 'Asset Classes: Where Money Grows',
    level: 'Beginner',
    readTime: '5 min',
    desc: 'Equities, Debt & FDs, Mutual Funds, ETFs, Gold hedge, and Real Estate.',
    icon: 'pie-chart-outline',
  },
  {
    id: 'm4',
    title: 'Why Stock Prices Move',
    level: 'Beginner',
    readTime: '5 min',
    desc: 'Supply vs Demand, Quarterly Earnings, FII/DII institutional flows, and RBI repo rate.',
    icon: 'trending-up-outline',
  },
  {
    id: 'm5',
    title: 'Anatomy of a Trade: Under the Hood',
    level: 'Intermediate',
    readTime: '5 min',
    desc: 'Secondary market reality, T+1 settlement cycle, and CNC (Delivery) vs MIS (Intraday).',
    icon: 'swap-horizontal-outline',
  },
  {
    id: 'm6',
    title: 'Order Types & Market Depth Mechanics',
    level: 'Intermediate',
    readTime: '5 min',
    desc: 'Market vs Limit, Stop-Loss (SL/SL-M), Bid-Ask Spread, and GTT trigger orders.',
    icon: 'list-outline',
  },
  {
    id: 'm7',
    title: 'Fundamental Analysis: What to Inspect',
    level: 'Intermediate',
    readTime: '6 min',
    desc: 'The 3 financial statements (P&L, Balance Sheet, Cash Flow), and Warren Buffett moats.',
    icon: 'document-text-outline',
  },
  {
    id: 'm8',
    title: 'Key Financial Ratios Made Simple',
    level: 'Intermediate',
    readTime: '5 min',
    desc: 'P/E valuation, EPS, ROE capital efficiency, Debt-to-Equity, and Dividend Yield.',
    icon: 'calculator-outline',
  },
  {
    id: 'm9',
    title: 'Promoter Health & Governance Red Flags',
    level: 'Intermediate',
    readTime: '4 min',
    desc: 'Promoter skin in the game, danger of pledged shares, and auditor resignation alerts.',
    icon: 'alert-circle-outline',
  },
  {
    id: 'm10',
    title: 'Candlestick Anatomy & Price Action',
    level: 'Advanced',
    readTime: '5 min',
    desc: 'OHLC points, Green vs Red bodies, reading upper/lower wicks, Support & Resistance.',
    icon: 'bar-chart-outline',
  },
  {
    id: 'm11',
    title: 'Trends, Volumes & Breakout Dynamics',
    level: 'Advanced',
    readTime: '5 min',
    desc: 'Higher Highs, Volume institutional confirmation, Bull traps, and retest setups.',
    icon: 'pulse-outline',
  },
  {
    id: 'm12',
    title: 'Risk Management & Trading Psychology',
    level: 'Expert',
    readTime: '6 min',
    desc: 'The Golden 1% Rule, 1:2 Risk-to-Reward ratio, Position sizing, and defeating FOMO.',
    icon: 'flame-outline',
  },
];

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

export default function PuzzlesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { currentRank, xp } = useGamification();
  const styles = getStyles(colors);

  const [activeLevel, setActiveLevel] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<'modules' | 'quizzes'>('modules');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [dailyPred, setDailyPred] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const checkProgress = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const completed = keys
            .filter(k => k.startsWith('module_completed_'))
            .map(k => k.replace('module_completed_', ''));
          setCompletedIds(completed);

          const pred = await AsyncStorage.getItem('paper_daily_nifty_pred');
          setDailyPred(pred);
        } catch (e) {
          console.error(e);
        }
      };
      checkProgress();
    }, [])
  );

  const filteredModules = useMemo(() => {
    if (activeLevel === "All") return ACADEMY_MODULES;
    return ACADEMY_MODULES.filter(m => m.level === activeLevel);
  }, [activeLevel]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', text: '#059669' };
      case 'Intermediate': return { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706' };
      case 'Advanced': return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', text: '#dc2626' };
      case 'Expert': return { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', text: '#7c3aed' };
      default: return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', text: '#2563eb' };
    }
  };

  const progressPercent = Math.round((completedIds.length / ACADEMY_MODULES.length) * 100);

  return (
    <PageTransition>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        
        {/* PREMIUM HEADER WITH RANK & PROGRESS */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>ACADEMY & KNOWLEDGE HUB</Text>
            <Text style={styles.title}>Learn & Master</Text>
          </View>
          <View style={styles.rankBadge}>
            <Ionicons name="shield-checkmark" size={16} color={currentRank.color} />
            <Text style={[styles.rankText, { color: currentRank.color }]}>{currentRank.name}</Text>
          </View>
        </View>

        {/* PROGRESS BANNER */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressRow}>
            <View>
              <Text style={[styles.progressTitle, { color: colors.text }]}>Curriculum Progress</Text>
              <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                {completedIds.length} of {ACADEMY_MODULES.length} Modules Mastered
              </Text>
            </View>
            <View style={[styles.progressPercentPill, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.progressPercentText, { color: colors.accent }]}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.accent }]} />
          </View>
        </View>

        {/* MODERN DUAL TAB BAR */}
        <View style={styles.tabContainer}>
          <View style={[styles.tabBackground, { backgroundColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'modules' && [styles.activeTab, { backgroundColor: colors.card }]]} 
              onPress={() => setActiveTab('modules')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="book-outline" 
                size={16} 
                color={activeTab === 'modules' ? colors.text : colors.textSecondary} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabText, { color: activeTab === 'modules' ? colors.text : colors.textSecondary }]}>
                Modules (Textbook)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'quizzes' && [styles.activeTab, { backgroundColor: colors.card }]]} 
              onPress={() => setActiveTab('quizzes')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="school-outline" 
                size={16} 
                color={activeTab === 'quizzes' ? colors.text : colors.textSecondary} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabText, { color: activeTab === 'quizzes' ? colors.text : colors.textSecondary }]}>
                Knowledge Quizzes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LEVEL FILTER PILLS */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LEVELS.map((lvl) => {
              const isSelected = activeLevel === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderColor: isSelected ? colors.accent : colors.border,
                    }
                  ]}
                  onPress={() => setActiveLevel(lvl)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterPillText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                    {lvl}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* TAB CONTENT */}
        {activeTab === 'modules' ? (
          /* MODULES READING TAB */
          <ScrollView 
            contentContainerStyle={styles.listContainer} 
            showsVerticalScrollIndicator={false}
          >
            {filteredModules.map((module, index) => {
              const isDone = completedIds.includes(module.id);
              const colorConfig = getLevelColor(module.level);

              return (
                <View 
                  key={module.id} 
                  style={[
                    styles.moduleCard, 
                    { 
                      backgroundColor: colors.card, 
                      borderColor: colors.border,
                      borderLeftColor: colorConfig.border,
                    }
                  ]}
                >
                  {/* CARD HEADER */}
                  <View style={styles.cardTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.levelBadge, { backgroundColor: colorConfig.bg }]}>
                        <Text style={[styles.levelBadgeText, { color: colorConfig.text }]}>
                          {module.level.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.readTimeText, { color: colors.textSecondary }]}>
                        • {module.readTime} read
                      </Text>
                    </View>

                    {isDone ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                        <Text style={styles.completedBadgeText}>COMPLETED</Text>
                      </View>
                    ) : (
                      <Text style={[styles.moduleIndexText, { color: colors.textSecondary }]}>
                        #{module.id.replace('m', '')}
                      </Text>
                    )}
                  </View>

                  {/* TITLE & DESCRIPTION */}
                  <Text style={[styles.moduleTitle, { color: colors.text }]}>{module.title}</Text>
                  <Text style={[styles.moduleDesc, { color: colors.textSecondary }]}>{module.desc}</Text>

                  {/* ACTION BUTTONS */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.readBtn, { backgroundColor: colors.accent }]}
                      onPress={() => router.push({
                        pathname: "/learn",
                        params: { moduleId: module.id, level: module.level }
                      })}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="book" size={16} color="#fff" />
                      <Text style={styles.readBtnText}>Read Module</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.quizOutlineBtn, 
                        { 
                          borderColor: isDone ? '#10b981' : colors.border,
                          backgroundColor: isDone ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                        }
                      ]}
                      onPress={() => router.push({
                        pathname: "/quiz",
                        params: { moduleId: module.id, level: module.level }
                      })}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={isDone ? "checkmark-circle" : "school-outline"} 
                        size={15} 
                        color={isDone ? "#10b981" : colors.text} 
                      />
                      <Text style={[styles.quizOutlineText, { color: isDone ? "#10b981" : colors.text }]}>
                        {isDone ? "Retake Quiz" : "Quiz (+250 XP)"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <View style={{ height: 100 }} />
          </ScrollView>
        ) : (
          /* QUIZZES & PRACTICE TAB */
          <ScrollView 
            contentContainerStyle={styles.listContainer} 
            showsVerticalScrollIndicator={false}
          >
            {/* DAILY INDEX SENTIMENT PREDICTOR */}
            <View style={[styles.predictionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="analytics" size={20} color={colors.accent} />
                  <Text style={[styles.predictionTitle, { color: colors.text }]}>Daily Index Sentiment (3:30 PM)</Text>
                </View>
                <View style={styles.liveTag}>
                  <Text style={styles.liveTagText}>TODAY'S CLOSE</Text>
                </View>
              </View>

              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 18 }}>
                Predict whether <Text style={{ fontWeight: '800', color: colors.text }}>NIFTY 50</Text> will close GREEN or RED today. Earn +100 XP upon 3:30 PM market settlement!
              </Text>

              {dailyPred ? (
                <View style={[styles.lockedCard, { backgroundColor: colors.border + '40', borderColor: colors.border }]}>
                  <Ionicons name="lock-closed" size={16} color={colors.accent} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    Prediction Locked: <Text style={{ color: dailyPred === 'BULLISH' ? '#10b981' : '#ef4444' }}>{dailyPred}</Text>
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity 
                    style={[styles.predBtn, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10b981' }]}
                    onPress={async () => {
                      await AsyncStorage.setItem('paper_daily_nifty_pred', 'BULLISH');
                      setDailyPred('BULLISH');
                      alert("Prediction Locked! 🚀 You predicted NIFTY 50 to close BULLISH (GREEN).");
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trending-up" size={20} color="#10b981" />
                    <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 12, marginTop: 2 }}>BULLISH (GREEN)</Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Closes Up ↑</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.predBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef4444' }]}
                    onPress={async () => {
                      await AsyncStorage.setItem('paper_daily_nifty_pred', 'BEARISH');
                      setDailyPred('BEARISH');
                      alert("Prediction Locked! 📉 You predicted NIFTY 50 to close BEARISH (RED).");
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trending-down" size={20} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 12, marginTop: 2 }}>BEARISH (RED)</Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Closes Down ↓</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* QUIZ CARDS GRID */}
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>Knowledge Check Quizzes</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                Test your mastery of any module directly. Answer 5 conceptual questions to earn XP and level up.
              </Text>
            </View>

            {filteredModules.map((module) => {
              const isDone = completedIds.includes(module.id);
              const colorConfig = getLevelColor(module.level);

              return (
                <TouchableOpacity
                  key={module.id}
                  style={[
                    styles.quizCardItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: isDone ? '#10b981' : colors.border,
                    }
                  ]}
                  onPress={() => router.push({
                    pathname: "/quiz",
                    params: { moduleId: module.id, level: module.level }
                  })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quizIconBox, { backgroundColor: colorConfig.bg }]}>
                    <Ionicons name={module.icon} size={22} color={colorConfig.text} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.quizCardTitle, { color: colors.text }]} numberOfLines={1}>
                        {module.title}
                      </Text>
                      {isDone && (
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      5 Questions • {module.level} • {isDone ? 'Completed' : '+250 XP'}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>
    </PageTransition>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { fontSize: 24, fontWeight: "900", color: colors.text, marginTop: 2 },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* PROGRESS CARD */
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressPercentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },

  /* TAB SWITCHER */
  tabContainer: { paddingHorizontal: 20, marginBottom: 12 },
  tabBackground: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '700' },

  /* FILTER PILLS */
  filterRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* LIST & MODULE CARDS */
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  moduleCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderLeftWidth: 5,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  readTimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  moduleIndexText: {
    fontSize: 12,
    fontWeight: '800',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  readBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  readBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  quizOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  quizOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* PREDICTOR CARD */
  predictionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  liveTag: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  predBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* QUIZZES TAB LIST */
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  quizCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  quizIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    flex: 1,
  },
});