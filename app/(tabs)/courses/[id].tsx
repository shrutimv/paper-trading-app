// app/(tabs)/courses/[id].tsx
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video, type ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* -------------------- types -------------------- */
type Chapter = { id: string; title: string; duration: string };
type Course = {
  id: string;
  title: string;
  description: string;
  hero?: any;
  video?: any; // keep `any` because require() returns a number module id at runtime
  chapters: Chapter[];
};

const COURSES_DETAIL: Record<string, Course> = {
  c1: {
    id: "c1",
    title: "Introduction to Stock Market Basics",
    description:
      "This course covers fundamental concepts of the stock market — bulls & bears, how to read simple charts, and how to start your paper trading journey.",
    hero: require("../../../assets/images/Course/1.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c1-1", title: "What is the Stock Market?", duration: "10 min" },
      { id: "c1-2", title: "Understanding Bulls & Bears", duration: "8 min" },
      { id: "c1-3", title: "How to Read a Stock Chart", duration: "15 min" },
      { id: "c1-4", title: "Types of Stocks", duration: "12 min" },
    ],
  },

  c2: {
    id: "c2",
    title: "Technical Analysis Mastery",
    description:
      "This course covers fundamental concepts of the stock market — bulls & bears, how to read simple charts, and how to start your paper trading journey.",
    hero: require("../../../assets/images/Course/1.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c2-1", title: "What is the Stock Market?", duration: "10 min" },
      { id: "c2-2", title: "Understanding Bulls & Bears", duration: "8 min" },
      { id: "c2-3", title: "How to Read a Stock Chart", duration: "15 min" },
      { id: "c2-4", title: "Types of Stocks", duration: "12 min" },
    ],
  },

  c4: {
    id: "c4",
    title: "Derivatives for Beginners",
    description:
      "This course covers fundamental concepts of the stock market — bulls & bears, how to read simple charts, and how to start your paper trading journey.",
    hero: require("../../../assets/images/Course/1.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c4-1", title: "What is the Stock Market?", duration: "10 min" },
      { id: "c4-2", title: "Understanding Bulls & Bears", duration: "8 min" },
      { id: "c4-3", title: "How to Read a Stock Chart", duration: "15 min" },
      { id: "c4-4", title: "Types of Stocks", duration: "12 min" },
    ],
  },

  c5: {
    id: "c5",
    title: "Algorithmic Trading Basics",
    description:
      "This course covers fundamental concepts of the stock market — bulls & bears, how to read simple charts, and how to start your paper trading journey.",
    hero: require("../../../assets/images/Course/1.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c5-1", title: "What is the Stock Market?", duration: "10 min" },
      { id: "c5-2", title: "Understanding Bulls & Bears", duration: "8 min" },
      { id: "c5-3", title: "How to Read a Stock Chart", duration: "15 min" },
      { id: "c5-4", title: "Types of Stocks", duration: "12 min" },
    ],
  },

  c6: {
    id: "c6",
    title: "Fundamental Analysis",
    description:
      "This course covers fundamental concepts of the stock market — bulls & bears, how to read simple charts, and how to start your paper trading journey.",
    hero: require("../../../assets/images/Course/1.png"),
    video: require("../../../assets/videos/stock-sample.mp4"),
    chapters: [
      { id: "c6-1", title: "What is the Stock Market?", duration: "10 min" },
      { id: "c6-2", title: "Understanding Bulls & Bears", duration: "8 min" },
      { id: "c6-3", title: "How to Read a Stock Chart", duration: "15 min" },
      { id: "c6-4", title: "Types of Stocks", duration: "12 min" },
    ],
  },
};

const STORAGE_KEY_PREFIX = "@papertrade:courseCompleted:";
const MAX_CONTENT_WIDTH = 980;
const { width: SCREEN_W } = Dimensions.get("window");

