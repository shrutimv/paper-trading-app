// src/services/progressService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@/src/config/api";

const PUZZLES_KEY = "paper_puzzles_completed";
const COURSES_KEY = "paper_courses_completed_list";

/**
 * Record a puzzle as solved.
 * Guest users: saved directly in AsyncStorage.
 * Logged-in users: saved in AsyncStorage AND synchronized to MongoDB Atlas via PUT /api/user/gamification.
 */
export async function recordPuzzleSolved(): Promise<number> {
  try {
    const currentStr = await AsyncStorage.getItem(PUZZLES_KEY);
    const count = currentStr ? parseInt(currentStr, 10) : 0;
    const newCount = count + 1;
    await AsyncStorage.setItem(PUZZLES_KEY, newCount.toString());

    // Check if logged in
    const session = await AsyncStorage.getItem("userSession");
    if (session) {
      const user = JSON.parse(session);
      if (!user.isGuest) {
        // Sync to MongoDB Atlas
        fetch(`${BASE_URL}/api/user/gamification`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ puzzlesCompleted: newCount }),
        }).catch((err) => console.log("[progressService] DB puzzle sync error:", err));
      }
    }

    return newCount;
  } catch (err) {
    console.warn("[progressService] recordPuzzleSolved error:", err);
    return 1;
  }
}

/**
 * Record a course or academy module as completed.
 * Guest users: saved in AsyncStorage.
 * Logged-in users: saved in AsyncStorage AND synchronized to MongoDB Atlas.
 */
export async function recordCourseCompleted(courseOrModuleId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(COURSES_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];

    if (!list.includes(courseOrModuleId)) {
      list.push(courseOrModuleId);
      await AsyncStorage.setItem(COURSES_KEY, JSON.stringify(list));
    }

    // Check if logged in
    const session = await AsyncStorage.getItem("userSession");
    if (session) {
      const user = JSON.parse(session);
      if (!user.isGuest) {
        fetch(`${BASE_URL}/api/user/gamification`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ coursesCompleted: list }),
        }).catch((err) => console.log("[progressService] DB course sync error:", err));
      }
    }

    return list;
  } catch (err) {
    console.warn("[progressService] recordCourseCompleted error:", err);
    return [courseOrModuleId];
  }
}

/**
 * Get real progress counts (puzzles & courses).
 * If logged-in, reconciles with the database.
 */
export async function getRealProgress(): Promise<{
  puzzlesSolved: number;
  coursesCompletedCount: number;
}> {
  try {
    let puzzles = 0;
    let coursesCount = 0;

    // Check local storage first
    const localPuzzles = await AsyncStorage.getItem(PUZZLES_KEY);
    if (localPuzzles !== null) {
      puzzles = parseInt(localPuzzles, 10);
    }

    // Read all keys to accurately count completed modules & courses
    const allKeys = await AsyncStorage.getAllKeys();
    const completedModuleKeys = allKeys.filter(
      (k) => k.startsWith("module_completed_") || k.startsWith("@papertrade:courseCompleted:")
    );
    const rawCourseList = await AsyncStorage.getItem(COURSES_KEY);
    const courseList: string[] = rawCourseList ? JSON.parse(rawCourseList) : [];
    coursesCount = Math.max(completedModuleKeys.length, courseList.length);

    // If logged in, fetch from DB and take the higher value (or DB value)
    const session = await AsyncStorage.getItem("userSession");
    if (session) {
      const user = JSON.parse(session);
      if (!user.isGuest) {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/me`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            const dbUser = data.user;
            if (dbUser) {
              if (typeof dbUser.puzzlesCompleted === "number" && dbUser.puzzlesCompleted > puzzles) {
                puzzles = dbUser.puzzlesCompleted;
                await AsyncStorage.setItem(PUZZLES_KEY, puzzles.toString());
              } else if (puzzles > (dbUser.puzzlesCompleted || 0)) {
                // Local is ahead, sync up to DB
                fetch(`${BASE_URL}/api/user/gamification`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ puzzlesCompleted: puzzles }),
                }).catch(() => {});
              }

              if (Array.isArray(dbUser.coursesCompleted)) {
                const merged = Array.from(new Set([...courseList, ...dbUser.coursesCompleted]));
                coursesCount = Math.max(coursesCount, merged.length);
                await AsyncStorage.setItem(COURSES_KEY, JSON.stringify(merged));
              }
            }
          }
        } catch (_) {}
      }
    }

    return {
      puzzlesSolved: puzzles,
      coursesCompletedCount: coursesCount,
    };
  } catch (err) {
    console.warn("[progressService] getRealProgress error:", err);
    return { puzzlesSolved: 0, coursesCompletedCount: 0 };
  }
}
