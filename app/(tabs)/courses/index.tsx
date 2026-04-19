// app/(tabs)/courses.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import PageTransition from "@/components/PageTransition";
import CourseCard from "../../../components/CourseCard";
import LevelsCarousel from "../../../components/LevelsCarousel";

const { width: SCREEN_W } = Dimensions.get("window");
const H_GUTTER = 16;
const COL_GAP = 12;
const ITEM_WIDTH = Math.round((SCREEN_W - H_GUTTER * 2 - COL_GAP) / 2);

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];



/**
 * Replace these require(...) paths with your actual image filenames in:
 * assets/images/courses/
 */
const COURSES = [
  {
    id: "c1",
    title: "Introduction to Stock Market",
    subtitle: "Beginner • 25% complete",
    image: require("../../../assets/images/Course/1.png"),
  },
  {
    id: "c2",
    title: "Technical Analysis Mastery",
    subtitle: "Advanced • Not started",
    image: require("../../../assets/images/Course/2.png"),
  },
  {
    id: "c3",
    title: "Derivatives for Beginners",
    subtitle: "Beginner • 75% complete",
    image: require("../../../assets/images/Course/3.png"),
  },
  {
    id: "c4",
    title: "Algorithmic Trading Basics",
    subtitle: "Intermediate • Not started",
    image: require("../../../assets/images/Course/4.png"),
  },
  {
    id: "c5",
    title: "Fundamental Analysis",
    subtitle: "Intermediate • 50% complete",
    image: require("../../../assets/images/Course/5.png"),
  },
  {
    id: "c6",
    title: "Global Markets",
    subtitle: "Advanced • 10% complete",
    image: require("../../../assets/images/Course/6.png"),
  },
];

export default function CoursesScreen() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [activeLevel, setActiveLevel] = React.useState<string>("All");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return COURSES.filter((c) => {
      if (activeLevel !== "All") {
        if (!c.subtitle.toLowerCase().includes(activeLevel.toLowerCase())) return false;
      }
      if (!q) return true;
      return c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q);
    });
  }, [search, activeLevel]);

  const renderCourse = ({ item }: { item: typeof COURSES[number] }) => {
    // On web limit each card width so they don't stretch too wide.
    // On native keep original ITEM_WIDTH to preserve mobile layout.
    const cardWidth = Platform.OS === "web" ? Math.min(520, ITEM_WIDTH) : ITEM_WIDTH;
    // center the card column on web for a nicer layout when screen is wide
    const wrapperAlign = Platform.OS === "web" ? { alignSelf: "center" } : {};
    return (
      <View style={{ width: cardWidth, marginBottom: 14, ...wrapperAlign }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`../courses/${item.id}`)}
        >
          <CourseCard small title={item.title} subtitle={item.subtitle} image={item.image} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <PageTransition>
    <SafeAreaView style={styles.safe}>
      {/* Top nav */}
<View style={styles.topNav}>
  {/* Back Button */}
  <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
    <MaterialIcons name="arrow-back" size={22} color="#111827" />
  </TouchableOpacity>

  {/* Title */}
  <Text style={styles.title}>Courses</Text>

  {/* Right Side Icons */}
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    
    {/* Notification Icon - KEEP THIS */}
    <TouchableOpacity style={styles.iconBtn} onPress={() => console.log("notifications")}>
      <MaterialIcons name="notifications-none" size={22} color="#111827" />
    </TouchableOpacity>

    {/* ❌ DELETED THE PROFILE ICON TOUCHABLEOPACITY HERE ❌ */}

  </View>
</View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color="#9aa3b2" />
        <TextInput
          placeholder="Search for topics like 'Futures & Options'"
          placeholderTextColor="#9aa3b2"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Levels */}
      <LevelsCarousel levels={LEVELS} active={activeLevel} onSelect={(lvl) => setActiveLevel(lvl)} />

      {/* Courses grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ paddingHorizontal: H_GUTTER, paddingBottom: 84, paddingTop: 8 }}
        renderItem={renderCourse}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
    </PageTransition>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },

  topNav: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f6f7fb",
  },

  iconBtn: { padding: 8, borderRadius: 8 },

  title: { fontSize: 18, fontWeight: "800", color: "#0f1724" },

  smallAvatar: { width: 36, height: 36, borderRadius: 18 },

  searchWrap: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: "#0f1724",
  },

  columnWrapper: {
    justifyContent: "space-between",
  },
});
