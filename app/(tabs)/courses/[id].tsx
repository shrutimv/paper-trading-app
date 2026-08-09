// app/(tabs)/courses/[id].tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";

/* -------------------- types -------------------- */
type Chapter = { id: string; title: string; duration: string };
type Course = {
  id: string;
  title: string;
  level: string;
  totalDuration: string;
  description: string;
  xpReward: number;
  hero?: any;
  video?: any;
  chapters: Chapter[];
};

const COURSES_DETAIL: Record<string, Course> = {
  c1: {
    id: "c1",
    title: "Introduction to Stock Market Basics",
    level: "Beginner",
    totalDuration: "45 min",
    xpReward: 100,
    description:
      "Master the essential fundamentals of Indian & Global stock exchanges. Learn how supply and demand drive prices, understand bull vs. bear trends, and place your first paper trade with confidence.",
    hero: require("../../../assets/images/Course/1.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c1-1", title: "Stock Market Fundamentals & Exchanges", duration: "10 min" },
      { id: "c1-2", title: "Bulls vs. Bears: Market Cycles & Trends", duration: "8 min" },
      { id: "c1-3", title: "How to Read Candlestick Charts", duration: "15 min" },
      { id: "c1-4", title: "Order Types: CNC, MIS, Limit & Stop-Loss", duration: "12 min" },
    ],
  },
  c2: {
    id: "c2",
    title: "Technical Analysis Mastery",
    level: "Advanced",
    totalDuration: "65 min",
    xpReward: 250,
    description:
      "Deep dive into price action dynamics, chart patterns, multi-timeframe analysis, and mathematical momentum indicators like RSI and MACD to pinpoint high-probability trade setups.",
    hero: require("../../../assets/images/Course/2.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c2-1", title: "Support, Resistance & Supply Zones", duration: "14 min" },
      { id: "c2-2", title: "Moving Averages & Trend Filtering", duration: "12 min" },
      { id: "c2-3", title: "Mastering RSI & MACD Momentum", duration: "18 min" },
      { id: "c2-4", title: "Breakout & Pullback Execution Strategy", duration: "21 min" },
    ],
  },
  c3: {
    id: "c3",
    title: "Derivatives & Options for Beginners",
    level: "Beginner",
    totalDuration: "50 min",
    xpReward: 150,
    description:
      "Demystify Call & Put options, understand strike prices, expiration cycles, Option Greeks (Delta, Theta), and how to hedge your long-term portfolio with derivatives.",
    hero: require("../../../assets/images/Course/3.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c3-1", title: "Introduction to Futures & Options (F&O)", duration: "10 min" },
      { id: "c3-2", title: "Call vs. Put Options: Rights & Obligations", duration: "12 min" },
      { id: "c3-3", title: "Option Greeks: Delta, Theta & Decay", duration: "15 min" },
      { id: "c3-4", title: "Building Your First Risk-Defined Strategy", duration: "13 min" },
    ],
  },
  c4: {
    id: "c4",
    title: "Algorithmic Trading Basics",
    level: "Intermediate",
    totalDuration: "55 min",
    xpReward: 200,
    description:
      "Explore quantitative trading principles, backtesting methodologies, algorithmic rule creation, and how quantitative hedge funds automate trade execution.",
    hero: require("../../../assets/images/Course/4.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c4-1", title: "What is Algorithmic Trading?", duration: "10 min" },
      { id: "c4-2", title: "Mean-Reversion vs. Momentum Models", duration: "15 min" },
      { id: "c4-3", title: "Backtesting & Measuring Sharpe Ratio", duration: "16 min" },
      { id: "c4-4", title: "Risk Management in Automated Systems", duration: "14 min" },
    ],
  },
  c5: {
    id: "c5",
    title: "Fundamental Analysis & Valuation",
    level: "Intermediate",
    totalDuration: "60 min",
    xpReward: 200,
    description:
      "Learn to analyze company balance sheets, profit & loss statements, cash flow metrics, P/E ratios, ROE, and intrinsic value estimation like legendary value investors.",
    hero: require("../../../assets/images/Course/5.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c5-1", title: "Deciphering Financial Statements", duration: "15 min" },
      { id: "c5-2", title: "Key Ratios: P/E, P/B, ROE & Debt Ratios", duration: "15 min" },
      { id: "c5-3", title: "Evaluating Economic Moats & Management", duration: "14 min" },
      { id: "c5-4", title: "Discounted Cash Flow (DCF) Valuation", duration: "16 min" },
    ],
  },
  c6: {
    id: "c6",
    title: "Global Markets & Macroeconomics",
    level: "Advanced",
    totalDuration: "50 min",
    xpReward: 220,
    description:
      "Understand how central bank interest rates, inflation, crude oil prices, dollar index fluctuations, and global geopolitical events impact domestic stock indices.",
    hero: require("../../../assets/images/Course/6.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c6-1", title: "Central Banks, Interest Rates & Inflation", duration: "12 min" },
      { id: "c6-2", title: "Currency, Oil & Commodities Impact", duration: "12 min" },
      { id: "c6-3", title: "Intermarket Correlations (US vs. India)", duration: "14 min" },
      { id: "c6-4", title: "Navigating Volatility & Global Crises", duration: "12 min" },
    ],
  },
};

