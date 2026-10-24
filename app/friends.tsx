import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { BASE_URL, getAuthHeaders } from "../src/config/api";

const getRankName = (xp: number) => {
  if (xp >= 10000) return 'Diamond';
  if (xp >= 6000) return 'Platinum';
  if (xp >= 3000) return 'Gold';
  if (xp >= 1500) return 'Silver';
  if (xp >= 500) return 'Bronze';
  return 'Novice';
};

interface Friend {
  id: string;
  username: string;
  xp: number;
  balance: number;
  avatarUrl: string;
  bio?: string;
  portfolioReturn?: number;
  puzzlesCompleted?: number;
  riskProfile?: string;
  badgesCount?: number;
}

interface FriendRequest {
  requestId: string;
  fromUser: {
    id: string;
    username: string;
    xp: number;
    balance?: number;
    avatarUrl: string;
    bio?: string;
    portfolioReturn?: number;
    puzzlesCompleted?: number;
    riskProfile?: string;
    badgesCount?: number;
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
  bio?: string;
  balance?: number;
  portfolioReturn?: number;
  puzzlesCompleted?: number;
  riskProfile?: string;
  badgesCount?: number;
}

export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isGuest, isLoggedIn } = useAuth();
  const styles = getStyles(colors);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingUsernames, setSendingUsernames] = useState<string[]>([]);
  const [isSearchingSelf, setIsSearchingSelf] = useState(false);
  const [selectedUserPreview, setSelectedUserPreview] = useState<any | null>(null);

  // Tab state: Friends Network vs Active Chats
  const [activeTab, setActiveTab] = useState<'network' | 'chats'>('network');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  const searchDebounceRef = useRef<any>(null);

  const fetchConversations = useCallback(async () => {
    if (isGuest || !isLoggedIn || !user || user.isGuest) {
      setConversations([]);
      setLoadingChats(false);
      return;
    }
    try {
      setLoadingChats(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/chat/conversations`, {
        headers: {
          ...authHeaders,
        },
        credentials: "include",
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return;
      }
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.log("fetchConversations error:", e);
    } finally {
      setLoadingChats(false);
    }
  }, [isGuest, isLoggedIn, user]);

  const fetchFriendsData = useCallback(async () => {
    if (isGuest || !isLoggedIn || !user || user.isGuest) {
      setFriends([]);
      setRequests([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/social/friends`, {
        headers: {
          ...authHeaders,
        },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[Friends] Backend returned non-JSON response:", res.status);
        return;
      }

      const data = await res.json();

      if (data.success) {
        const friendList: Friend[] = data.friends || [];
        const friendIdSet = new Set(friendList.map((f) => String(f.id)));

        // Mutual exclusion: exclude any incoming request whose sender is already a friend!
        const cleanRequests = (data.incomingRequests || []).filter(
          (r: FriendRequest) => r.fromUser && !friendIdSet.has(String(r.fromUser.id))
        );

        setFriends(friendList);
        setRequests(cleanRequests);
        AsyncStorage.setItem('@pending_friend_requests_count', String(cleanRequests.length)).catch(() => {});
      }
    } catch (err) {
      console.error("fetchFriendsData error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isGuest && isLoggedIn && user && !user.isGuest) {
      fetchFriendsData();
      fetchConversations();
    } else {
      setLoading(false);
      setFriends([]);
      setRequests([]);
    }
  }, [fetchFriendsData, fetchConversations, isGuest, isLoggedIn, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFriendsData();
    fetchConversations();
  };

  // --- LIVE AUTOCOMPLETE SEARCH AS USER TYPES ---
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const cleanQuery = text.trim().replace(/^@/, "").toLowerCase();
    const myUsername = (user?.username || "").trim().toLowerCase();

    // Prevent searching own username
    if (cleanQuery && myUsername && cleanQuery === myUsername) {
      setIsSearchingSelf(true);
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearchingSelf(false);

    if (!cleanQuery || cleanQuery.length < 1) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const excludeParam = user?.username ? `&excludeUser=${encodeURIComponent(user.username)}` : "";
        const res = await fetch(`${BASE_URL}/api/social/users/search?q=${encodeURIComponent(cleanQuery)}${excludeParam}`, {
          headers: {
            ...authHeaders,
          },
          credentials: "include",
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return;
        }

        const data = await res.json();

        if (data.success) {
          // Strictly filter out self in frontend as an additional layer of security
          const cleanUsers = (data.users || []).filter(
            (u: UserSuggestion) =>
              u.username.toLowerCase() !== myUsername &&
              (!user?.id || u.id !== user.id)
          );
          setSuggestions(cleanUsers);
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
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/social/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
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

      Alert.alert(data.isFriend ? "Connected! 🎉" : "Request Sent! 🚀", data.message);

      // Update suggestion item in list to reflect requested or friend state
      setSuggestions((prev) =>
        prev.map((s) => (s.username === targetUsername ? { ...s, isRequested: !data.isFriend, isFriend: !!data.isFriend } : s))
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
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/social/friends/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({ requesterId, action }),
      });

      const contentType = res.headers.get("content-type");
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to process request.");
        return;
      }

      // Optimistically remove from incoming requests list and update badge storage instantly
      setRequests((prev) => {
        const remaining = prev.filter((r) => r.fromUser?.id !== requesterId);
        AsyncStorage.setItem('@pending_friend_requests_count', String(remaining.length)).catch(() => {});
        return remaining;
      });

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
            const authHeaders = await getAuthHeaders();
            await fetch(`${BASE_URL}/api/social/friends/remove`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders,
              },
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

  // GUEST PROFILE RESTRICTION SCREEN
  if (isGuest || !isLoggedIn || !user || user.isGuest) {
    return (
      <PageTransition>
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSubtitle}>TRADING NETWORK</Text>
              <Text style={styles.headerTitle}>Friends & Rivals</Text>
            </View>
          </View>

          <View style={styles.guestLockedContainer}>
            <View style={[styles.guestLockedIconBox, { backgroundColor: colors.accent + '18' }]}>
              <Ionicons name="people" size={46} color={colors.accent} />
            </View>
            <Text style={[styles.guestLockedTitle, { color: colors.text }]}>
              Social Network & Chat Locked
            </Text>
            <Text style={[styles.guestLockedDesc, { color: colors.textSecondary }]}>
              Guest profiles cannot add friends, view friend requests, or chat 1-on-1.
              {"\n\n"}
              Log in or register a free account to build your trader circle, challenge rivals to portfolio battles, and message confirmed friends!
            </Text>

            <TouchableOpacity
              style={[styles.guestLoginBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/auth' as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={20} color="#ffffff" />
              <Text style={styles.guestLoginBtnText}>Log In / Create Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </PageTransition>
    );
  }

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

        {/* TAB SWITCHER: FRIENDS NETWORK VS ACTIVE CHATS */}
        <View style={[styles.tabBarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabBarItem,
              activeTab === 'network' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setActiveTab('network')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people"
              size={16}
              color={activeTab === 'network' ? '#ffffff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBarText,
                { color: activeTab === 'network' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              Friends ({friends.length})
            </Text>
            {requests.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{requests.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBarItem,
              activeTab === 'chats' && { backgroundColor: colors.accent },
            ]}
            onPress={() => {
              setActiveTab('chats');
              fetchConversations();
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={16}
              color={activeTab === 'chats' ? '#ffffff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBarText,
                { color: activeTab === 'chats' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              Active Chats
            </Text>
            {conversations.some((c) => c.unreadCount > 0) && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'chats' ? (
            /* ACTIVE CHATS LIST */
            <View style={styles.section}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Direct Conversations</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>1-on-1 Confirmed Friends</Text>
              </View>

              {loadingChats ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 24 }} />
              ) : conversations.length === 0 ? (
                <View style={[styles.emptyFriendsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="chatbubbles-outline" size={44} color={colors.textSecondary} />
                  <Text style={[styles.emptyFriendsTitle, { color: colors.text }]}>No Conversations Yet</Text>
                  <Text style={[styles.emptyFriendsDesc, { color: colors.textSecondary }]}>
                    Tap the "Chat" button next to any of your friends to discuss market trends, trade setups, and portfolio strategy!
                  </Text>
                </View>
              ) : (
                conversations.map((c) => (
                  <TouchableOpacity
                    key={c.conversationId}
                    style={[styles.conversationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      router.push({
                        pathname: '/chat/[friendId]',
                        params: { friendId: c.friend.id, username: c.friend.username },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.userAvatarText, { color: "#fff" }]}>
                        {c.friend.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginHorizontal: 12, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={[styles.userName, { color: colors.text, flex: 1, marginRight: 6 }]} numberOfLines={1} ellipsizeMode="tail">
                          @{c.friend.username}
                        </Text>
                        <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1} ellipsizeMode="tail">
                        {c.lastMessage || "Start chatting..."}
                      </Text>
                    </View>

                    {c.unreadCount > 0 && (
                      <View style={styles.unreadCountPill}>
                        <Text style={styles.unreadCountText}>{c.unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            /* FRIENDS NETWORK TAB */
            <>
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

          {/* SELF SEARCH NOTICE */}
          {isSearchingSelf && (
            <View style={[styles.selfSearchNotice, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
              <Text style={[styles.selfSearchNoticeText, { color: colors.textSecondary }]}>
                You cannot search or send a friend request to your own account (@{user?.username}).
              </Text>
            </View>
          )}

          {/* LIVE USER SUGGESTIONS LIST (APPEARS AS USER TYPES) */}
          {searchQuery.trim().length > 0 && !isSearchingSelf && (
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
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
                      onPress={() => setSelectedUserPreview(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.userAvatarText, { color: "#fff" }]}>
                          {item.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                          @{item.username}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1} ellipsizeMode="tail">
                          {item.xp.toLocaleString()} XP • Tap to view profile
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
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* INCOMING FRIEND REQUESTS (RECEIVING USER SECTION - ALWAYS VISIBLE) */}
          <View style={[styles.requestsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.requestsHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons
                  name={requests.length > 0 ? "mail-unread" : "mail-outline"}
                  size={18}
                  color={requests.length > 0 ? "#ef4444" : colors.textSecondary}
                />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Friend Requests
                </Text>
                {requests.length > 0 && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#ef4444",
                    }}
                  />
                )}
                <View
                  style={[
                    styles.badgePill,
                    { backgroundColor: requests.length > 0 ? "rgba(239, 68, 68, 0.15)" : colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgePillText,
                      { color: requests.length > 0 ? "#ef4444" : colors.textSecondary },
                    ]}
                  >
                    {requests.length}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: requests.length > 0 ? "#ef4444" : colors.textSecondary, fontWeight: "700" }}>
                {requests.length > 0 ? "Action Needed" : "All Caught Up"}
              </Text>
            </View>

            {requests.length === 0 ? (
              <View style={styles.emptyRequestsBox}>
                <Ionicons
                  name="mail-open-outline"
                  size={26}
                  color={colors.textSecondary}
                  style={{ opacity: 0.6, marginBottom: 4 }}
                />
                <Text style={[styles.emptyRequestsTitle, { color: colors.text }]}>
                  No Pending Requests
                </Text>
                <Text style={[styles.emptyRequestsSubtitle, { color: colors.textSecondary }]}>
                  When other traders send you a friend request using your @username, they will appear right here for you to accept or decline.
                </Text>
              </View>
            ) : (
              requests.map((req) => (
                <View
                  key={req.requestId}
                  style={[styles.requestCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <View style={[styles.userAvatar, { backgroundColor: colors.border }]}>
                    <Text style={[styles.userAvatarText, { color: colors.text }]}>
                      {req.fromUser.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                      @{req.fromUser.username}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1} ellipsizeMode="tail">
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
              ))
            )}
          </View>

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
                <TouchableOpacity
                  key={friend.id}
                  style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSelectedUserPreview({ ...friend, isFriend: true })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.userAvatarText, { color: "#fff" }]}>
                      {friend.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, minWidth: 0, justifyContent: "center" }}>
                    <Text
                      style={[styles.userName, { color: colors.text }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      @{friend.username}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
                      <Text style={{ fontSize: 11.5, color: colors.textSecondary }} numberOfLines={1}>
                        {friend.xp.toLocaleString()} XP
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, opacity: 0.6 }}>•</Text>
                      <Text style={{ fontSize: 11.5, fontWeight: "700", color: "#10b981" }} numberOfLines={1}>
                        ₹{friend.balance.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      style={[styles.chatBtnPill, { backgroundColor: colors.accent }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({
                          pathname: '/chat/[friendId]',
                          params: { friendId: friend.id, username: friend.username },
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-ellipses" size={13} color="#fff" />
                      <Text style={styles.chatBtnPillText}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend.id, friend.username);
                      }}
                      style={{ padding: 6 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
          </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* USER PROFILE INFO MODAL */}
        <Modal
          visible={!!selectedUserPreview}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedUserPreview(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Header with Close Button */}
              <View style={styles.modalCardHeader}>
                <Text style={[styles.modalCardCategory, { color: colors.textSecondary }]}>TRADER DOSSIER</Text>
                <TouchableOpacity onPress={() => setSelectedUserPreview(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Avatar & Username */}
              <View style={{ alignItems: "center", marginVertical: 12 }}>
                <View style={[styles.previewAvatarBox, { backgroundColor: colors.accent }]}>
                  <Text style={styles.previewAvatarText}>
                    {selectedUserPreview?.username ? selectedUserPreview.username.charAt(0).toUpperCase() : "?"}
                  </Text>
                </View>
                <Text style={[styles.previewUsername, { color: colors.text }]}>
                  @{selectedUserPreview?.username}
                </Text>
                <View style={[styles.rankTag, { backgroundColor: colors.accent + "20" }]}>
                  <Ionicons name="shield-checkmark" size={13} color={colors.accent} />
                  <Text style={[styles.rankTagText, { color: colors.accent }]}>
                    {getRankName(selectedUserPreview?.xp || 0)} Trader
                  </Text>
                </View>
                <Text style={[styles.previewBio, { color: colors.textSecondary }]} numberOfLines={2}>
                  "{selectedUserPreview?.bio || "Trading enthusiast & market learner"}"
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={[styles.previewStatsGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.previewStatCol}>
                  <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>TOTAL XP</Text>
                  <Text style={[styles.previewStatVal, { color: colors.accent }]}>
                    {(selectedUserPreview?.xp || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.previewStatCol}>
                  <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>PORTFOLIO</Text>
                  <Text style={[styles.previewStatVal, { color: "#10b981" }]}>
                    ₹{(selectedUserPreview?.balance || 100000).toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.previewStatCol}>
                  <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>PUZZLES</Text>
                  <Text style={[styles.previewStatVal, { color: colors.text }]}>
                    {selectedUserPreview?.puzzlesCompleted || 0}
                  </Text>
                </View>
              </View>

              {/* Trading Style Pill */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 18 }}>
                <Ionicons name="pulse" size={14} color={colors.accent} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary }}>
                  Style: <Text style={{ color: colors.text, fontWeight: "800" }}>{selectedUserPreview?.riskProfile || "MODERATE"} RISK</Text>
                </Text>
              </View>

              {/* Action Buttons */}
              {selectedUserPreview?.isFriend ? (
                <View style={{ gap: 10 }}>
                  <View style={[styles.previewFriendStatus, { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "#10b981" }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#10b981" }}>In Your Friends Circle</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.chatBtn, { backgroundColor: colors.accent }]}
                    onPress={() => {
                      const friendId = selectedUserPreview.id;
                      const username = selectedUserPreview.username;
                      setSelectedUserPreview(null);
                      router.push({
                        pathname: '/chat/[friendId]',
                        params: { friendId, username },
                      });
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="chatbubbles" size={18} color="#fff" />
                    <Text style={styles.chatBtnText}>Direct Message @{selectedUserPreview.username}</Text>
                  </TouchableOpacity>
                </View>
              ) : selectedUserPreview?.isRequested ? (
                <View style={[styles.previewFriendStatus, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "#f59e0b" }]}>
                  <Ionicons name="time" size={16} color="#f59e0b" />
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#f59e0b" }}>Friend Request Pending</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.chatBtn, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    const uname = selectedUserPreview.username;
                    setSelectedUserPreview(null);
                    handleSendRequest(uname);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.chatBtnText}>Send Friend Request</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
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

    selfSearchNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1.5,
      marginBottom: 16,
    },
    selfSearchNoticeText: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: "700",
      lineHeight: 18,
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
    badgePill: {
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 10,
    },
    badgePillText: {
      fontSize: 11,
      fontWeight: "900",
    },
    emptyRequestsBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    emptyRequestsTitle: {
      fontSize: 13.5,
      fontWeight: "800",
      marginTop: 2,
    },
    emptyRequestsSubtitle: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 17,
      marginTop: 3,
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

    /* USER PROFILE INFO MODAL STYLES */
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 380,
      borderRadius: 24,
      borderWidth: 1.5,
      padding: 20,
      elevation: 10,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    modalCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalCardCategory: {
      fontSize: 10.5,
      fontWeight: "900",
      letterSpacing: 1.2,
    },
    previewAvatarBox: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    previewAvatarText: {
      fontSize: 26,
      fontWeight: "900",
      color: "#fff",
    },
    previewUsername: {
      fontSize: 18,
      fontWeight: "900",
    },
    rankTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
      marginTop: 4,
      marginBottom: 6,
    },
    rankTagText: {
      fontSize: 11,
      fontWeight: "800",
    },
    previewBio: {
      fontSize: 12.5,
      fontStyle: "italic",
      textAlign: "center",
      marginTop: 2,
      paddingHorizontal: 12,
    },
    previewStatsGrid: {
      flexDirection: "row",
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginBottom: 14,
      justifyContent: "space-around",
      alignItems: "center",
    },
    previewStatCol: {
      alignItems: "center",
      flex: 1,
    },
    previewStatLabel: {
      fontSize: 9.5,
      fontWeight: "900",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    previewStatVal: {
      fontSize: 13.5,
      fontWeight: "900",
    },
    statDivider: {
      width: 1,
      height: 24,
    },
    previewFriendStatus: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
    },
    chatBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
    },
    chatBtnText: {
      color: "#fff",
      fontSize: 13.5,
      fontWeight: "800",
    },
    tabBarContainer: {
      flexDirection: "row",
      borderRadius: 14,
      borderWidth: 1,
      padding: 4,
      marginHorizontal: 20,
      marginBottom: 16,
      gap: 6,
    },
    tabBarItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      borderRadius: 10,
      gap: 6,
    },
    tabBarText: {
      fontSize: 12.5,
      fontWeight: "800",
    },
    tabBadge: {
      backgroundColor: "#ef4444",
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 10,
    },
    tabBadgeText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "900",
    },
    chatBtnPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 6,
    },
    chatBtnPillText: {
      color: "#ffffff",
      fontSize: 11.5,
      fontWeight: "800",
    },
    conversationCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      marginBottom: 10,
    },
    unreadCountPill: {
      backgroundColor: "#ef4444",
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    unreadCountText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "900",
    },
    guestLockedContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingTop: 60,
    },
    guestLockedIconBox: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    guestLockedTitle: {
      fontSize: 20,
      fontWeight: "900",
      marginBottom: 10,
      textAlign: "center",
    },
    guestLockedDesc: {
      fontSize: 13.5,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: 28,
    },
    guestLoginBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 28,
      paddingVertical: 13,
      borderRadius: 24,
    },
    guestLoginBtnText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "800",
    },
  });
