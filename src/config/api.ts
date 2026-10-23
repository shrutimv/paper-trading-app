import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "https://paper-trade-node.onrender.com";

/**
 * Returns authentication headers containing the current session user ID
 * to ensure robust authentication even if native cookie persistence fails on mobile.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const sessionStr = await AsyncStorage.getItem("userSession");
    if (sessionStr) {
      const user = JSON.parse(sessionStr);
      if (user && (user.id || user._id)) {
        return {
          "x-user-id": String(user.id || user._id),
          "x-user-username": String(user.username || ""),
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return {};
}