const STORAGE_KEY_PREFIX = "@papertrade:courseCompleted:";
const MAX_CONTENT_WIDTH = 760;

export default function CourseDetails() {
  const router = useRouter();
  const params = useLocalSearchParams() as { id?: string };
  const courseId = params.id ?? "c1";
  const course = COURSES_DETAIL[courseId] || COURSES_DETAIL["c1"];

  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [videoLoading, setVideoLoading] = useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + courseId);
        if (!mounted) return;
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          const map: Record<string, boolean> = {};
          arr.forEach((id) => (map[id] = true));
          setCompleted(map);
        } else {
          setCompleted({});
        }
      } catch (err) {
        console.warn("load completed failed", err);
        setCompleted({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  const persistCompleted = React.useCallback(
    async (map: Record<string, boolean>) => {
      try {
        const arr = Object.keys(map).filter((k) => map[k]);
        await AsyncStorage.setItem(STORAGE_KEY_PREFIX + courseId, JSON.stringify(arr));
      } catch (e) {
        console.warn("save failed", e);
      }
    },
    [courseId]
  );

  const toggleChapter = React.useCallback(
    (chapterId: string) => {
      const next = { ...completed, [chapterId]: !completed[chapterId] };
      if (!next[chapterId]) delete next[chapterId];
      setCompleted(next);
      persistCompleted(next);
    },
    [completed, persistCompleted]
  );

  const total = course.chapters.length;
  const done = Object.keys(completed).filter((k) => completed[k]).length;
  const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* HEADER NAV */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.navTitle} numberOfLines={1}>
          {course.title}
        </Text>

        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={14} color="#f59e0b" />
          <Text style={styles.xpText}>+{course.xpReward} XP</Text>
        </View>
      </View>

      <FlatList
        data={course.chapters}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.contentWrap}>
            {/* VIDEO PLAYER HERO */}
            <View style={styles.videoCard}>
              <Video
                source={course.video}
                style={styles.video}
                useNativeControls
                resizeMode={"cover" as ResizeMode}
                onLoadStart={() => setVideoLoading(true)}
                onLoad={() => setVideoLoading(false)}
                onError={(e) => {
                  console.log("Video playback note:", e);
                  setVideoLoading(false);
                }}
              />
              {videoLoading && (
                <View style={styles.videoOverlay}>
                  <ActivityIndicator size="large" color="#2563eb" />
                </View>
              )}
            </View>

            {/* METADATA PILLS */}
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="speedometer-outline" size={13} color={colors.accent} />
                <Text style={styles.metaPillText}>{course.level}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaPillText}>{course.totalDuration}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="star" size={13} color="#f59e0b" />
                <Text style={styles.metaPillText}>4.9 (1.2k)</Text>
              </View>
            </View>

            {/* TITLE & DESCRIPTION */}
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseDesc}>{course.description}</Text>

            {/* PROGRESS CARD */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressHeading}>Your Course Progress</Text>
                  <Text style={styles.progressSub}>
                    {done} of {total} chapters completed
                  </Text>
                </View>
                <View style={styles.pctBadge}>
                  <Text style={styles.pctText}>{progressPct}%</Text>
                </View>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
            </View>

            {/* SECTION HEADING */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Curriculum Lessons</Text>
              <Text style={styles.sectionSub}>{total} modules</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const isDone = !!completed[item.id];
          return (
            <Pressable
              onPress={() => toggleChapter(item.id)}
              style={({ pressed }) => [
                styles.chapterCard,
                isDone && styles.chapterCardDone,
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
            >
              {/* STATUS ICON */}
              <View style={[styles.chapterIconBox, isDone && styles.chapterIconBoxDone]}>
                {isDone ? (
                  <Ionicons name="checkmark-sharp" size={18} color="#ffffff" />
                ) : (
                  <Text style={styles.chapterNum}>{String(index + 1).padStart(2, "0")}</Text>
                )}
              </View>

              {/* DETAILS */}
              <View style={styles.chapterInfo}>
                <Text style={[styles.chapterTitle, isDone && styles.chapterTitleDone]}>
                  {item.title}
                </Text>
                <View style={styles.chapterDurationRow}>
                  <Ionicons name="play-circle-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.chapterDuration}>{item.duration}</Text>
                  {isDone && <Text style={styles.completedTag}>• Completed</Text>}
                </View>
              </View>

              {/* ACTION TOGGLE */}
              <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                <Ionicons
                  name={isDone ? "checkbox" : "square-outline"}
                  size={22}
                  color={isDone ? "#10b981" : colors.textSecondary}
                />
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

/* -------------------- styles -------------------- */
const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    navTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
      marginHorizontal: 12,
    },
    xpBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
      gap: 4,
    },
    xpText: {
      fontSize: 12,
      fontWeight: "800",
      color: isDark ? "#fbbf24" : "#b45309",
    },

    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
      maxWidth: MAX_CONTENT_WIDTH,
      width: "100%",
      alignSelf: "center",
    },
    contentWrap: {
      paddingTop: 16,
      paddingBottom: 8,
    },

    videoCard: {
      width: "100%",
      height: 210,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: "#000",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
    },
    video: {
      width: "100%",
      height: "100%",
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
    },

    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      marginBottom: 12,
    },
    metaPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 5,
    },
    metaPillText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    courseTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    courseDesc: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 18,
    },

    progressCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    progressHeading: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    progressSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    pctBadge: {
      backgroundColor: isDark ? "rgba(37, 99, 235, 0.2)" : "#eff6ff",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(37, 99, 235, 0.4)" : "#bfdbfe",
    },
    pctText: {
      fontSize: 13,
      fontWeight: "900",
      color: "#2563eb",
    },

    progressBarTrack: {
      height: 8,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
      borderRadius: 10,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: "#2563eb",
      borderRadius: 10,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      marginTop: 6,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.text,
    },
    sectionSub: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    chapterCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chapterCardDone: {
      borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)",
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.05)" : "#f0fdf4",
    },

    chapterIconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    chapterIconBoxDone: {
      backgroundColor: "#10b981",
      borderColor: "#10b981",
    },
    chapterNum: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
    },

    chapterInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },
    chapterTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 18,
    },
    chapterTitleDone: {
      color: isDark ? "#86efac" : "#15803d",
    },
    chapterDurationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    chapterDuration: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    completedTag: {
      fontSize: 11,
      fontWeight: "700",
      color: "#10b981",
      marginLeft: 4,
    },

    checkbox: {
      padding: 4,
    },
    checkboxDone: {},
  });
