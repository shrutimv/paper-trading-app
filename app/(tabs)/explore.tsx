// app/(tabs)/explore.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import LevelsCarousel from "../../components/LevelsCarousel";
import PuzzleItem from "../../components/PuzzleItem";

/* ----- constants ----- */
const { width: SCREEN_W } = Dimensions.get("window");
// max content width for each card on web / large screens:
const CARD_MAX_WIDTH = 900;

const DATA = [
  {
    id: "p1",
    level: "Beginner",
    title: "The Bullish Engulfing Pattern",
    description: "Identify the correct entry point based on the chart pattern.",
    progress: 0.5,
    image: require("../../assets/images/Puzzle/p1.png"),
    buttonLabel: "Continue",
  },
  {
    id: "p2",
    level: "Intermediate",
    title: "Hedging with Futures",
    description: "Learn to minimize risk in your portfolio using futures contracts.",
    progress: 0.05,
    image: require("../../assets/images/Puzzle/p2.png"),
    buttonLabel: "Start",
  },
  {
    id: "p3",
    level: "Advanced",
    title: "Options Trading Strategies",
    description: "Master complex options strategies like iron condors and butterflies.",
    progress: 0,
    image: require("../../assets/images/Puzzle/p3.png"),
    buttonLabel: "Start",
  },
];

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced", "Options", "Futures"];

export default function PuzzlesScreen() {
  const router = useRouter();
  const [activeLevel, setActiveLevel] = React.useState<string>("All");

  const filtered = React.useMemo(() => {
    if (activeLevel === "All") return DATA;
    return DATA.filter((d) => d.level === activeLevel);
  }, [activeLevel]);

  // compute width for each card wrapper:
  const cardWrapperWidth =
    Platform.OS === "web" ? Math.min(CARD_MAX_WIDTH, SCREEN_W - 80) : "100%";

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top nav */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            // explicit route to Home tab
            router.push("/");
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.title}>Puzzles</Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => console.log("search")}>
            <MaterialIcons name="search" size={22} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => console.log("profile")}>
            <Image source={require("../../assets/images/profile/Avatar.png")} style={styles.smallAvatar} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Levels carousel */}
      <LevelsCarousel levels={LEVELS} active={activeLevel} onSelect={(lvl) => setActiveLevel(lvl)} />

      {/* Puzzle list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // WRAPPER: constrains width on web so cards don't stretch across very wide screens.
          <View
            style={[
              styles.cardWrapper,
              {
                width: cardWrapperWidth,
                alignSelf: Platform.OS === "web" ? "center" : "stretch",
              },
            ]}
          >
            <PuzzleItem
              image={item.image}
              level={item.level}
              title={item.title}
              description={item.description}
              progress={item.progress}
              buttonLabel={item.buttonLabel}
              onPress={() => {
                // placeholder navigation — replace if you have a puzzle detail route
                console.log("open puzzle:", item.id);
              }}
            />
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

/* ----- Styles ----- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },

  topNav: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f6f7fb",
  },

  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    color: "#0f1724",
  },

  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  listContainer: {
    paddingTop: 8,
    paddingBottom: 80,
    // Add some horizontal padding on web so the centered cards have breathing room
    paddingHorizontal: Platform.OS === "web" ? 40 : 0,
  },

  // wrapper that constrains each PuzzleItem on web
  cardWrapper: {
    marginTop: 12,
    marginBottom: 12,
    // add a tiny horizontal padding for visual spacing on mobile as well
    paddingHorizontal: Platform.OS === "web" ? 0 : 12,
  },
});
