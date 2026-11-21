// src/services/progressService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, getAuthHeaders } from "@/src/config/api";

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
 * Record a puzzle or quiz as solved.
 * Guest users: saved in user-scoped AsyncStorage.
 * Logged-in users: saved in user-scoped AsyncStorage AND synchronized to MongoDB Atlas.
 */
export async function recordPuzzleSolved(puzzleOrQuizId?: string): Promise<number> {
  try {
    const { puzzlesKey, userId } = await getScopedKeys();
    const listKey = `${puzzlesKey}_list`;

    let list: string[] = [];
    try {
      const rawList = await AsyncStorage.getItem(listKey);
      if (rawList) list = JSON.parse(rawList);
    } catch (_) {}

    const currentStr = await AsyncStorage.getItem(puzzlesKey);
    let count = currentStr ? parseInt(currentStr, 10) : 0;
    if (isNaN(count) || count < 0) count = 0;

    let newCount = count;
    if (puzzleOrQuizId) {
      if (!list.includes(puzzleOrQuizId)) {
        list.push(puzzleOrQuizId);
        await AsyncStorage.setItem(listKey, JSON.stringify(list));
        newCount = Math.max(count + 1, list.length);
      } else {
        newCount = Math.max(count, list.length);
      }
    } else {
      newCount = count + 1;
    }

    await AsyncStorage.setItem(puzzlesKey, newCount.toString());

    // Check if logged in & sync
    if (userId) {
      const authHeaders = await getAuthHeaders();
      fetch(`${BASE_URL}/api/user/gamification`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
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
      const authHeaders = await getAuthHeaders();
      fetch(`${BASE_URL}/api/user/gamification`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
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
 * For logged-in users, the database is the authoritative source of truth,
 * reconciled with any freshly solved quizzes/puzzles on the device.
 * For guests, user-scoped local storage is used.
 */
export async function getRealProgress(): Promise<{
  puzzlesSolved: number;
  coursesCompletedCount: number;
}> {
  try {
    const { puzzlesKey, coursesKey, userId } = await getScopedKeys();
    const listKey = `${puzzlesKey}_list`;

    let puzzles = 0;
    let coursesCount = 0;

    // Read local solved puzzle list and legacy module completion keys
    let localSolvedCount = 0;
    try {
      const rawList = await AsyncStorage.getItem(listKey);
      const list: string[] = rawList ? JSON.parse(rawList) : [];
      const localPuzzlesStr = await AsyncStorage.getItem(puzzlesKey);
      const parsedPuzzles = localPuzzlesStr ? parseInt(localPuzzlesStr, 10) : 0;

      // Also check keys for any already passed quiz modules (e.g. module_completed_*)
      const allKeys = await AsyncStorage.getAllKeys();
      const completedModules = allKeys.filter((k) => k.startsWith("module_completed_") || k.startsWith("quiz_completed_"));

      localSolvedCount = Math.max(
        isNaN(parsedPuzzles) ? 0 : parsedPuzzles,
        list.length,
        completedModules.length
      );
    } catch (_) {}

    // 1. If logged in, fetch authoritative stats from MongoDB Atlas
    if (userId) {
      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { ...authHeaders },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const dbUser = data.user;
          if (dbUser) {
            const dbPuzzles = typeof dbUser.puzzlesCompleted === "number" ? dbUser.puzzlesCompleted : 0;
            // Effective count takes the maximum of DB and local solved count
            puzzles = Math.max(dbPuzzles, localSolvedCount);

            const validCourses = Array.isArray(dbUser.coursesCompleted)
              ? dbUser.coursesCompleted.filter((id: string) => !id.startsWith("module_"))
              : [];
            coursesCount = validCourses.length;

            // If local solved was higher than DB (e.g. freshly solved quiz), push to DB immediately
            if (puzzles > dbPuzzles) {
              fetch(`${BASE_URL}/api/user/gamification`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders },
                credentials: "include",
                body: JSON.stringify({ puzzlesCompleted: puzzles }),
              }).catch(() => {});
            }

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
    puzzles = localSolvedCount;

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
