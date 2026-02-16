// app/(tabs)/explore.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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

import LevelsCarousel from "../../components/LevelsCarousel";
import PuzzleItem from "../../components/PuzzleItem";
import { quizData } from "../../src/quizData"; // Importing your quiz data

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_MAX_WIDTH = 900;

// Original Puzzle Data
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
  // ... other puzzles
];

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export default function ExploreScreen() {
  const router = useRouter();
  const [activeLevel, setActiveLevel] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<'puzzles' | 'quizzes'>('puzzles');

  const filteredPuzzles = useMemo(() => {
    if (activeLevel === "All") return PUZZLE_DATA;
    return PUZZLE_DATA.filter((d) => d.level === activeLevel);
  }, [activeLevel]);

  const cardWrapperWidth = Platform.OS === "web" ? Math.min(CARD_MAX_WIDTH, SCREEN_W - 80) : "100%";

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/")}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Learning Hub</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* Section Toggle Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'puzzles' && styles.activeTab]} 
          onPress={() => setActiveTab('puzzles')}
        >
          <Text style={[styles.tabText, activeTab === 'puzzles' && styles.activeTabText]}>Puzzles</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'quizzes' && styles.activeTab]} 
          onPress={() => setActiveTab('quizzes')}
        >
          <Text style={[styles.tabText, activeTab === 'quizzes' && styles.activeTabText]}>Quizzes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'puzzles' ? (
        <>
          <LevelsCarousel levels={LEVELS} active={activeLevel} onSelect={(lvl) => setActiveLevel(lvl)} />
          <FlatList
            data={filteredPuzzles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.cardWrapper, { width: cardWrapperWidth, alignSelf: "center" }]}>
                <PuzzleItem
                  {...item}
                  onPress={() => router.push({ pathname: "/quiz", params: { moduleId: item.id } })}
                />
              </View>
            )}
            contentContainerStyle={styles.listContainer}
          />
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {quizData.modules.map((module) => (
            <TouchableOpacity 
              key={module.id} 
              style={styles.quizCard}
              onPress={() => router.push({ pathname: "/quiz", params: { moduleId: module.id } })}
            >
              <View style={styles.quizInfo}>
                <Text style={styles.quizTitle}>{module.title}</Text>
                <Text style={styles.quizDesc} numberOfLines={2}>{module.description}</Text>
                <Text style={styles.quizMeta}>10 Questions • +100 Points</Text>
              </View>
              <MaterialIcons name="play-circle-fill" size={40} color="#0f62fe" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f7fb" },
  topNav: { height: 64, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: "800", color: "#0f1724" },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ddd' },
  activeTab: { borderBottomColor: '#0f62fe' },
  tabText: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  activeTabText: { color: '#0f62fe' },
  listContainer: { paddingBottom: 100 },
  cardWrapper: { marginTop: 12, paddingHorizontal: 12 },
  quizCard: { 
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, 
    padding: 16, borderRadius: 12, flexDirection: 'row', 
    alignItems: 'center', elevation: 2 
  },
  quizInfo: { flex: 1 },
  quizTitle: { fontSize: 18, fontWeight: '700', color: '#0f1724' },
  quizDesc: { color: '#6b7280', marginTop: 4, fontSize: 14 },
  quizMeta: { color: '#0f62fe', fontWeight: '600', marginTop: 8, fontSize: 12 }
});