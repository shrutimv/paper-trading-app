import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Platform,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../src/config/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ForumPost {
  _id: string;
  author?: string;
  guestId?: string;
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

export default function ForumScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(colors, isDark);
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [guestId, setGuestId] = useState<string>('');

  // Create Post Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumPost['category']>('GENERAL');
  const [newStockTag, setNewStockTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const modalScrollRef = useRef<ScrollView>(null);

  // Enable LayoutAnimation for Android keyboard transition
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Load or generate persistent guest ID
  useEffect(() => {
    const initGuestId = async () => {
      try {
        let storedGuestId = await AsyncStorage.getItem('@forum_guest_id');
        if (!storedGuestId) {
          storedGuestId = 'guest_' + Math.random().toString(36).substring(2, 10);
          await AsyncStorage.setItem('@forum_guest_id', storedGuestId);
        }
        setGuestId(storedGuestId);
      } catch {
        // Fallback
      }
    };
    initGuestId();
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedTag) params.stockTag = selectedTag;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (guestId) params.guestId = guestId;

      const res = await axios.get(`${BASE_URL}/api/forum/posts`, {
        params,
        timeout: 10000,
        withCredentials: true,
      });

      if (res.data?.success && Array.isArray(res.data.posts)) {
        setPosts(res.data.posts);
      } else {
        setPosts([]);
      }
    } catch (err: any) {
      console.log('Error fetching forum posts:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedTag, searchQuery, guestId]);

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
      await axios.post(
        `${BASE_URL}/api/forum/posts/${postId}/like`,
        { guestId },
        { withCredentials: true, timeout: 6000 }
      );
    } catch {
      // Revert if failed
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Missing Fields', 'Please fill out both the title and content.');
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const authorName = user?.username || (await AsyncStorage.getItem('guestTraderName')) || 'Guest Trader';

    const postPayload = {
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      stockTag: newStockTag.trim().toUpperCase().replace('$', ''),
      authorUsername: authorName,
      guestId,
    };

    try {
      const res = await axios.post(`${BASE_URL}/api/forum/posts`, postPayload, {
        withCredentials: true,
        timeout: 12000,
      });

      if (res.data?.success && res.data.post) {
        setPosts(prev => [res.data.post, ...prev]);
        setIsCreateOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewStockTag('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to publish post.');
      }
    } catch (e: any) {
      Alert.alert('Publish Error', e?.response?.data?.message || 'Could not connect to forum server.');
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

  // Check if current user is the author
  const isCurrentUserPost = (item: ForumPost) => {
    const isUserMatch =
      user?.username &&
      user.username !== 'Guest User' &&
      item.authorUsername.toLowerCase() === user.username.toLowerCase();
    const isGuestMatch = guestId && item.guestId && item.guestId === guestId;
    return Boolean(isUserMatch || isGuestMatch);
  };

  const renderPost = ({ item }: { item: ForumPost }) => {
    const categoryMeta = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[1];
    const isMine = isCurrentUserPost(item);

    return (
      <TouchableOpacity
        style={[
          styles.postCard,
          isMine && { borderColor: isDark ? 'rgba(37,99,235,0.45)' : '#93c5fd' },
        ]}
        activeOpacity={0.88}
        onPress={() => router.push(`/forum/${item._id}` as any)}
      >
        {/* Header Row: Author, Category Badge, Stock Tag */}
        <View style={styles.postHeader}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: isMine ? (isDark ? '#1e3a8a' : '#bfdbfe') : (isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe') }]}>
              <Text style={[styles.avatarText, isMine && { color: '#2563eb' }]}>
                {item.authorUsername.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.authorName}>{item.authorUsername}</Text>
                {isMine && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>YOU</Text>
                  </View>
                )}
              </View>
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
          <View style={styles.footerActionGroup}>
            <TouchableOpacity
              style={[
                styles.actionChip,
                item.isLiked && { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2' },
              ]}
              onPress={() => handleToggleLike(item._id)}
            >
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={item.isLiked ? '#ef4444' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionText,
                  item.isLiked && { color: '#ef4444', fontWeight: '700' },
                ]}
              >
                {item.likesCount}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionChip}>
              <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.actionText}>{item.commentsCount}</Text>
            </View>
          </View>

          <View style={styles.readMoreRow}>
            <Text style={styles.readMoreText}>View Discussion</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Hide any native Stack header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Custom Navigation Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Traders Lounge</Text>
            <Text style={styles.headerSub}>Community Market Discussions</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsCreateOpen(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.newPostText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics, setups, or stocks..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={fetchPosts}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips Bar */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && {
                    backgroundColor: cat.color ? `${cat.color}20` : (isDark ? '#1e293b' : '#e2e8f0'),
                    borderColor: cat.color || colors.accent,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(cat.id);
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? (cat.color || colors.accent) : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && {
                      color: cat.color || colors.accent,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Trending Indian Stock Tag Filters */}
      <View style={styles.tagFiltersRow}>
        <Text style={styles.tagFilterLabel}>TAGS:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {POPULAR_TAGS.map(tag => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagPill,
                  isSelected && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTag(isSelected ? null : tag);
                }}
              >
                <Text
                  style={[
                    styles.tagPillText,
                    isSelected && { color: '#ffffff', fontWeight: '800' },
                  ]}
                >
                  #{tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Post List / Empty State */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Syncing community feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item._id}
          renderItem={renderPost}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 60 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={38} color="#2563eb" />
              </View>
              <Text style={styles.emptyTitle}>No Discussions Yet</Text>
              <Text style={styles.emptySub}>
                Be the first to share your market analysis, ask a trading question, or post a strategy!
              </Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => setIsCreateOpen(true)}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.emptyActionText}>Start First Discussion</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Post Modal */}
      <Modal visible={isCreateOpen} animationType="slide" transparent onRequestClose={() => setIsCreateOpen(false)}>
        <View style={styles.modalBackdrop}>
          {/* Tapping outside card dismisses keyboard if open, or closes modal if keyboard is closed */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (keyboardHeight > 0) {
                Keyboard.dismiss();
              } else {
                setIsCreateOpen(false);
              }
            }}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
            style={[
              {
                width: '100%',
                justifyContent: 'flex-end',
              },
              Platform.OS === 'android' && keyboardHeight > 0 && {
                paddingBottom: keyboardHeight,
              },
            ]}
          >
            <View
              style={[
                styles.modalCard,
                {
                  maxHeight: keyboardHeight > 0
                    ? Math.max(SCREEN_HEIGHT - keyboardHeight - (insets.top || 30) - 20, 320)
                    : SCREEN_HEIGHT * 0.88,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>New Discussion</Text>
                  <Text style={styles.modalSub}>Share insights with the community</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsCreateOpen(false);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                ref={modalScrollRef}
                showsVerticalScrollIndicator={false} 
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingBottom: 36 }}
              >
              {/* Category Picker */}
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <View style={styles.modalCategoryRow}>
                {(['GENERAL', 'ANALYSIS', 'STRATEGY', 'QUESTION', 'NEWS'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalCatChip,
                      newCategory === cat && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.modalCatText,
                        newCategory === cat && { color: '#ffffff', fontWeight: '800' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Stock Tag Input */}
              <Text style={styles.inputLabel}>STOCK TAG (OPTIONAL)</Text>
              <TextInput
                style={styles.textInputSingle}
                placeholder="e.g. TATAMOTORS, ZOMATO, NIFTY50"
                placeholderTextColor={colors.textSecondary}
                value={newStockTag}
                onChangeText={setNewStockTag}
                autoCapitalize="characters"
              />

              {/* Title Input */}
              <Text style={styles.inputLabel}>TOPIC TITLE *</Text>
              <TextInput
                style={styles.textInputSingle}
                placeholder="What is your trade thesis or question?"
                placeholderTextColor={colors.textSecondary}
                value={newTitle}
                onChangeText={setNewTitle}
                maxLength={140}
                onFocus={() => {
                  setTimeout(() => {
                    modalScrollRef.current?.scrollTo({ y: 120, animated: true });
                  }, 150);
                }}
              />

              {/* Content Body */}
              <Text style={styles.inputLabel}>DISCUSSION DETAILS *</Text>
              <TextInput
                style={styles.textInputMulti}
                placeholder="Share your reasoning, chart levels, entry/exit setups, or questions..."
                placeholderTextColor={colors.textSecondary}
                value={newContent}
                onChangeText={setNewContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                onFocus={() => {
                  setTimeout(() => {
                    modalScrollRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
              />

              {/* Submit CTA */}
              <TouchableOpacity
                style={[styles.submitButton, (!newTitle.trim() || !newContent.trim()) && { opacity: 0.6 }]}
                disabled={submitting || !newTitle.trim() || !newContent.trim()}
                onPress={handleCreatePost}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={17} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.submitButtonText}>Publish to Community</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  </SafeAreaView>
);
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
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
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      padding: 6,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    headerSub: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    newPostButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      gap: 4,
    },
    newPostText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
    },
    searchBarWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 42,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      color: colors.text,
      fontSize: 14,
    },
    categoriesWrapper: {
      paddingVertical: 4,
    },
    categoryScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tagFiltersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      gap: 8,
    },
    tagFilterLabel: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
      color: colors.textSecondary,
    },
    tagPill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    listContainer: {
      padding: 16,
      gap: 14,
    },
    postCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 15,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#2563eb',
    },
    authorName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    timeAgo: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    youBadge: {
      backgroundColor: '#2563eb',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    youBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    pillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    pillBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    stockTagBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    stockTagText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#2563eb',
    },
    postTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      lineHeight: 22,
      marginBottom: 6,
    },
    postSnippet: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
      marginBottom: 12,
    },
    postFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    footerActionGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    actionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
    },
    actionText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    readMoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    readMoreText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      gap: 12,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 30,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
    },
    emptySub: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    emptyActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 11,
      borderRadius: 24,
      gap: 6,
    },
    emptyActionText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '92%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingBottom: 12,
    },
    modalTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.text,
    },
    modalSub: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.6,
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 10,
    },
    modalCategoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    modalCatChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalCatText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
    textInputSingle: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 14,
      marginBottom: 6,
    },
    textInputMulti: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 14,
      minHeight: 120,
      marginBottom: 16,
    },
    submitButton: {
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 4,
      marginBottom: 20,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },
  });
