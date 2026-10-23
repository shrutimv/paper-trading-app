import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  Alert,
  Animated as RNAnimated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import NewsCarousel from "../../components/NewsCarousel";
import RecommendedStockCarousel from "../../components/RecommendedStockCarousel";
import AIRecommendations from "../../components/AIRecommendations";
import DailyRecapModal from "../../components/DailyRecapModal";
import { useAuth } from "../../context/AuthContext";
import { getRealProgress } from "../../src/services/progressService";

// --- THE ANIMATED CARD WRAPPER ---
const AnimatedTabCard = ({ children, href }: { children: React.ReactNode, href: string }) => {
  const router = useRouter();
  const scale = useRef(new RNAnimated.Value(1)).current;

  const handlePressIn = () => {
    RNAnimated.spring(scale, {
      toValue: 0.96, 
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    RNAnimated.spring(scale, {
      toValue: 1, 
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    router.navigate(href as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={1} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <RNAnimated.View style={{ transform: [{ scale }] }}>
        {children}
      </RNAnimated.View>
    </TouchableOpacity>
  );
};

export default function Home() {
  const router = useRouter(); 
  const { user: authUser, isGuest } = useAuth();
  const [localUser, setLocalUser] = useState<any>(null);
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [streak, setStreak] = useState<number>(1);
  const [puzzlesSolved, setPuzzlesSolved] = useState<number>(0);
  const [coursesCompletedCount, setCoursesCompletedCount] = useState<number>(0);
  const [factIndex, setFactIndex] = useState<number>(0);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState<boolean>(false);

  const MARKET_FACTS = [
    {
      title: "Sensex 800x Journey",
      fact: "Sensex started at a base of 100 on April 1, 1979 and crossed 80,000 in 2024 — an 800-fold wealth compounding journey for patient Indian investors.",
      tag: "History",
    },
    {
      title: "The Magic Rule of 72",
      fact: "Divide 72 by your expected annual return % to know how many years it takes to double your capital (72 ÷ 12% = 6 years).",
      tag: "Strategy",
    },
    {
      title: "India's $5 Trillion Milestone",
      fact: "India is now the 4th largest equity market in the world, surpassing Hong Kong with a combined market capitalization of over $5 Trillion.",
      tag: "Economy",
    },
    {
      title: "The 16-Crore Demat Boom",
      fact: "India crossed 16 Crore (160 Million) demat accounts in 2024, quadrupling from 4 Crore in 2020 as retail participation surged.",
      tag: "Retail",
    },
    {
      title: "Patience Pays Dividends",
      fact: "Warren Buffett earned over 90% of his wealth after age 65, proving that time in the market beats timing the market.",
      tag: "Wisdom",
    },
  ];

  useEffect(() => {
    const loadUserAndStats = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (session) {
          setLocalUser(JSON.parse(session));
        }

        // 1. Dynamic Streak Calculation
        const today = new Date().toISOString().slice(0, 10);
        const lastActive = await AsyncStorage.getItem("paper_last_active_date");
        let currentStreak = parseInt((await AsyncStorage.getItem("paper_streak")) || "1", 10);

        if (lastActive) {
          const lastDate = new Date(lastActive);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

          if (diffDays === 1) {
            currentStreak += 1;
            await AsyncStorage.setItem("paper_streak", currentStreak.toString());
            await AsyncStorage.setItem("paper_last_active_date", today);
          } else if (diffDays > 1) {
            currentStreak = 1;
            await AsyncStorage.setItem("paper_streak", "1");
            await AsyncStorage.setItem("paper_last_active_date", today);
          }
        } else {
          await AsyncStorage.setItem("paper_last_active_date", today);
          await AsyncStorage.setItem("paper_streak", "1");
        }
        setStreak(currentStreak);

        // 2 & 3. Real Puzzles & Courses (reconciled across local storage & DB)
        const progress = await getRealProgress();
        setPuzzlesSolved(progress.puzzlesSolved);
        setCoursesCompletedCount(progress.coursesCompletedCount);
      } catch (e) {
        console.error("Failed to load user and stats", e);
      }
    };
    loadUserAndStats();
  }, [authUser]);

  const currentUser = authUser || localUser;
  const username = currentUser?.username 
    ? currentUser.username 
    : (isGuest || currentUser?.isGuest ? "Guest Trader" : "Trader");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 17) return "Good Afternoon,";
    return "Good Evening,";
  };

  const currentFact = MARKET_FACTS[factIndex % MARKET_FACTS.length];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        
        {/* --- PREMIUM DYNAMIC HEADER --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(50)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(37,99,235,0.3)' : '#bfdbfe',
            }}
            onPress={() => setIsRecapModalOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="bar-chart-outline" size={15} color="#2563eb" style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#2563eb' }}>Daily Recap</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* --- PREMIUM STATS TILES (100% REAL DATA) --- */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => Alert.alert(
              `${streak}-Day Trading Streak!`, 
              "Keep logging in daily and placing paper trades to maintain your streak multiplier and level up your rank."
            )}
            style={{ flex: 1 }}
          >
            <Animated.View entering={FadeInDown.duration(600).delay(100)} style={[styles.statTile, styles.streakTile]}>
              <Image source={require("../../assets/images/header/streak.png")} style={styles.statIcon} />
              <View>
                <Text style={[styles.statLabel, styles.streakLabel]}>Streak</Text>
                <Text style={[styles.statValue, styles.streakValue]}>{streak} {streak === 1 ? 'day' : 'days'}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/puzzles")}
            style={{ flex: 1 }}
          >
            <Animated.View entering={FadeInDown.duration(600).delay(200)} style={[styles.statTile, styles.puzzlesTile]}>
              <Image source={require("../../assets/images/header/puzzel.png")} style={styles.statIcon} />
              <View>
                <Text style={[styles.statLabel, styles.puzzlesLabel]}>Puzzles</Text>
                <Text style={[styles.statValue, styles.puzzlesValue]}>{puzzlesSolved}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/courses")}
            style={{ flex: 1 }}
          >
            <Animated.View entering={FadeInDown.duration(600).delay(300)} style={[styles.statTile, styles.coursesTile]}>
              <Image source={require("../../assets/images/header/courses.png")} style={styles.statIcon} />
              <View>
                <Text style={[styles.statLabel, styles.coursesLabel]}>Courses</Text>
                <Text style={[styles.statValue, styles.coursesValue]}>{coursesCompletedCount}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* --- MARKET FACT OF THE DAY --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(350)} style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <View style={{
            backgroundColor: isDark ? 'rgba(37, 99, 235, 0.08)' : '#eff6ff',
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(37, 99, 235, 0.25)' : '#bfdbfe',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="bulb-outline" size={16} color="#2563eb" />
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  DID YOU KNOW? • {currentFact.tag}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFactIndex(prev => prev + 1)}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563eb' }}>Next Fact ↻</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              {currentFact.title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }}>
              {currentFact.fact}
            </Text>
          </View>
        </Animated.View>

        {/* --- RECOMMENDED STOCK GRAPH (POWERED BY ML & USER PURCHASES) --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <RecommendedStockCarousel />
        </Animated.View>

        {/* --- UPCOMING IPOS SECTION --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(580)}>
          <View style={[styles.sectionHeader, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Upcoming IPOs</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/trading")}>
              <Text style={styles.link}>View all</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => router.push("/(tabs)/trading")}
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.shadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(37, 99, 235, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="rocket" size={20} color="#2563eb" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>Swiggy Limited</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>Price: ₹371 - ₹390 • Lot: 38 sh</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#16a34a' }}>BID OPEN</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 10, borderRadius: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Est. Listing Gain: <Text style={{ fontWeight: '800', color: '#16a34a' }}>+₹25 (+6.4% GMP)</Text></Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#2563eb' }}>Apply with ₹14,820 →</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* --- AI SMART RECOMMENDATIONS SECTION --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(590)}>
          <AIRecommendations />
        </Animated.View>

        {/* --- COMMUNITY FORUM SECTION --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(595)}>
          <View style={[styles.sectionHeader, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Traders Lounge</Text>
            <TouchableOpacity onPress={() => router.push("/forum" as any)}>
              <Text style={styles.link}>Open Forum →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/forum" as any)}
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(37,99,235,0.3)' : '#bfdbfe',
              shadowColor: colors.shadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chatbubbles" size={20} color="#2563eb" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                    Community Discussions
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Analysis • Strategies • Q&A
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' }} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#16a34a' }}>LIVE</Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 }}>
              Connect with fellow Indian retail traders. Share insights on Tata Motors, Zomato, Nifty50, and ask queries.
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>#TATAMOTORS</Text>
                </View>
                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>#ZOMATO</Text>
                </View>
                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>#NIFTY50</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.accent }}>Join</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.accent} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* --- MARKET NEWS SECTION (API DRIVEN) --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(600)}>
          <View style={[styles.sectionHeader, { marginTop: 30, marginBottom: 5 }]}>
            <Text style={styles.sectionTitle}>Market News</Text>
          </View>
          <View style={{ paddingHorizontal: 4 }}>
            <NewsCarousel />
          </View>
        </Animated.View>

      </View>

      {/* --- DAILY RECAP POPUP MODAL --- */}
      <DailyRecapModal
        visible={isRecapModalOpen}
        onClose={() => setIsRecapModalOpen(false)}
        onViewOrders={() => router.push('/(tabs)/trading')}
      />
    </ScrollView>
  );
}

/* -------------------- Premium Styles -------------------- */
const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 32 : 0,
    paddingTop: 12,
  },
  
  /* --- HEADERS --- */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 25,
  },
  greeting: {
    color: colors.textSecondary, // Slate secondary
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  username: {
    color: colors.text, // Pure white
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },

  /* --- STATS DASHBOARD --- */
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 25,
    gap: 10,
  },
  statTile: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 18,
    width: "100%",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3, 
  },
  streakTile: {},
  streakLabel: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  streakValue: {
    color: "#FB923C", // Orange glow
    textAlign: "center",
  },
  puzzlesTile: {},
  puzzlesLabel: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  puzzlesValue: {
    color: "#C084FC", // Purple glow
    textAlign: "center",
  },
  coursesTile: {},
  coursesLabel: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  coursesValue: {
    color: "#34D399", // Emerald glow
    textAlign: "center",
  },
  
  statIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
    resizeMode: "contain",
  },
  statLabel: {
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statValue: {
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },

  /* --- SECTION HEADERS --- */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  link: {
    color: colors.accent, // Glowing brand blue
    fontWeight: "700",
    fontSize: 14,
  },

  /* --- COMPONENT WRAPPERS --- */
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  smallCoursesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 15,
  },
});