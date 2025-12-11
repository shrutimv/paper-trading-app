// app/(tabs)/index.tsx
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CourseCard from "../../components/CourseCard";
import Header from "../../components/Header";
import HorizontalCardCarousel from "../../components/HorizontalCardCarousel";
import PaperTradingCard from "../../components/PaperTradingCard";
import PuzzleCard from "../../components/PuzzleCard";
import SmallCard from "../../components/SmallCard";
import SmallCourseCard from "../../components/SmallCourseCard";

export default function Home() {
  // No change to any router behavior here
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 56 }}
    >
      {/* Centered page container on web/desktop so cards aren't stretched */}
      <View style={styles.page}>
        {/* Header */}
        <Header name="Ananya Sharma" />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Image
              source={require("../../assets/images/header/streak.png")}
              style={styles.statIcon}
            />
            <View>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>12 days</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Image
              source={require("../../assets/images/header/puzzel.png")}
              style={styles.statIcon}
            />
            <View>
              <Text style={styles.statLabel}>Puzzles</Text>
              <Text style={styles.statValue}>48</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Image
              source={require("../../assets/images/header/courses.png")}
              style={styles.statIcon}
            />
            <View>
              <Text style={styles.statLabel}>Courses</Text>
              <Text style={styles.statValue}>3</Text>
            </View>
          </View>
        </View>

        {/* Puzzles Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Puzzles</Text>
          <TouchableOpacity>
            <Text style={styles.link}>View all</Text>
          </TouchableOpacity>
        </View>

        <PuzzleCard />

        {/* Draggable small-card carousel */}
        <HorizontalCardCarousel cardWidth={260} cardSpacing={14}>
          <SmallCard
            title="Reading Volume"
            subtitle="Understand trade volume."
            progress={0.6}
          />

          <SmallCard
            title="Risk Management"
            subtitle="Learn to mitigate losses."
            tag="Popular"
          />

          <SmallCard
            title="Support & Resistance"
            subtitle="Identify key price levels."
            progress={0.15}
          />
        </HorizontalCardCarousel>

        {/* Courses Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Courses</Text>
          <TouchableOpacity>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>

        <CourseCard />

        <View style={styles.smallCoursesRow}>
          <View style={{ width: "48%" }}>
            <SmallCourseCard
              title="Intro to ETFs"
              subtitle="Beginner"
              progressLabel="25% complete"
              image={require("../../assets/images/smallCourses/1.png")}
            />
          </View>

          <View style={{ width: "48%" }}>
            <SmallCourseCard
              title="Fundamental Analysis"
              subtitle="Intermediate"
              progressLabel="0% complete"
              image={require("../../assets/images/smallCourses/2.png")}
            />
          </View>
        </View>

        {/* Paper Trading */}
        <Text style={[styles.sectionTitle, { marginLeft: 16, marginTop: 16 }]}>
          Paper Trading
        </Text>

        <View style={{ paddingHorizontal: 16 }}>
          <PaperTradingCard />
        </View>
      </View>
    </ScrollView>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb", // keep mobile background unchanged
  },

  // This is the centered page container used on web to avoid stretched cards
  page: {
    width: "100%",
    maxWidth: 1100, // most websites use a similar max width
    alignSelf: "center",
    // keep some side padding on narrow screens
    paddingHorizontal: Platform.OS === "web" ? 32 : 0,
    paddingTop: 12,
    backgroundColor: "transparent", // container is transparent; body bg handled in _layout.tsx
  },

  /* Stats */
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

  /* Sections */
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
