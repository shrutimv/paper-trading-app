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

import CourseCard from "../../components/CourseCard";
import HorizontalCardCarousel from "../../components/HorizontalCardCarousel";
import NewsCarousel from "../../components/NewsCarousel";
import PaperTradingCard from "../../components/PaperTradingCard";
import PuzzleCard from "../../components/PuzzleCard";
import SmallCard from "../../components/SmallCard";
import SmallCourseCard from "../../components/SmallCourseCard";
import { useAuth } from "../../context/AuthContext";

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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (session) {
          setLocalUser(JSON.parse(session));
        }
      } catch (e) {
        console.error("Failed to load user session", e);
      }
    };
    loadUser();
  }, []);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        
        {/* --- PREMIUM DYNAMIC HEADER --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(50)} style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.username}>
            {username}
          </Text>
        </Animated.View>

        {/* --- PREMIUM STATS TILES --- */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => Alert.alert(
              "11-Day Trading Streak!", 
              "You're on fire! Complete daily puzzles and paper trades to maintain your streak multiplier and advance to the next rank."
            )}
            style={{ flex: 1 }}
          >
            <Animated.View entering={FadeInDown.duration(600).delay(100)} style={[styles.statTile, styles.streakTile]}>
              <Image source={require("../../assets/images/header/streak.png")} style={styles.statIcon} />
              <View>
                <Text style={[styles.statLabel, styles.streakLabel]}>Streak</Text>
                <Text style={[styles.statValue, styles.streakValue]}>11 days</Text>
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
                <Text style={[styles.statValue, styles.puzzlesValue]}>48</Text>
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
                <Text style={[styles.statValue, styles.coursesValue]}>3</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* --- PUZZLES SECTION --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Puzzles</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/puzzles")}>
              <Text style={styles.link}>View all</Text>
            </TouchableOpacity>
          </View>

          <AnimatedTabCard href="/(tabs)/puzzles">
            <View style={styles.cardWrapper}>
              <PuzzleCard />
            </View>
          </AnimatedTabCard>
        </Animated.View>

        {/* --- HORIZONTAL SKILLS CAROUSEL --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(450)} style={{ marginTop: 15 }}>
          <HorizontalCardCarousel cardWidth={260} cardSpacing={14}>
            <SmallCard 
              title="Reading Volume" 
              subtitle="Understand trade volume & price action." 
              progress={0.6} 
              onPress={() => router.push("/(tabs)/courses/c1")}
            />
            <SmallCard 
              title="Risk Management" 
              subtitle="Learn stop-losses and risk mitigation." 
              tag="Popular" 
              onPress={() => router.push("/(tabs)/courses/c3")}
            />
            <SmallCard 
              title="Support & Resistance" 
              subtitle="Identify institutional supply & demand zones." 
              progress={0.15} 
              onPress={() => router.push("/(tabs)/courses/c2")}
            />
          </HorizontalCardCarousel>
        </Animated.View>

        {/* --- COURSES SECTION --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <View style={[styles.sectionHeader, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Active Courses</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/courses")}>
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>

          <AnimatedTabCard href="/(tabs)/courses/c1">
            <View style={styles.cardWrapper}>
              <CourseCard />
            </View>
          </AnimatedTabCard>

          <View style={styles.smallCoursesRow}>
            <View style={{ width: "48%" }}>
              <AnimatedTabCard href="/(tabs)/courses/c3">
                <SmallCourseCard
                  title="Intro to Derivatives"
                  subtitle="Beginner"
                  progressLabel="25% complete"
                  image={require("../../assets/images/smallCourses/1.png")}
                />
              </AnimatedTabCard>
            </View>

            <View style={{ width: "48%" }}>
              <AnimatedTabCard href="/(tabs)/courses/c5">
                <SmallCourseCard
                  title="Fundamental Analysis"
                  subtitle="Intermediate"
                  progressLabel="0% complete"
                  image={require("../../assets/images/smallCourses/2.png")}
                />
              </AnimatedTabCard>
            </View>
          </View>
        </Animated.View>

        {/* --- PAPER TRADING SECTION --- */}
        <Animated.View entering={FadeInDown.duration(600).delay(550)}>
          <View style={[styles.sectionHeader, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Paper Trading</Text>
          </View>

          <AnimatedTabCard href="/(tabs)/trading">
            <View style={styles.cardWrapper}>
              <PaperTradingCard />
            </View>
          </AnimatedTabCard>
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