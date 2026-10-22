import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../src/config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ForumComment {
  _id: string;
  author?: string;
  guestId?: string;
  authorUsername: string;
  text: string;
  likesCount?: number;
  isLiked?: boolean;
  createdAt: string;
}

interface FullPost {
  _id: string;
  author?: string;
  guestId?: string;
  authorUsername: string;
  title: string;
  content: string;
  category: string;
  stockTag?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isPinned?: boolean;
  createdAt: string;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [post, setPost] = useState<FullPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [guestId, setGuestId] = useState<string>('');

  const scrollViewRef = useRef<ScrollView>(null);

  // Load guest ID
  useEffect(() => {
    const initGuestId = async () => {
      try {
        let stored = await AsyncStorage.getItem('@forum_guest_id');
        if (!stored) {
          stored = 'guest_' + Math.random().toString(36).substring(2, 10);
          await AsyncStorage.setItem('@forum_guest_id', stored);
        }
        setGuestId(stored);
      } catch {
        // Fallback
      }
    };
    initGuestId();
  }, []);

  const fetchPostDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const res = await axios.get(`${BASE_URL}/api/forum/posts/${id}`, {
        params: { guestId },
        withCredentials: true,
        timeout: 10000,
      });

      if (res.data?.success && res.data.post) {
        setPost(res.data.post);
        setComments(res.data.comments || []);
      } else {
        setPost(null);
        setComments([]);
      }
    } catch (err: any) {
      console.log('Error loading post:', err?.message);
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [id, guestId]);

  useEffect(() => {
    if (guestId) {
      fetchPostDetails();
    }
  }, [guestId, fetchPostDetails]);

  const handleTogglePostLike = async () => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const willBeLiked = !post.isLiked;
    setPost(prev =>
      prev
        ? {
            ...prev,
            isLiked: willBeLiked,
            likesCount: willBeLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
          }
        : null
    );

    try {
      await axios.post(
        `${BASE_URL}/api/forum/posts/${post._id}/like`,
        { guestId },
        { withCredentials: true, timeout: 6000 }
      );
    } catch {
      // Revert if failed
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !post) return;

    const commentBody = newCommentText.trim();
    setSubmittingComment(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const authorName = user?.username || (await AsyncStorage.getItem('guestTraderName')) || 'Guest Trader';

    try {
      const res = await axios.post(
        `${BASE_URL}/api/forum/posts/${post._id}/comment`,
        {
          text: commentBody,
          authorUsername: authorName,
          guestId,
        },
        { withCredentials: true, timeout: 10000 }
      );

      if (res.data?.success && res.data.comment) {
        setComments(prev => [...prev, res.data.comment]);
        setPost(prev => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null));
        setNewCommentText('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 200);
      } else {
        Alert.alert('Comment Failed', res.data?.message || 'Could not post comment.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit comment to server.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = Date.now();
      const diffMs = now - d.getTime();
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

  // Check if current user is author of post
  const isMyPost = Boolean(
    (user?.username &&
      user.username !== 'Guest User' &&
      post?.authorUsername &&
      post.authorUsername.toLowerCase() === user.username.toLowerCase()) ||
      (guestId && post?.guestId && post.guestId === guestId)
  );

  // Check if current user is author of comment
  const isMyComment = (c: ForumComment) => {
    const isUserMatch =
      user?.username &&
      user.username !== 'Guest User' &&
      c.authorUsername.toLowerCase() === user.username.toLowerCase();
    const isGuestMatch = guestId && c.guestId && c.guestId === guestId;
    return Boolean(isUserMatch || isGuestMatch);
  };

  const isCommentFromPostAuthor = (c: ForumComment) => {
    return Boolean(
      post?.authorUsername &&
        c.authorUsername.toLowerCase() === post.authorUsername.toLowerCase()
    );
  };

  const categoryColor =
    post?.category === 'ANALYSIS'
      ? '#2563eb'
      : post?.category === 'STRATEGY'
      ? '#16a34a'
      : post?.category === 'QUESTION'
      ? '#8b5cf6'
      : post?.category === 'NEWS'
      ? '#f59e0b'
      : '#64748b';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Hide native Stack navigation header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Custom Navigation Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Discussion
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.contentScroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading discussion...
              </Text>
            </View>
          ) : post ? (
            <View style={{ padding: 16 }}>
              {/* Post Card Box */}
              <View
                style={[
                  styles.mainPostCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isMyPost ? (isDark ? 'rgba(37,99,235,0.45)' : '#93c5fd') : colors.border,
                  },
                ]}
              >
                {/* Author Info & Badges */}
                <View style={styles.authorSection}>
                  <View style={[styles.avatar, { backgroundColor: isMyPost ? (isDark ? '#1e3a8a' : '#bfdbfe') : (isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe') }]}>
                    <Text style={[styles.avatarText, isMyPost && { color: '#2563eb' }]}>
                      {post.authorUsername.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.authorName, { color: colors.text }]}>
                        {post.authorUsername}
                      </Text>
                      {isMyPost && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.postDate, { color: colors.textSecondary }]}>
                      Posted {formatTime(post.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.badgesWrapper}>
                    <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}1A` }]}>
                      <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                        {post.category}
                      </Text>
                    </View>
                    {post.stockTag ? (
                      <View style={[styles.stockTagBadge, { backgroundColor: isDark ? 'rgba(37,99,235,0.12)' : '#eff6ff' }]}>
                        <Text style={styles.stockTagText}>${post.stockTag}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Post Title */}
                <Text style={[styles.postTitle, { color: colors.text }]}>
                  {post.title}
                </Text>

                {/* Post Content */}
                <Text style={[styles.postBody, { color: isDark ? '#e2e8f0' : '#334155' }]}>
                  {post.content}
                </Text>

                {/* Action Bar */}
                <View style={[styles.actionBar, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      post.isLiked && { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2' },
                    ]}
                    onPress={handleTogglePostLike}
                  >
                    <Ionicons
                      name={post.isLiked ? 'heart' : 'heart-outline'}
                      size={18}
                      color={post.isLiked ? '#ef4444' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        { color: post.isLiked ? '#ef4444' : colors.textSecondary },
                      ]}
                    >
                      {post.likesCount || 0} Likes
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={17} color={colors.textSecondary} />
                    <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
                      {comments.length} Comments
                    </Text>
                  </View>
                </View>
              </View>

              {/* Comments Section Header */}
              <View style={styles.commentsHeaderRow}>
                <Text style={[styles.commentsSectionTitle, { color: colors.text }]}>
                  Discussion & Insights ({comments.length})
                </Text>
                <Text style={[styles.commentsSub, { color: colors.textSecondary }]}>
                  Community Traders
                </Text>
              </View>

              {/* Comments List */}
              {comments.length === 0 ? (
                <View style={[styles.emptyCommentsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.6 }} />
                  <Text style={[styles.emptyCommentsTitle, { color: colors.text }]}>
                    No comments yet
                  </Text>
                  <Text style={[styles.emptyCommentsDesc, { color: colors.textSecondary }]}>
                    Be the first to share your market perspective or answer below!
                  </Text>
                </View>
              ) : (
                comments.map((item, index) => {
                  const isMine = isMyComment(item);
                  const isAuthor = isCommentFromPostAuthor(item);

                  return (
                    <View
                      key={item._id || index.toString()}
                      style={[
                        styles.commentCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: isMine ? (isDark ? 'rgba(37,99,235,0.35)' : '#bfdbfe') : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.commentHeader}>
                        <View style={[styles.commentAvatar, { backgroundColor: isMine ? (isDark ? '#1e3a8a' : '#bfdbfe') : (isDark ? 'rgba(16,185,129,0.2)' : '#dcfce7') }]}>
                          <Text style={[styles.commentAvatarText, { color: isMine ? '#2563eb' : (isDark ? '#34d399' : '#059669') }]}>
                            {item.authorUsername.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.commentAuthor, { color: colors.text }]}>
                              {item.authorUsername}
                            </Text>

                            {isMine && (
                              <View style={styles.youBadge}>
                                <Text style={styles.youBadgeText}>YOU</Text>
                              </View>
                            )}

                            {isAuthor && !isMine && (
                              <View style={styles.opBadge}>
                                <Text style={styles.opBadgeText}>OP</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                            {formatTime(item.createdAt)}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.commentText, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                        {item.text}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyCommentsTitle, { color: colors.text, marginTop: 12 }]}>
                Post Not Found
              </Text>
              <Text style={[styles.emptyCommentsDesc, { color: colors.textSecondary }]}>
                This discussion may have been removed or does not exist.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  marginTop: 16,
                }}
                onPress={() => router.back()}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Back to Forum</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Sticky Comment Input Bar at the Bottom */}
        {post && (
          <View
            style={[
              styles.bottomInputBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Write a constructive response..."
              placeholderTextColor={colors.textSecondary}
              value={newCommentText}
              onChangeText={setNewCommentText}
              multiline
              maxLength={600}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: newCommentText.trim() ? colors.accent : (isDark ? '#334155' : '#cbd5e1') },
              ]}
              disabled={!newCommentText.trim() || submittingComment}
              onPress={handleAddComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={17} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  contentScroll: {
    flex: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  mainPostCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
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
  opBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  opBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  stockTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  postTitle: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 10,
  },
  postBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentsHeaderRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  commentsSub: {
    fontSize: 12,
  },
  emptyCommentsBox: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyCommentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyCommentsDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  commentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 90,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