/* -------------------- component -------------------- */
export default function CourseDetails() {
  const router = useRouter();
  const params = useLocalSearchParams() as { id?: string };
  const courseId = params.id ?? "c1";
  const course = COURSES_DETAIL[courseId];

  // state
  const [completed, setCompleted] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [videoLoading, setVideoLoading] = React.useState<boolean>(true);

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
        await AsyncStorage.setItem(
          STORAGE_KEY_PREFIX + courseId,
          JSON.stringify(arr)
        );
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

  if (!course) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course not found</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.center}>
          <Text>Sorry — course not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = course.chapters.length;
  const done = Object.keys(completed).filter((k) => completed[k]).length;
  const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

  const isWeb = Platform.OS === "web";
  const contentSidePadding = isWeb
    ? Math.max(16, (SCREEN_W - Math.min(SCREEN_W, MAX_CONTENT_WIDTH)) / 2)
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Video (expo-av Video accepts require() directly) */}
            <View
              style={[
                styles.headerWrap,
                { paddingHorizontal: contentSidePadding },
              ]}
            >
              <View
                style={[
                  styles.contentInner,
                  isWeb ? styles.contentInnerWeb : undefined,
                ]}
              >
                <View style={styles.videoWrap}>
                  <Video
                    source={course.video}
                    style={styles.video}
                    useNativeControls

                    resizeMode={"cover" as ResizeMode}
                    onLoadStart={() => setVideoLoading(true)}
                    onLoad={() => setVideoLoading(false)}
                  />
                  {videoLoading && (
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator />
                    </View>
                  )}
                </View>

                {/* Title & description */}
                <View style={styles.inner}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseDesc}>{course.description}</Text>

                  {/* Progress */}
                  <Text style={[styles.sectionHeading, { marginTop: 12 }]}>
                    Course Progress
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPct}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {done}/{total} Chapters Complete
                  </Text>

                  <Text style={[styles.sectionHeading, { marginTop: 18 }]}>
                    Course Content
                  </Text>
                </View>
              </View>
            </View>
          </>
        }
        data={course.chapters}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => {
          const isDone = !!completed[item.id];
          return (
            <View style={[{ paddingHorizontal: contentSidePadding }]}>
              <View
                style={[
                  styles.contentInner,
                  isWeb ? styles.contentInnerWeb : undefined,
                ]}
              >
                <Pressable
                  onPress={() => toggleChapter(item.id)}
                  style={({ pressed }) => [
                    styles.chapter,
                    isDone ? styles.chapterDone : null,
                    pressed ? { opacity: 0.85 } : null,
                  ]}
                >
                  <View style={styles.chapterLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        isDone ? styles.iconCircleDone : null,
                      ]}
                    >
                      {isDone ? (
                        <MaterialIcons name="check" size={18} color="#fff" />
                      ) : (
                        <MaterialIcons
                          name="play-arrow"
                          size={18}
                          color="#374151"
                        />
                      )}
                    </View>
                  </View>

                  <View style={styles.chapterBody}>
                    <Text
                      style={[
                        styles.chapterTitle,
                        isDone ? { color: "#0f1724" } : null,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.chapterMeta}>{item.duration}</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 140 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No chapters found</Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      )}
    </SafeAreaView>
  );
}

/* -------------------- styles -------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  topNav: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBtn: { padding: 8, borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f1724" },
  smallAvatar: { width: 36, height: 36, borderRadius: 18 },

  headerWrap: {
    // outer header padding handled dynamically for web vs native
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },

  // center-constraining inner wrapper used on web to prevent content stretching
  contentInner: {
    width: "100%",
  },
  contentInnerWeb: {
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },

  videoWrap: {
    // video container keeps full width of contentInner
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: { width: "100%", height: 260 },

  inner: { paddingTop: 12, paddingBottom: 8, paddingHorizontal: 0 },
  courseTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f1724",
    marginBottom: 8,
  },
  courseDesc: { color: "#475569", lineHeight: 20 },

  sectionHeading: { fontSize: 14, fontWeight: "800", color: "#0f1724" },

  progressBar: {
    height: 8,
    backgroundColor: "#eef2f6",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#2563eb" },
  progressLabel: { marginTop: 6, color: "#6b7280", fontSize: 12 },

  chapter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    // shadow
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  chapterDone: {
    backgroundColor: "#e6f0ff",
  },

  chapterLeft: { width: 50, alignItems: "center" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e9ef",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleDone: {
    backgroundColor: "#0f62fe",
    borderColor: "#0f62fe",
  },

  chapterBody: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: "700", color: "#0f1724" },
  chapterMeta: { fontSize: 13, color: "#6b7280", marginTop: 4 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "40%",
    alignItems: "center",
  },
});
