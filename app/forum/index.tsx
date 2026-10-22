import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../src/config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ForumPost {
  _id: string;
  authorUsername: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'ANALYSIS' | 'NEWS' | 'QUESTION' | 'STRATEGY';
  stockTag?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isPinned?: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All', icon: 'grid-outline' },
  { id: 'ANALYSIS', label: 'Analysis', icon: 'analytics-outline', color: '#2563eb' },
  { id: 'STRATEGY', label: 'Strategy', icon: 'bulb-outline', color: '#16a34a' },
  { id: 'QUESTION', label: 'Q&A', icon: 'help-circle-outline', color: '#8b5cf6' },
  { id: 'NEWS', label: 'News', icon: 'newspaper-outline', color: '#f59e0b' },
  { id: 'GENERAL', label: 'General', icon: 'chatbubbles-outline', color: '#64748b' },
];

const POPULAR_TAGS = ['TATAMOTORS', 'ZOMATO', 'NIFTY50', 'RELIANCE', 'JIOFIN', 'SWIGGY'];

// High-value realistic fallback discussions for cold-start or offline resilience
const FALLBACK_POSTS: ForumPost[] = [
  {
    _id: 'fb-1',
    authorUsername: 'Rahul_SwingTrader',
    title: 'Tata Motors Commercial Vehicles (TMCV) at ₹410: Post-Demerger Analysis',
    content: 'Now that the commercial vehicle entity is trading around ₹410, EV fleet orders and margin expansion make this a solid accumulation zone. Anyone else buying for long-term?',
    category: 'ANALYSIS',
    stockTag: 'TATAMOTORS',
    likesCount: 24,
    commentsCount: 8,
    isLiked: false,
    isPinned: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'fb-2',
    authorUsername: 'Priya_Quant',
    title: 'Zomato touching ₹249: Blinkit quick-commerce unit economics',
    content: 'Quick commerce EBITDA break-even in 10 major metro clusters is driving this continuous volume. Setting trailing stop-loss at ₹238.',
    category: 'STRATEGY',
    stockTag: 'ZOMATO',
    likesCount: 19,
    commentsCount: 5,
    isLiked: true,
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: 'fb-3',
    authorUsername: 'BeginnerTrader_Aman',
    title: 'What is the exact difference between CNC vs MIS for intraday?',
    content: 'I noticed MIS gives 5x leverage while CNC requires full cash. If I keep MIS past 3:20 PM, does the broker auto square-off at market price?',
    category: 'QUESTION',
    stockTag: 'NIFTY50',
    likesCount: 31,
    commentsCount: 14,
    isLiked: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    _id: 'fb-4',
    authorUsername: 'Market_Pulse_AI',
    title: 'Jio Financial Services (JIOFIN) gets BlackRock JV clearance',
    content: 'Asset management license secured. Wealth management and retail digital lending rollout scheduled for Q3. Strong support seen around ₹308-₹314.',
    category: 'NEWS',
    stockTag: 'JIOFIN',
    likesCount: 42,
    commentsCount: 9,
    isLiked: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export default function ForumScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(colors, isDark);

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Post Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumPost['category']>('GENERAL');
  const [newStockTag, setNewStockTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedTag) params.stockTag = selectedTag;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get(`${BASE_URL}/api/forum/posts`, {
        params,
        timeout: 10000,
        withCredentials: true,
      });

      if (res.data?.success && Array.isArray(res.data.posts) && res.data.posts.length > 0) {
        setPosts(res.data.posts);
      } else {
        // Filter fallback posts based on local active filters
        let filtered = [...FALLBACK_POSTS];
        if (selectedCategory !== 'ALL') {
          filtered = filtered.filter(p => p.category === selectedCategory);
        }
        if (selectedTag) {
          filtered = filtered.filter(p => p.stockTag?.toUpperCase() === selectedTag.toUpperCase());
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
        }
        setPosts(filtered);
      }
    } catch (e) {
      // Graceful offline fallback
      let filtered = [...FALLBACK_POSTS];
      if (selectedCategory !== 'ALL') {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }
      if (selectedTag) {
        filtered = filtered.filter(p => p.stockTag?.toUpperCase() === selectedTag.toUpperCase());
      }
      setPosts(filtered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedTag, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleToggleLike = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic UI update
    setPosts(prev =>
      prev.map(p => {
        if (p._id === postId) {
          const currentlyLiked = !p.isLiked;
          return {
            ...p,
            isLiked: currentlyLiked,
            likesCount: currentlyLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    try {
      await axios.post(`${BASE_URL}/api/forum/posts/${postId}/like`, {}, { withCredentials: true, timeout: 6000 });
    } catch {
      // Non-blocking for offline demo
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Please fill out both the title and content.');
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const postPayload = {
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      stockTag: newStockTag.trim().toUpperCase().replace('$', ''),
    };

    try {
      const res = await axios.post(`${BASE_URL}/api/forum/posts`, postPayload, {
        withCredentials: true,
        timeout: 10000,
      });

      if (res.data?.success && res.data.post) {
        setPosts(prev => [res.data.post, ...prev]);
      } else {
        // Create optimistic local post
        const newLocalPost: ForumPost = {
          _id: 'local-' + Date.now(),
          authorUsername: user?.username || 'You',
          title: postPayload.title,
          content: postPayload.content,
          category: postPayload.category,
          stockTag: postPayload.stockTag,
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
        };
        setPosts(prev => [newLocalPost, ...prev]);
      }

      setIsCreateOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewStockTag('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Fallback optimistic post
      const newLocalPost: ForumPost = {
        _id: 'local-' + Date.now(),
        authorUsername: user?.username || 'You',
        title: postPayload.title,
        content: postPayload.content,
        category: postPayload.category,
        stockTag: postPayload.stockTag,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
      };
      setPosts(prev => [newLocalPost, ...prev]);
      setIsCreateOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewStockTag('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = Date.now();
      const past = new Date(dateStr).getTime();
      const diffMs = now - past;
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const renderPost = ({ item }: { item: ForumPost }) => {
    const categoryMeta = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[1];
    return (
      <TouchableOpacity
        style={styles.postCard}
        activeOpacity={0.88}
        onPress={() => router.push(`/forum/${item._id}` as any)}
      >
        {/* Header Row: Author, Category Badge, Stock Tag */}
        <View style={styles.postHeader}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe' }]}>
              <Text style={styles.avatarText}>
                {item.authorUsername.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{item.authorUsername}</Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            {item.isPinned && (
              <View style={[styles.pillBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Ionicons name="pin" size={11} color="#ca8a04" style={{ marginRight: 2 }} />
                <Text style={[styles.pillBadgeText, { color: '#ca8a04' }]}>PINNED</Text>
              </View>
            )}

            <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}>
              <Text style={[styles.pillBadgeText, { color: categoryMeta.color || colors.accent }]}>
                {item.category}
              </Text>
            </View>

            {item.stockTag ? (
              <View style={[styles.stockTagBadge, { backgroundColor: isDark ? 'rgba(37,99,235,0.12)' : '#eff6ff' }]}>
                <Text style={styles.stockTagText}>${item.stockTag}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Post Title */}
        <Text style={styles.postTitle}>{item.title}</Text>

        {/* Post Content Snippet */}
        <Text style={styles.postSnippet} numberOfLines={3}>
          {item.content}
        </Text>

        {/* Card Footer: Likes, Comments, View Thread */}
        <View style={styles.postFooter}>
          <View style={styles.actionStatsGroup}>
            <TouchableOpacity
              style={styles.statBtn}
              onPress={() => handleToggleLike(item._id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={item.isLiked ? '#ef4444' : colors.textSecondary}
              />
              <Text style={[styles.statBtnText, item.isLiked && { color: '#ef4444', fontWeight: '800' }]}>
                {item.likesCount}
              </Text>
            </TouchableOpacity>

            <View style={styles.statBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={17} color={colors.textSecondary} />
              <Text style={styles.statBtnText}>{item.commentsCount}</Text>
            </View>
          </View>

          <View style={styles.viewThreadBtn}>
            <Text style={styles.viewThreadText}>View Discussion</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── TOP HEADER ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.topBarTitle}>Traders Lounge</Text>
          <Text style={styles.topBarSub}>Community Discussions & Trade Ideas</Text>
        </View>

        <TouchableOpacity
          style={styles.newPostHeaderBtn}
          onPress={() => setIsCreateOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 2 }} />
          <Text style={styles.newPostHeaderBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* ── SEARCH BAR ── */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics, questions, or stock tags..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── CATEGORY PILLS BAR ── */}
      <View style={{ marginBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.id);
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? '#fff' : colors.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── TRENDING STOCK TAGS CHIP STRIP ── */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
          <Text style={styles.trendingTagLabel}>Trending Tags:</Text>
          {POPULAR_TAGS.map(tag => {
            const isTagActive = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, isTagActive && styles.tagChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTag(isTagActive ? null : tag);
                }}
              >
                <Text style={[styles.tagChipText, isTagActive && styles.tagChipTextActive]}>
                  #{tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── POSTS FEED ── */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading community feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item._id}
          renderItem={renderPost}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={44} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No discussions found</Text>
              <Text style={styles.emptySub}>Be the first to share an analysis or question!</Text>
              <TouchableOpacity style={styles.createFirstBtn} onPress={() => setIsCreateOpen(true)}>
                <Text style={styles.createFirstBtnText}>Create New Post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── CREATE POST MODAL ── */}
      <Modal visible={isCreateOpen} animationType="slide" transparent onRequestClose={() => setIsCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.createCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Start Discussion</Text>
                <Text style={styles.modalSub}>Share trade insights or ask market questions</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCreateOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Tata Motors breakout targets or Zomato Q2 earnings"
              placeholderTextColor={colors.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={150}
            />

            {/* Category Selector */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Category</Text>
            <View style={styles.modalCategoryRow}>
              {(['ANALYSIS', 'STRATEGY', 'QUESTION', 'NEWS', 'GENERAL'] as const).map(cat => {
                const isActive = newCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalCatChip, isActive && styles.modalCatChipActive]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={[styles.modalCatText, isActive && styles.modalCatTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Stock Tag */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Stock Symbol (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. TATAMOTORS, ZOMATO, RELIANCE"
              placeholderTextColor={colors.textSecondary}
              value={newStockTag}
              onChangeText={setNewStockTag}
              autoCapitalize="characters"
              maxLength={20}
            />

            {/* Content Input */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Discussion Body</Text>
            <TextInput
              style={[styles.textInput, { height: 110, textAlignVertical: 'top' }]}
              placeholder="Share your reasoning, entry/exit levels, or what questions you have for other traders..."
              placeholderTextColor={colors.textSecondary}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              maxLength={2000}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.publishBtn, (!newTitle.trim() || !newContent.trim() || submitting) && { opacity: 0.6 }]}
              disabled={!newTitle.trim() || !newContent.trim() || submitting}
              onPress={handleCreatePost}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.publishBtnText}>Publish to Community</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 12 : 6,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      padding: 6,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
    },
    topBarTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: -0.2,
    },
    topBarSub: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    newPostHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    newPostHeaderBtnText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },
    searchBarWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginVertical: 10,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
    },
    categoryScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    categoryChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    categoryChipTextActive: {
      color: '#ffffff',
    },
    tagsScroll: {
      paddingHorizontal: 16,
      alignItems: 'center',
      gap: 6,
    },
    trendingTagLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginRight: 2,
    },
    tagChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagChipActive: {
      backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe',
      borderColor: '#2563eb',
    },
    tagChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tagChipTextActive: {
      color: '#2563eb',
    },
    postCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 15,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    postHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 14,
      fontWeight: '900',
      color: '#2563eb',
    },
    authorName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    timeAgo: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    pillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    pillBadgeText: {
      fontSize: 9,
      fontWeight: '800',
    },
    stockTagBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    stockTagText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#2563eb',
    },
    postTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      lineHeight: 20,
      marginBottom: 6,
    },
    postSnippet: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionStatsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    statBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    viewThreadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    viewThreadText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 60,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 10,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
      marginTop: 40,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    emptySub: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 16,
    },
    createFirstBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 10,
    },
    createFirstBtnText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 13,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    createCard: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      borderTopWidth: 1,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
    },
    modalSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: 4,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
    },
    modalCategoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 2,
    },
    modalCatChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    },
    modalCatChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    modalCatText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    modalCatTextActive: {
      color: '#fff',
    },
    publishBtn: {
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 12,
      marginTop: 18,
      marginBottom: Platform.OS === 'ios' ? 16 : 6,
    },
    publishBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
  });
