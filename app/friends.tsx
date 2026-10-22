import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { BASE_URL } from "../src/config/api";

interface Friend {
  id: string;
  username: string;
  xp: number;
  balance: number;
  avatarUrl: string;
}

interface FriendRequest {
  requestId: string;
  fromUser: {
    id: string;
    username: string;
    xp: number;
    avatarUrl: string;
  };
  createdAt: string;
}

interface UserSuggestion {
  id: string;
  username: string;
  xp: number;
  avatarUrl: string;
  isFriend: boolean;
  isRequested: boolean;
}

export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(colors);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingUsernames, setSendingUsernames] = useState<string[]>([]);

  const searchDebounceRef = useRef<any>(null);

  const fetchFriendsData = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/social/friends`, {
        credentials: "include",
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[Friends] Backend returned non-JSON response:", res.status);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setFriends(data.friends || []);
        setRequests(data.incomingRequests || []);
      }
    } catch (err) {
      console.error("fetchFriendsData error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFriendsData();
  }, [fetchFriendsData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFriendsData();
  };

  // --- LIVE AUTOCOMPLETE SEARCH AS USER TYPES ---
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!text.trim() || text.trim().length < 1) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const cleanQuery = text.trim().replace(/^@/, "");
        const res = await fetch(`${BASE_URL}/api/social/users/search?q=${encodeURIComponent(cleanQuery)}`, {
          credentials: "include",
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return;
        }

        const data = await res.json();

        if (data.success) {
          setSuggestions(data.users || []);
        }
      } catch (err) {
        console.error("search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  // --- SEND FRIEND REQUEST ---
  const handleSendRequest = async (targetUsername: string) => {
    setSendingUsernames((prev) => [...prev, targetUsername]);

    try {
      const res = await fetch(`${BASE_URL}/api/social/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: targetUsername }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        Alert.alert("Server Notice", "Backend service is updating. Please retry in a moment.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Friend Request", data.message || "Could not send friend request.");
        return;
      }

      Alert.alert("Request Sent! 🚀", `Friend request sent to @${targetUsername}!`);

      // Update suggestion item in list to reflect requested state
      setSuggestions((prev) =>
        prev.map((s) => (s.username === targetUsername ? { ...s, isRequested: true } : s))
      );

      fetchFriendsData();
    } catch (err) {
      console.error("handleSendRequest error:", err);
      Alert.alert("Error", "Could not connect to backend server.");
    } finally {
      setSendingUsernames((prev) => prev.filter((u) => u !== targetUsername));
    }
  };

  // --- ACCEPT / REJECT INCOMING REQUEST ---
  const handleRespondRequest = async (requesterId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const res = await fetch(`${BASE_URL}/api/social/friends/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requesterId, action }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to process request.");
        return;
      }

      Alert.alert(action === "ACCEPT" ? "Friend Added! 🎉" : "Request Declined", data.message);
      fetchFriendsData();
    } catch (err) {
      console.error("handleRespondRequest error:", err);
    }
  };

  // --- REMOVE FRIEND ---
  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert("Remove Friend", `Are you sure you want to remove @${friendName} from your friends list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${BASE_URL}/api/social/friends/remove`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ friendId }),
            });
            fetchFriendsData();
          } catch (err) {
            console.error("handleRemoveFriend error:", err);
          }
        },
      },
    ]);
  };

  return (
    <PageTransition>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtitle}>TRADING NETWORK</Text>
            <Text style={styles.headerTitle}>Friends & Rivals</Text>
          </View>
          <TouchableOpacity
            style={[styles.leaderboardNavBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/leaderboard" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="trophy" size={18} color="#eab308" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* SEARCH BOX FOR UNIQUE USERNAME */}
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search trader by @username..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => handleSearchChange("")} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* LIVE USER SUGGESTIONS LIST (APPEARS AS USER TYPES) */}
          {searchQuery.trim().length > 0 && (
            <View style={[styles.suggestionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.suggestionsHeader}>
                <Text style={[styles.suggestionsHeaderText, { color: colors.textSecondary }]}>
                  MATCHING TRADERS
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {suggestions.length} found
                </Text>
              </View>

              {suggestions.length === 0 && !isSearching ? (
                <View style={{ padding: 16, alignItems: "center" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    No users matching "@{searchQuery.trim()}".
                  </Text>
                </View>
              ) : (
                suggestions.map((item) => {
                  const isSending = sendingUsernames.includes(item.username);

                  return (
                    <View
                      key={item.id}
                      style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
                    >
                      <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.userAvatarText, { color: "#fff" }]}>
                          {item.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.userName, { color: colors.text }]}>@{item.username}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                          {item.xp.toLocaleString()} XP • Active Trader
                        </Text>
                      </View>

                      {item.isFriend ? (
                        <View style={[styles.statusBadge, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                          <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                          <Text style={[styles.statusBadgeText, { color: "#10b981" }]}>Friends</Text>
                        </View>
                      ) : item.isRequested ? (
                        <View style={[styles.statusBadge, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                          <Ionicons name="time" size={14} color="#f59e0b" />
                          <Text style={[styles.statusBadgeText, { color: "#f59e0b" }]}>Pending</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.addBtn,
                            { backgroundColor: colors.accent },
                            isSending && { opacity: 0.6 },
                          ]}
                          onPress={() => handleSendRequest(item.username)}
                          disabled={isSending}
                          activeOpacity={0.8}
                        >
                          {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="person-add" size={13} color="#fff" />
                              <Text style={styles.addBtnText}>Add</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* INCOMING FRIEND REQUESTS (RECEIVING USER SECTION) */}
          {requests.length > 0 && (
            <View style={[styles.requestsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.requestsHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.requestsNotificationDot} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Incoming Friend Requests ({requests.length})
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600" }}>
                  Action Needed
                </Text>
              </View>

              {requests.map((req) => (
                <View
                  key={req.requestId}
                  style={[styles.requestCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <View style={[styles.userAvatar, { backgroundColor: colors.border }]}>
                    <Text style={[styles.userAvatarText, { color: colors.text }]}>
                      {req.fromUser.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>@{req.fromUser.username}</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {req.fromUser.xp.toLocaleString()} XP • Wants to connect
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.actionBtnAccept, { backgroundColor: "#10b981" }]}
                      onPress={() => handleRespondRequest(req.fromUser.id, "ACCEPT")}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Accept</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtnReject, { borderColor: colors.border }]}
                      onPress={() => handleRespondRequest(req.fromUser.id, "REJECT")}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* MY FRIENDS LIST */}
          <View style={styles.section}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Friends ({friends.length})
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Live Portfolio Competition
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
            ) : friends.length === 0 ? (
              <View style={[styles.emptyFriendsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="people-outline" size={42} color={colors.textSecondary} />
                <Text style={[styles.emptyFriendsTitle, { color: colors.text }]}>No Friends Added Yet</Text>
                <Text style={[styles.emptyFriendsDesc, { color: colors.textSecondary }]}>
                  Type a friend's @username in the search bar above to send them a friend request and view each other's paper trading rank!
                </Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View
                  key={friend.id}
                  style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.userAvatarText, { color: "#fff" }]}>
                      {friend.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>@{friend.username}</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {friend.xp.toLocaleString()} XP • Connected Friend
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end", marginRight: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text }}>
                      ₹{friend.balance.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#10b981", fontWeight: "700" }}>Portfolio Active</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveFriend(friend.id, friend.username)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </PageTransition>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    backBtn: { padding: 4 },
    headerSubtitle: {
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      color: colors.textSecondary,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text,
    },
    leaderboardNavBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },

    /* SEARCH BAR */
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      marginBottom: 12,
      gap: 10,
      height: 52,
    },
    searchInput: {
      flex: 1,
      fontSize: 14.5,
      fontWeight: "600",
    },

    /* LIVE SUGGESTIONS DROPDOWN */
    suggestionsContainer: {
      borderRadius: 18,
      borderWidth: 1.5,
      marginBottom: 20,
      overflow: "hidden",
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    suggestionsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: "rgba(0,0,0,0.02)",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.05)",
    },
    suggestionsHeaderText: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.8,
    },
    suggestionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      gap: 12,
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
    },
    addBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "800",
    },

    /* INCOMING REQUESTS */
    requestsSection: {
      padding: 16,
      borderRadius: 20,
      borderWidth: 1.5,
      marginBottom: 20,
    },
    requestsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    requestsNotificationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#f59e0b",
    },
    requestCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 10,
      gap: 10,
    },
    actionBtnAccept: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    actionBtnReject: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    actionBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800",
    },

    /* FRIENDS LIST */
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "900",
    },
    friendCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 10,
      gap: 12,
    },
    userAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    userAvatarText: {
      fontSize: 16,
      fontWeight: "900",
    },
    userName: {
      fontSize: 14.5,
      fontWeight: "800",
    },

    emptyFriendsCard: {
      padding: 26,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: "center",
    },
    emptyFriendsTitle: {
      fontSize: 15,
      fontWeight: "800",
      marginTop: 8,
    },
    emptyFriendsDesc: {
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 18,
      marginTop: 4,
    },
  });
