import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
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
  friendCode: string;
  xp: number;
  balance: number;
  avatarUrl: string;
}

interface FriendRequest {
  requestId: string;
  fromUser: {
    id: string;
    username: string;
    friendCode: string;
    xp: number;
    avatarUrl: string;
  };
  createdAt: string;
}

export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(colors);

  const [myFriendCode, setMyFriendCode] = useState<string>("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchFriendsData = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/social/friends`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setFriends(data.friends || []);
        setRequests(data.incomingRequests || []);
        if (data.myFriendCode) setMyFriendCode(data.myFriendCode);
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

  const handleCopyCode = () => {
    const codeToCopy = myFriendCode || user?.friendCode || "TRD-USER";
    Clipboard.setString(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendRequest = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Input Required", "Please enter a username or Friend Code (UID).");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`${BASE_URL}/api/social/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Request Failed", data.message || "Could not send friend request.");
        return;
      }

      Alert.alert("Success! 🚀", data.message);
      setSearchQuery("");
      fetchFriendsData();
    } catch (err) {
      console.error("handleSendRequest error:", err);
      Alert.alert("Error", "Could not connect to backend server.");
    } finally {
      setSearching(false);
    }
  };

  const handleRespondRequest = async (requesterId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const res = await fetch(`${BASE_URL}/api/social/friends/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requesterId, action }),
      });

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* MY FRIEND CODE CARD */}
          <View style={[styles.myCodeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.myCodeLabel, { color: colors.textSecondary }]}>YOUR UNIQUE FRIEND CODE (UID)</Text>
              <Text style={[styles.myCodeValue, { color: colors.accent }]}>
                {myFriendCode || user?.friendCode || "TRD-USER"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Share this code with friends so they can add you instantly.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.copyBtn,
                { backgroundColor: copied ? "#10b981" : colors.accent + "18", borderColor: copied ? "#10b981" : colors.accent },
              ]}
              onPress={handleCopyCode}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? "checkmark-done" : "copy-outline"}
                size={18}
                color={copied ? "#fff" : colors.accent}
              />
              <Text style={[styles.copyBtnText, { color: copied ? "#fff" : colors.accent }]}>
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ADD FRIEND INPUT */}
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Enter @username or UID (e.g. TRD-4A8F)"
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendReqBtn, { backgroundColor: colors.accent }, searching && { opacity: 0.7 }]}
              onPress={handleSendRequest}
              disabled={searching}
              activeOpacity={0.85}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendReqBtnText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* PENDING FRIEND REQUESTS SECTION */}
          {requests.length > 0 && (
            <View style={styles.section}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Ionicons name="notifications" size={18} color="#f59e0b" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Pending Requests ({requests.length})
                </Text>
              </View>

              {requests.map((req) => (
                <View
                  key={req.requestId}
                  style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.userAvatar, { backgroundColor: colors.border }]}>
                    <Text style={[styles.userAvatarText, { color: colors.text }]}>
                      {req.fromUser.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>@{req.fromUser.username}</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>UID: {req.fromUser.friendCode}</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: "#10b981" }]}
                      onPress={() => handleRespondRequest(req.fromUser.id, "ACCEPT")}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: colors.border }]}
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
                Live Portfolio Rivals
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
            ) : friends.length === 0 ? (
              <View style={[styles.emptyFriendsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="people-outline" size={42} color={colors.textSecondary} />
                <Text style={[styles.emptyFriendsTitle, { color: colors.text }]}>No Friends Added</Text>
                <Text style={[styles.emptyFriendsDesc, { color: colors.textSecondary }]}>
                  Search for your friends by @username or share your Friend Code above to start tracking each other's paper trading returns!
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
                      UID: {friend.friendCode} • {friend.xp.toLocaleString()} XP
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

    myCodeCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      marginBottom: 16,
    },
    myCodeLabel: {
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.8,
    },
    myCodeValue: {
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 1,
      marginTop: 2,
    },
    copyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
    },
    copyBtnText: {
      fontSize: 12,
      fontWeight: "800",
    },

    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
    },
    sendReqBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    sendReqBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "800",
    },

    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "900",
    },

    requestCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 10,
      gap: 12,
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
      fontSize: 14,
      fontWeight: "800",
    },
    actionIconBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
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
