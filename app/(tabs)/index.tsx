import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CourseCard from "../../components/CourseCard";
import HorizontalCardCarousel from "../../components/HorizontalCardCarousel";
import NewsCarousel from "../../components/NewsCarousel";
import PaperTradingCard from "../../components/PaperTradingCard";
import PuzzleCard from "../../components/PuzzleCard";
import SmallCard from "../../components/SmallCard";
import SmallCourseCard from "../../components/SmallCourseCard";

// --- THE ANIMATED CARD WRAPPER ---
// --- THE ANIMATED CARD WRAPPER ---
const AnimatedTabCard = ({ children, href }: { children: React.ReactNode, href: string }) => {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95, 
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1, 
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    // 🔥 CHANGE HERE: Use navigate() instead of push() for instant tab switching!
    router.navigate(href as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={1} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
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
      contentContainerStyle={{ paddingBottom: 56 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        
        {/* --- DYNAMIC HEADER --- */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ color: '#6b7280', fontSize: 16 }}>Hello,</Text>
          <Text style={{ color: '#111', fontSize: 24, fontWeight: 'bold' }}>
            {user?.isGuest ? "Guest User" : "Trader"}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Image source={require("../../assets/images/header/streak.png")} style={styles.statIcon} />
            <View>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>11 days</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Image source={require("../../assets/images/header/puzzel.png")} style={styles.statIcon} />
            <View>
              <Text style={styles.statLabel}>Puzzles</Text>
              <Text style={styles.statValue}>48</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Image source={require("../../assets/images/header/courses.png")} style={styles.statIcon} />
            <View>
              <Text style={styles.statLabel}>Courses</Text>
              <Text style={styles.statValue}>3</Text>
            </View>
          </View>
        </View>

        {/* --- PUZZLES SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Puzzles</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/puzzles")}>
            <Text style={styles.link}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* WRAPPED WITH ANIMATION */}
        <AnimatedTabCard href="/(tabs)/puzzles">
          <PuzzleCard />
        </AnimatedTabCard>

        {/* Draggable small-card carousel */}
        <HorizontalCardCarousel cardWidth={260} cardSpacing={14}>
          <SmallCard title="Reading Volume" subtitle="Understand trade volume." progress={0.6} />
          <SmallCard title="Risk Management" subtitle="Learn to mitigate losses." tag="Popular" />
          <SmallCard title="Support & Resistance" subtitle="Identify key price levels." progress={0.15} />
        </HorizontalCardCarousel>

        {/* --- COURSES SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Courses</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/courses")}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* WRAPPED WITH ANIMATION */}
        <AnimatedTabCard href="/(tabs)/courses">
          <CourseCard />
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

        {/* --- PAPER TRADING SECTION --- */}
        <Text style={[styles.sectionTitle, { marginLeft: 16, marginTop: 16 }]}>
          Paper Trading
        </Text>

        {/* WRAPPED WITH ANIMATION */}
        <AnimatedTabCard href="/(tabs)/trading">
          <View style={{ paddingHorizontal: 16 }}>
            <PaperTradingCard />
          </View>
        </AnimatedTabCard>

        {/* --- MARKET NEWS SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market News</Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <NewsCarousel />
        </View>

      </View>
    </ScrollView>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  page: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 32 : 0,
    paddingTop: 12,
    backgroundColor: "transparent",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
    resizeMode: "contain",
  },
  statLabel: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 13,
  },
  statValue: {
    fontWeight: "700",
    color: "#0f1724",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f1724",
  },
  link: {
    color: "#0f62fe",
    fontWeight: "600",
  },
  smallCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 16,
  },
  smallCoursesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 12,
  },
});