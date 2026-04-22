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
const H_GUTTER = 20; // Increased padding for premium feel
const COL_GAP = 16;
const ITEM_WIDTH = Math.round((SCREEN_W - H_GUTTER * 2 - COL_GAP) / 2);

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

const COURSES = [
  { id: "c1", title: "Introduction to Stock Market", subtitle: "Beginner • 25% complete", image: require("../../../assets/images/Course/1.png") },
  { id: "c2", title: "Technical Analysis Mastery", subtitle: "Advanced • Not started", image: require("../../../assets/images/Course/2.png") },
  { id: "c3", title: "Derivatives for Beginners", subtitle: "Beginner • 75% complete", image: require("../../../assets/images/Course/3.png") },
  { id: "c4", title: "Algorithmic Trading Basics", subtitle: "Intermediate • Not started", image: require("../../../assets/images/Course/4.png") },
  { id: "c5", title: "Fundamental Analysis", subtitle: "Intermediate • 50% complete", image: require("../../../assets/images/Course/5.png") },
  { id: "c6", title: "Global Markets", subtitle: "Advanced • 10% complete", image: require("../../../assets/images/Course/6.png") },
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
    const cardWidth = Platform.OS === "web" ? Math.min(520, ITEM_WIDTH) : ITEM_WIDTH;
    const wrapperAlign = Platform.OS === "web" ? { alignSelf: "center" } : {};
    return (
      <View style={{ width: cardWidth, marginBottom: 16, ...wrapperAlign }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`../courses/${item.id}`)}
          style={styles.cardShadowWrapper}
        >
          <CourseCard small title={item.title} subtitle={item.subtitle} image={item.image} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <PageTransition>
    <SafeAreaView style={styles.safe}>
      
      {/* PREMIUM HEADER */}
      <View style={styles.topNav}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.greeting}>LEARNING HUB</Text>
          <Text style={styles.title}>Active Courses</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => console.log("notifications")}>
          <MaterialIcons name="notifications-none" size={22} color="#0f62fe" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR (FinTech Style) */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color="#64748B" />
        <TextInput
          placeholder="Search topics (e.g. 'Options')"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* LEVELS */}
      <View style={{ marginBottom: 10 }}>
        <LevelsCarousel levels={LEVELS} active={activeLevel} onSelect={(lvl) => setActiveLevel(lvl)} />
      </View>

      {/* COURSES GRID */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ paddingHorizontal: H_GUTTER, paddingBottom: 100, paddingTop: 10 }}
        renderItem={renderCourse}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
    </PageTransition>
  );
}

/* PREMIUM STYLES */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },

  topNav: {
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 30,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleGroup: {
    flexDirection: 'column',
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

  searchWrap: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: {
    marginLeft: 12,
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: '500',
  },

  columnWrapper: {
    justifyContent: "space-between",
  },
  
  // Wrap the external CourseCard to give it the global shadow feel
  cardShadowWrapper: {
    backgroundColor: '#fff',
    borderRadius: 20, // Match internal card if needed
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  }
});