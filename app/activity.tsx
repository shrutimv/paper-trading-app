import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../src/config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserActivityPost {
  _id: string;
  title: string;
  category: string;
  stockTag?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

interface UserActivityComment {
  _id: string;
  text: string;
  createdAt: string;
  likesCount: number;
  post?: {
    _id: string;
    title: string;
    category?: string;
    stockTag?: string;
  } | string;
}

export default function MyActivityScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [posts, setPosts] = useState<UserActivityPost[]>([]);
  const [comments, setComments] = useState<UserActivityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      const guestId = await AsyncStorage.getItem('@forum_guest_id');

      const res = await axios.get(`${BASE_URL}/api/forum/activity`, {
        params: {
          userId: user?.id || (user as any)?._id,
          username: user?.username,
          guestId: guestId || '',
        },
        withCredentials: true,
        timeout: 10000,
      });

      if (res.data?.success) {
        setPosts(res.data.posts || []);
        setComments(res.data.comments || []);
      }
    } catch (err: any) {
      console.log('Error fetching user activity:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivity();
  };

  const totalUpvotes = posts.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Suppress any default stack header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Custom Navigation Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Activity</Text>
        <TouchableOpacity
          onPress={() => router.push('/forum' as any)}
          style={styles.loungeLink}
        >
          <Ionicons name="chatbubbles" size={16} color={colors.accent} />
          <Text style={[styles.loungeLinkText, { color: colors.accent }]}>Lounge</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary Bar */}
      <View style={styles.statsSummaryWrapper}>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.accent }]}>{posts.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Discussions</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: '#10b981' }]}>{comments.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Comments</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: '#f59e0b' }]}>{totalUpvotes}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Likes</Text>
        </View>
      </View>

      {/* Segmented Control Bar */}
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabSegmentWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'posts' && { backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('posts');
            }}
          >
            <Ionicons
              name="newspaper-outline"
              size={15}
              color={activeTab === 'posts' ? '#ffffff' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'posts' ? { color: '#ffffff', fontWeight: '800' } : { color: colors.textSecondary },
              ]}
            >
              My Posts ({posts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'comments' && { backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('comments');
            }}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={15}
              color={activeTab === 'comments' ? '#ffffff' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'comments' ? { color: '#ffffff', fontWeight: '800' } : { color: colors.textSecondary },
              ]}
            >
              My Comments ({comments.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your interactions...</Text>
        </View>
      ) : activeTab === 'posts' ? (
        <FlatList
          data={posts}
          keyExtractor={item => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 60 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff' }]}>
                <Ionicons name="newspaper-outline" size={36} color="#2563eb" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Discussions Yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                When you share analyses, setups, or questions in Traders Lounge, they will be archived here.
              </Text>
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/forum' as any)}
              >
                <Ionicons name="add" size={17} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.ctaButtonText}>Start a Discussion</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.88}
              onPress={() => router.push(`/forum/${item._id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>YOU</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff' }]}>
                    <Text style={[styles.categoryBadgeText, { color: colors.accent }]}>{item.category}</Text>
                  </View>
                  {item.stockTag ? (
                    <Text style={[styles.stockTagText, { color: colors.textSecondary }]}>${item.stockTag}</Text>
                  ) : null}
                </View>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>

              <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="heart-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.likesCount || 0}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="chatbubble-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.commentsCount || 0} replies</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={[styles.viewThreadText, { color: colors.accent }]}>View Thread</Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.accent} />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 60 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7' }]}>
                <Ionicons name="chatbubbles-outline" size={36} color="#10b981" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Comments Yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Replies you share on community discussions will automatically appear in this feed.
              </Text>
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/forum' as any)}
              >
                <Text style={styles.ctaButtonText}>Browse Lounge Discussions</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const targetPostId =
              typeof item.post === 'object' && item.post?._id
                ? item.post._id
                : typeof item.post === 'string'
                ? item.post
                : null;
            const targetPostTitle =
              typeof item.post === 'object' && item.post?.title
                ? item.post.title
                : 'Community Discussion Thread';

            return (
              <TouchableOpacity
                style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.88}
                disabled={!targetPostId}
                onPress={() => {
                  if (targetPostId) {
                    router.push(`/forum/${targetPostId}` as any);
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                    <Text style={[styles.commentRepliedTo, { color: colors.textSecondary }]} numberOfLines={1}>
                      On: <Text style={{ fontWeight: '700', color: colors.text }}>{targetPostTitle}</Text>
                    </Text>
                  </View>
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>

                <Text style={[styles.commentSnippet, { color: colors.text }]} numberOfLines={3}>
                  "{item.text}"
                </Text>

                <View style={[styles.cardFooter, { borderTopColor: colors.border, justifyContent: 'flex-end' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={[styles.viewThreadText, { color: colors.accent }]}>Go to Comment</Text>
                    <Ionicons name="chevron-forward" size={13} color={colors.accent} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  loungeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  loungeLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsSummaryWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabSegmentWrapper: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  youBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  youBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stockTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 10,
  },
  commentRepliedTo: {
    fontSize: 12,
    flex: 1,
  },
  commentSnippet: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewThreadText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
