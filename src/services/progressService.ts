// src/services/progressService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@/src/config/api";

export async function getScopedKeys(): Promise<{
  puzzlesKey: string;
  coursesKey: string;
  streakKey: string;
  lastActiveKey: string;
  userId: string | null;
}> {
  let userId: string | null = null;
  try {
    const session = await AsyncStorage.getItem("userSession");
    if (session) {
      const u = JSON.parse(session);
      if (u && !u.isGuest && (u.id || u._id)) {
        userId = String(u.id || u._id);
      }
    }
  } catch (_) {}

  const prefix = userId ? `user_${userId}` : "guest";
  return {
    puzzlesKey: `@paper_puzzles_${prefix}`,
    coursesKey: `@paper_courses_${prefix}`,
    streakKey: `@paper_streak_${prefix}`,
    lastActiveKey: `@paper_last_active_${prefix}`,
    userId,
  };
}

/**
 * Record a puzzle as solved.
 * Guest users: saved in user-scoped AsyncStorage.
 * Logged-in users: saved in user-scoped AsyncStorage AND synchronized to MongoDB Atlas.
 */
export async function recordPuzzleSolved(): Promise<number> {
  try {
    const { puzzlesKey, userId } = await getScopedKeys();
    const currentStr = await AsyncStorage.getItem(puzzlesKey);
    const count = currentStr ? parseInt(currentStr, 10) : 0;
    const newCount = (isNaN(count) ? 0 : count) + 1;
    await AsyncStorage.setItem(puzzlesKey, newCount.toString());

    // Check if logged in
    if (userId) {
      fetch(`${BASE_URL}/api/user/gamification`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ puzzlesCompleted: newCount }),
      }).catch((err) => console.log("[progressService] DB puzzle sync error:", err));
    }

    return newCount;
  } catch (err) {
    console.warn("[progressService] recordPuzzleSolved error:", err);
    return 1;
  }
}

/**
 * Record a course or academy module as completed.
 * Guest users: saved in user-scoped AsyncStorage.
 * Logged-in users: saved in user-scoped AsyncStorage AND synchronized to MongoDB Atlas.
 */
export async function recordCourseCompleted(courseOrModuleId: string): Promise<string[]> {
  try {
    const { coursesKey, userId } = await getScopedKeys();
    const raw = await AsyncStorage.getItem(coursesKey);
    const list: string[] = raw ? JSON.parse(raw) : [];

    if (!list.includes(courseOrModuleId)) {
      list.push(courseOrModuleId);
      await AsyncStorage.setItem(coursesKey, JSON.stringify(list));
    }

    if (userId) {
      fetch(`${BASE_URL}/api/user/gamification`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coursesCompleted: list }),
      }).catch((err) => console.log("[progressService] DB course sync error:", err));
    }

    return list;
  } catch (err) {
    console.warn("[progressService] recordCourseCompleted error:", err);
    return [courseOrModuleId];
  }
}

/**
 * Get real progress counts (puzzles & courses).
 * For logged-in users, the database is the authoritative source of truth.
 * For guests, user-scoped local storage is used.
 */
export async function getRealProgress(): Promise<{
  puzzlesSolved: number;
  coursesCompletedCount: number;
}> {
  try {
    const { puzzlesKey, coursesKey, userId } = await getScopedKeys();

    let puzzles = 0;
    let coursesCount = 0;

    // 1. If logged in, fetch authoritative stats from MongoDB Atlas
    if (userId) {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const dbUser = data.user;
          if (dbUser) {
            puzzles = typeof dbUser.puzzlesCompleted === "number" ? dbUser.puzzlesCompleted : 0;
            const validCourses = Array.isArray(dbUser.coursesCompleted)
              ? dbUser.coursesCompleted.filter((id: string) => !id.startsWith("module_"))
              : [];
            coursesCount = validCourses.length;

            // Cache for this specific user
            await AsyncStorage.setItem(puzzlesKey, puzzles.toString());
            await AsyncStorage.setItem(coursesKey, JSON.stringify(dbUser.coursesCompleted || []));

            return {
              puzzlesSolved: puzzles,
              coursesCompletedCount: coursesCount,
            };
          }
        }
      } catch (_) {
        // Fallback to this user's local cache if network offline
      }
    }

    // 2. Guest or offline fallback for this specific user
    const localPuzzles = await AsyncStorage.getItem(puzzlesKey);
    if (localPuzzles !== null) {
      puzzles = parseInt(localPuzzles, 10);
      if (isNaN(puzzles) || puzzles < 0) puzzles = 0;
    }

    const rawCourseList = await AsyncStorage.getItem(coursesKey);
    const courseList: string[] = rawCourseList ? JSON.parse(rawCourseList) : [];
    const validFullCourses = courseList.filter((id) => !id.startsWith("module_"));
    coursesCount = validFullCourses.length;

    return {
      puzzlesSolved: puzzles,
      coursesCompletedCount: coursesCount,
    };
  } catch (err) {
    console.warn("[progressService] getRealProgress error:", err);
    return { puzzlesSolved: 0, coursesCompletedCount: 0 };
  }
}
