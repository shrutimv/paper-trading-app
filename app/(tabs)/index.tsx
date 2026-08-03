import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (session) {
          setUser(JSON.parse(session));
        }
      } catch (e) {
        console.error("Failed to load user session", e);
      }
    };
    loadUser();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        
        {/* --- PREMIUM DYNAMIC HEADER --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(50)} style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>
            {user?.isGuest ? "Guest User" : "Jaspreet"} 
          </Text>
        </Animated.View>

        {/* --- PREMIUM STATS TILES --- */}
        <View style={styles.statsContainer}>
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={[styles.statTile, styles.streakTile]}>
            <Image source={require("../../assets/images/header/streak.png")} style={styles.statIcon} />
            <View>
              <Text style={[styles.statLabel, styles.streakLabel]}>Streak</Text>
              <Text style={[styles.statValue, styles.streakValue]}>11 days</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={[styles.statTile, styles.puzzlesTile]}>
            <Image source={require("../../assets/images/header/puzzel.png")} style={styles.statIcon} />
            <View>
              <Text style={[styles.statLabel, styles.puzzlesLabel]}>Puzzles</Text>
              <Text style={[styles.statValue, styles.puzzlesValue]}>48</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={[styles.statTile, styles.coursesTile]}>
            <Image source={require("../../assets/images/header/courses.png")} style={styles.statIcon} />
            <View>
              <Text style={[styles.statLabel, styles.coursesLabel]}>Courses</Text>
              <Text style={[styles.statValue, styles.coursesValue]}>3</Text>
            </View>
          </Animated.View>
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
            <SmallCard title="Reading Volume" subtitle="Understand trade volume." progress={0.6} />
            <SmallCard title="Risk Management" subtitle="Learn to mitigate losses." tag="Popular" />
            <SmallCard title="Support & Resistance" subtitle="Identify key price levels." progress={0.15} />
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

          <AnimatedTabCard href="/(tabs)/courses">
            <View style={styles.cardWrapper}>
              <CourseCard />
            </View>
          </AnimatedTabCard>

          <View style={styles.smallCoursesRow}>
            <View style={{ width: "48%" }}>
              <AnimatedTabCard href="/(tabs)/courses">
                <SmallCourseCard
                  title="Intro to ETFs"
                  subtitle="Beginner"
                  progressLabel="25% complete"
                  image={require("../../assets/images/smallCourses/1.png")}
                />
              </AnimatedTabCard>
            </View>

            <View style={{ width: "48%" }}>
              <AnimatedTabCard href="/(tabs)/courses">
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
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // FinTech Slate/Gray
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
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  username: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },

  /* --- STATS DASHBOARD --- */
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statTile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    width: "31%",
    elevation: 2, 
    borderWidth: 1,
  },
  // Streak Color Palette
  streakTile: {
    backgroundColor: "#FFF7ED", // soft orange
    borderColor: "#FFEDD5",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  streakLabel: {
    color: "#C2410C",
  },
  streakValue: {
    color: "#9A3412",
  },
  // Puzzles Color Palette
  puzzlesTile: {
    backgroundColor: "#F5F3FF", // soft purple
    borderColor: "#EDE9FE",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  puzzlesLabel: {
    color: "#6D28D9",
  },
  puzzlesValue: {
    color: "#5B21B6",
  },
  // Courses Color Palette
  coursesTile: {
    backgroundColor: "#ECFDF5", // soft green
    borderColor: "#D1FAE5",
    shadowColor: "#047857",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  coursesLabel: {
    color: "#047857",
  },
  coursesValue: {
    color: "#065F46",
  },
  
  statIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: "contain",
  },
  statLabel: {
    fontWeight: "700",
    fontSize: 11,
  },
  statValue: {
    fontWeight: "800",
    fontSize: 14,
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
    color: "#0F172A",
  },
  link: {
    color: "#0f62fe",
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