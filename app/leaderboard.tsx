import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { BASE_URL } from "../src/config/api";

const { width: SCREEN_W } = Dimensions.get("window");

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  friendCode: string;
  xp: number;
  balance: number;
  portfolioReturn: number;
  avatarUrl: string;
  isCurrentUser?: boolean;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(colors);

  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [globalList, setGlobalList] = useState<LeaderboardUser[]>([]);
  const [friendsList, setFriendsList] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/social/leaderboard`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setGlobalList(data.global || []);
        setFriendsList(data.friends || []);
        setCurrentUserRank(data.currentUserRank || null);
      }
    } catch (err) {
      console.error("fetchLeaderboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const displayList = activeTab === "global" ? globalList : friendsList;
  const top1 = displayList.find((u) => u.rank === 1);
  const top2 = displayList.find((u) => u.rank === 2);
  const top3 = displayList.find((u) => u.rank === 3);
  const restList = displayList.filter((u) => u.rank > 3);

  return (
    <PageTransition>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtitle}>COMPETITIVE LEAGUES</Text>
            <Text style={styles.headerTitle}>Leaderboard</Text>
          </View>
          <TouchableOpacity
            style={[styles.friendsNavBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/friends" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* TAB SWITCHER */}
        <View style={styles.tabContainer}>
          <View style={[styles.tabTrack, { backgroundColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "global" && [styles.activeTabBtn, { backgroundColor: colors.card }],
              ]}
              onPress={() => setActiveTab("global")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="globe-outline"
                size={16}
                color={activeTab === "global" ? colors.text : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "global" ? colors.text : colors.textSecondary },
                ]}
              >
                Global (Top 50)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "friends" && [styles.activeTabBtn, { backgroundColor: colors.card }],
              ]}
              onPress={() => setActiveTab("friends")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={activeTab === "friends" ? colors.text : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "friends" ? colors.text : colors.textSecondary },
                ]}
              >
                Friends Circle
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading rankings...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* PODIUM (TOP 3 TRADERS) */}
            {displayList.length > 0 ? (
              <View style={[styles.podiumContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* 2ND PLACE */}
                <View style={[styles.podiumColumn, { marginTop: 28 }]}>
                  <View style={[styles.podiumAvatarBox, { borderColor: "#94a3b8" }]}>
                    <Text style={styles.podiumAvatarText}>
                      {top2 ? top2.username.charAt(0).toUpperCase() : "-"}
                    </Text>
                    <View style={[styles.podiumBadge, { backgroundColor: "#94a3b8" }]}>
                      <Text style={styles.podiumBadgeText}>2</Text>
                    </View>
                  </View>
                  <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                    {top2 ? top2.username : "Empty"}
                  </Text>
                  <Text style={[styles.podiumXp, { color: colors.textSecondary }]}>
                    {top2 ? `${top2.xp.toLocaleString()} XP` : "-"}
                  </Text>
                  <View style={[styles.podiumPillar, { height: 60, backgroundColor: "#94a3b830" }]}>
                    <Ionicons name="medal" size={24} color="#94a3b8" />
                  </View>
                </View>

                {/* 1ST PLACE (CROWN) */}
                <View style={styles.podiumColumn}>
                  <Ionicons name="ribbon" size={26} color="#eab308" style={{ marginBottom: 2 }} />
                  <View style={[styles.podiumAvatarBox, { borderColor: "#eab308", transform: [{ scale: 1.1 }] }]}>
                    <Text style={[styles.podiumAvatarText, { fontSize: 20 }]}>
                      {top1 ? top1.username.charAt(0).toUpperCase() : "-"}
                    </Text>
                    <View style={[styles.podiumBadge, { backgroundColor: "#eab308" }]}>
                      <Text style={styles.podiumBadgeText}>1</Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.podiumName, { color: colors.text, fontWeight: "900", marginTop: 6 }]}
                    numberOfLines={1}
                  >
                    {top1 ? top1.username : "Empty"}
                  </Text>
                  <Text style={[styles.podiumXp, { color: "#eab308", fontWeight: "800" }]}>
                    {top1 ? `${top1.xp.toLocaleString()} XP` : "-"}
                  </Text>
                  <View style={[styles.podiumPillar, { height: 86, backgroundColor: "#eab30830" }]}>
                    <Ionicons name="trophy" size={28} color="#eab308" />
                  </View>
                </View>

                {/* 3RD PLACE */}
                <View style={[styles.podiumColumn, { marginTop: 38 }]}>
                  <View style={[styles.podiumAvatarBox, { borderColor: "#d97706" }]}>
                    <Text style={styles.podiumAvatarText}>
                      {top3 ? top3.username.charAt(0).toUpperCase() : "-"}
                    </Text>
                    <View style={[styles.podiumBadge, { backgroundColor: "#d97706" }]}>
                      <Text style={styles.podiumBadgeText}>3</Text>
                    </View>
                  </View>
                  <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                    {top3 ? top3.username : "Empty"}
                  </Text>
                  <Text style={[styles.podiumXp, { color: colors.textSecondary }]}>
                    {top3 ? `${top3.xp.toLocaleString()} XP` : "-"}
                  </Text>
                  <View style={[styles.podiumPillar, { height: 50, backgroundColor: "#d9770630" }]}>
                    <Ionicons name="medal" size={22} color="#d97706" />
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="people-circle-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Friends Added Yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Add your friends using their @username or Friend Code (UID) to compete on the leaderboard!
                </Text>
                <TouchableOpacity
                  style={[styles.addFriendsBtn, { backgroundColor: colors.accent }]}
                  onPress={() => router.push("/friends" as any)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text style={styles.addFriendsBtnText}>Find & Add Friends</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* REST OF THE LEADERBOARD */}
            {restList.length > 0 && (
              <View style={styles.listSection}>
                <Text style={[styles.listSectionTitle, { color: colors.textSecondary }]}>
                  {activeTab === "global" ? "TOP RANKED TRADERS" : "FRIENDS CIRCLE"}
                </Text>

                {restList.map((trader) => {
                  const isMe = user && trader.username === user.username;

                  return (
                    <View
                      key={trader.id}
                      style={[
                        styles.traderRow,
                        {
                          backgroundColor: isMe ? colors.accent + "15" : colors.card,
                          borderColor: isMe ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.rankNumBox}>
                        <Text style={[styles.rankNum, { color: isMe ? colors.accent : colors.textSecondary }]}>
                          #{trader.rank}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.traderAvatar,
                          { backgroundColor: isMe ? colors.accent : colors.border },
                        ]}
                      >
                        <Text style={styles.traderAvatarText}>
                          {trader.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[styles.traderUsername, { color: colors.text }]} numberOfLines={1}>
                            {trader.username}
                          </Text>
                          {isMe && (
                            <View style={[styles.youBadge, { backgroundColor: colors.accent }]}>
                              <Text style={styles.youBadgeText}>YOU</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.traderCode, { color: colors.textSecondary }]}>
                          UID: {trader.friendCode}
                        </Text>
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.traderXp, { color: colors.accent }]}>
                          {trader.xp.toLocaleString()} XP
                        </Text>
                        <Text style={[styles.traderBalance, { color: colors.textSecondary }]}>
                          ₹{trader.balance.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={{ height: 110 }} />
          </ScrollView>
        )}

        {/* PINNED CURRENT USER RANK AT BOTTOM */}
        {user && !user.isGuest && currentUserRank && (
          <View
            style={[
              styles.pinnedBottomBar,
              { backgroundColor: colors.card, borderTopColor: colors.border },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.pinnedRankPill, { backgroundColor: colors.accent }]}>
                <Text style={styles.pinnedRankText}>#{currentUserRank}</Text>
              </View>
              <View>
                <Text style={[styles.pinnedName, { color: colors.text }]}>Your Global Rank</Text>
                <Text style={[styles.pinnedSub, { color: colors.textSecondary }]}>
                  UID: {user.friendCode || "TRD-USER"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.pinnedShareBtn, { backgroundColor: colors.accent + "20" }]}
              onPress={() => router.push("/friends" as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={16} color={colors.accent} />
              <Text style={[styles.pinnedShareText, { color: colors.accent }]}>Invite</Text>
            </TouchableOpacity>
          </View>
        )}
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
    friendsNavBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    tabContainer: {
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    tabTrack: {
      flexDirection: "row",
      borderRadius: 14,
      padding: 4,
    },
    tabBtn: {
      flex: 1,
      flexDirection: "row",
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
    },
    activeTabBtn: {
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
    },
    tabText: {
      fontSize: 13,
      fontWeight: "800",
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },

    /* PODIUM */
    podiumContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      marginBottom: 20,
    },
    podiumColumn: {
      flex: 1,
      alignItems: "center",
    },
    podiumAvatarBox: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2.5,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    podiumAvatarText: {
      fontSize: 18,
      fontWeight: "900",
    },
    podiumBadge: {
      position: "absolute",
      bottom: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    podiumBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "900",
    },
    podiumName: {
      fontSize: 13,
      fontWeight: "800",
      marginTop: 8,
      textAlign: "center",
    },
    podiumXp: {
      fontSize: 11,
      fontWeight: "700",
      marginTop: 2,
      marginBottom: 8,
    },
    podiumPillar: {
      width: "80%",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyBox: {
      padding: 28,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      marginTop: 10,
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
      marginTop: 4,
      marginBottom: 16,
    },
    addFriendsBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    addFriendsBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "800",
    },

    /* REST LIST */
    listSection: {
      marginBottom: 20,
    },
    listSectionTitle: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 10,
    },
    traderRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 10,
      gap: 12,
    },
    rankNumBox: {
      width: 28,
      alignItems: "center",
    },
    rankNum: {
      fontSize: 14,
      fontWeight: "900",
    },
    traderAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    traderAvatarText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "800",
    },
    traderUsername: {
      fontSize: 14,
      fontWeight: "800",
    },
    traderCode: {
      fontSize: 11,
      marginTop: 1,
    },
    youBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    youBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "900",
    },
    traderXp: {
      fontSize: 13,
      fontWeight: "800",
    },
    traderBalance: {
      fontSize: 11,
      marginTop: 1,
    },

    /* PINNED CURRENT USER RANK */
    pinnedBottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      elevation: 8,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -3 },
    },
    pinnedRankPill: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    pinnedRankText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "900",
    },
    pinnedName: {
      fontSize: 14,
      fontWeight: "800",
    },
    pinnedSub: {
      fontSize: 11,
    },
    pinnedShareBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    pinnedShareText: {
      fontSize: 13,
      fontWeight: "800",
    },
  });
