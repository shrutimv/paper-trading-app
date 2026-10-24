import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Dimensions,
  Alert,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL, getAuthHeaders } from '../../src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getRankName = (xp: number) => {
  if (xp >= 10000) return 'Diamond';
  if (xp >= 6000) return 'Platinum';
  if (xp >= 3000) return 'Gold';
  if (xp >= 1500) return 'Silver';
  if (xp >= 500) return 'Bronze';
  return 'Novice';
};

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  isMine: boolean;
  read?: boolean;
  createdAt: string;
  isPending?: boolean;
}

interface FriendProfile {
  id: string;
  username: string;
  avatarUrl: string;
  xp: number;
  balance: number;
  bio?: string;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, isGuest, isLoggedIn } = useAuth();
  const { friendId, username: initialUsername } = useLocalSearchParams<{ friendId: string; username?: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const pollingTimerRef = useRef<any>(null);

  // Enable LayoutAnimation for Android
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
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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

  // Load cached messages from AsyncStorage immediately on open
  useEffect(() => {
    if (!friendId) return;
    AsyncStorage.getItem(`@chat_cache_${friendId}`).then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    });
  }, [friendId]);

  // Fetch chat history
  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!friendId || isGuest || !isLoggedIn) return;

    try {
      if (isInitial && messages.length === 0) setLoading(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/chat/messages/${friendId}`, {
        headers: {
          ...authHeaders,
        },
        credentials: 'include',
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.log(`[Chat] Non-JSON response received (status ${res.status})`);
        return;
      }

      const data = await res.json();

      if (res.status === 403) {
        Alert.alert(
          'Friend Only Feature',
          data.message || 'You can only message confirmed friends.',
          [{ text: 'Back to Friends', onPress: () => router.back() }]
        );
        return;
      }

      if (data.success) {
        if (data.friend) setFriend(data.friend);

        const serverMsgs: ChatMessage[] = data.messages || [];

        // Save server messages to local AsyncStorage cache
        if (serverMsgs.length > 0) {
          AsyncStorage.setItem(`@chat_cache_${friendId}`, JSON.stringify(serverMsgs)).catch(() => {});
        }

        setMessages((prev) => {
          // Keep optimistic pending messages that have not yet been confirmed
          const pending = prev.filter((m) => m.isPending);

          // Deduplicate by text/timestamp or ID
          const combined = [...serverMsgs];
          for (const p of pending) {
            if (!serverMsgs.some((s: ChatMessage) => s.text === p.text && Math.abs(new Date(s.createdAt).getTime() - new Date(p.createdAt).getTime()) < 5000)) {
              combined.push(p);
            }
          }
          return combined;
        });

        if (isInitial) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }, 150);
        }
      }
    } catch (err) {
      console.log('fetchMessages error:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [friendId, isGuest, isLoggedIn, router, messages.length]);

  // Initial load and polling every 3.5 seconds
  useEffect(() => {
    fetchMessages(true);

    pollingTimerRef.current = setInterval(() => {
      fetchMessages(false);
    }, 3500);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [fetchMessages]);

  // Send message handler
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending || !friendId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      text,
      senderId: user?.id || 'me',
      isMine: true,
      read: false,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setSending(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/chat/messages/${friendId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (res.status === 404) {
          Alert.alert(
            'Chat Service Deploying',
            'The chat feature on Render is currently building or deploying. If Auto-Deploy is disabled on Render, please click "Manual Deploy" -> "Deploy latest commit" in your Render dashboard.',
            [{ text: 'OK' }]
          );
        } else if (res.status === 502 || res.status === 503) {
          Alert.alert(
            'Server Waking Up',
            'Render free tier is spinning up the server. Please try sending again in 10-15 seconds.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Notice', `Server returned status code ${res.status}. Please try again shortly.`);
        }
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      const data = await res.json();

      if (res.ok && data.success && data.message) {
        setMessages((prev) => {
          const updated = prev.map((m) => (m.id === tempId ? { ...data.message, isPending: false } : m));
          AsyncStorage.setItem(`@chat_cache_${friendId}`, JSON.stringify(updated.filter((m) => !m.isPending))).catch(() => {});
          return updated;
        });
      } else {
        Alert.alert('Send Failed', data.message || `Could not send message (${res.status}).`);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (err: any) {
      console.log('handleSendMessage error:', err);
      const isConnectionErr = err?.message?.toLowerCase()?.includes('network') || err?.message?.toLowerCase()?.includes('failed to fetch');
      Alert.alert(
        isConnectionErr ? 'Connection Error' : 'Send Error',
        isConnectionErr
          ? 'Could not connect to backend server. Please check your internet or retry once Render wakes up.'
          : (err?.message || 'Could not send message.')
      );
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const friendUsername = friend?.username || initialUsername || 'Trader';
  const rank = getRankName(friend?.xp || 0);

  // If user is guest, show locked banner
  if (isGuest || !isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Direct Chat</Text>
        </View>
        <View style={styles.lockedContainer}>
          <View style={[styles.lockedIconCircle, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="lock-closed" size={44} color={colors.accent} />
          </View>
          <Text style={[styles.lockedTitle, { color: colors.text }]}>Chat Requires Verified Account</Text>
          <Text style={[styles.lockedDesc, { color: colors.textSecondary }]}>
            Guest traders cannot access 1-on-1 chats. Log in or create an account to start messaging your friends!
          </Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/auth' as any)}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Log In to Chat</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* CHAT HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Friend Avatar & Info */}
        <View style={styles.headerProfile}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{friendUsername.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                @{friendUsername}
              </Text>
              <View style={[styles.rankBadge, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.rankBadgeText, { color: colors.accent }]}>{rank}</Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: '#10b981' }]}>
              ● Confirmed Friend
            </Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => {
            if (friend) {
              Alert.alert(
                `@${friend.username}`,
                `Rank: ${rank} Trader\nXP: ${(friend.xp || 0).toLocaleString()} XP\nStarting Capital: ₹${(friend.balance || 100000).toLocaleString()}\nBio: ${friend.bio || 'Market Learner'}`
              );
            }
          }}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* MESSAGES SCROLL LIST */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading conversation...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff' }]}>
                <Ionicons name="chatbubbles" size={36} color={colors.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Break the ice! Ask @{friendUsername} what stocks they're watching or share your favorite trading strategy.
              </Text>
            </View>
          ) : (
            messages.map((item) => {
              const timeString = new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View
                  key={item.id}
                  style={[
                    styles.messageRow,
                    item.isMine ? styles.messageRowMine : styles.messageRowFriend,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      item.isMine
                        ? [styles.bubbleMine, { backgroundColor: colors.accent }]
                        : [
                            styles.bubbleFriend,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: item.isMine ? '#ffffff' : colors.text },
                      ]}
                    >
                      {item.text}
                    </Text>

                    <View style={styles.bubbleFooter}>
                      <Text
                        style={[
                          styles.timestampText,
                          { color: item.isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                        ]}
                      >
                        {timeString}
                      </Text>
                      {item.isMine && (
                        <Ionicons
                          name={item.isPending ? 'time-outline' : item.read ? 'checkmark-done' : 'checkmark'}
                          size={13}
                          color={item.read ? '#67e8f9' : 'rgba(255,255,255,0.7)'}
                          style={{ marginLeft: 3 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* STICKY BOTTOM INPUT BAR */}
        <View
          style={[
            styles.bottomStickyWrapper,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              // Responsive keyboard avoidance on Android and iOS:
              paddingBottom: Platform.OS === 'android'
                ? (keyboardHeight > 0 ? keyboardHeight : 8)
                : (keyboardHeight > 0 ? 6 : Math.max(insets.bottom, 10)),
            },
          ]}
        >
          <View style={styles.bottomInputBar}>
            <TextInput
              ref={inputRef}
              style={[
                styles.chatInput,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={`Message @${friendUsername}...`}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1500}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputText.trim()
                    ? colors.accent
                    : (isDark ? '#334155' : '#cbd5e1'),
                },
              ]}
              disabled={!inputText.trim() || sending}
              onPress={handleSendMessage}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={17} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  rankBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  headerActionBtn: {
    padding: 6,
  },
  messagesContainer: {
    flex: 1,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
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
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowFriend: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.76,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 18,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleFriend: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '500',
  },
  bottomStickyWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  lockedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  lockedDesc: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginBtn: {
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 24,
  },
});
