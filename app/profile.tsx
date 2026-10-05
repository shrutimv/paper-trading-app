import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// IMPORT BOTH GLOBAL CONTEXTS!
import { RANKS, useGamification } from '../context/GamificationContext';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (val: number) => "₹" + (val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  
  const { user: authUser, logout: authLogout } = useAuth();
  const [localUser, setLocalUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { balance, transactions } = useTrading();
  const { xp, currentRank, nextRank, progressPercent, proMode, setProMode } = useGamification();
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const session = await AsyncStorage.getItem('userSession');
      if (session) setLocalUser(JSON.parse(session));
    } catch (e) {
      console.error("Failed to load user", e);
    } finally {
      setLoading(false);
    }
  };

  const user = authUser || localUser;

  const clearProgress = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith('module_completed_'));
      if (progressKeys.length > 0) {
        await AsyncStorage.multiRemove(progressKeys);
      }
      await AsyncStorage.removeItem('user_xp'); 
    } catch (e) {
      console.error("Failed to clear progress", e);
    }
  };

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  const handleResetProgressOnly = () => {
    Alert.alert(
      "Reset Learning Progress",
      "Are you sure you want to reset all completed modules and XP back to 0?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearProgress();
            Alert.alert("Success", "Your learning progress and XP have been reset.");
          },
        },
      ]
    );
  };

  const handleUpgrade = async () => {
    await clearProgress(); 
    await AsyncStorage.removeItem('userSession'); 
    if (authLogout) await authLogout();
    router.replace('/auth');
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "This will clear your session on this device. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: 'destructive',
          onPress: async () => {
            await clearProgress(); 
            await AsyncStorage.removeItem('userSession'); 
            if (authLogout) await authLogout();
            router.dismissAll();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const recentTransactions = transactions.slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* ── TOP NAV BAR ── */}
      <View style={styles.topNavBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.navTitle}>Profile</Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={70} color="#cbd5e1" />
          </View>
          <Text style={styles.name}>{user?.username || (user?.isGuest ? "Guest User" : "Trader")}</Text>
          
          <View style={styles.walletPill}>
            <Ionicons name="wallet-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.walletText}>{formatCurrency(balance)}</Text>
          </View>
        </View>

      <TouchableOpacity 
        style={[styles.rankCard, { borderColor: currentRank.color + '40' }]} 
        onPress={() => setIsRankModalOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.rankCardHeader}>
          <View>
            <Text style={styles.rankSubText}>Current Rank</Text>
            <Text style={[styles.rankTitle, { color: currentRank.color }]}>{currentRank.name}</Text>
          </View>
          <Ionicons name="trophy" size={40} color={currentRank.color} />
        </View>

        <View style={styles.rankInfoRow}>
          <Text style={styles.xpText}>{xp.toLocaleString()} XP</Text>
          <Text style={styles.tapDetailsText}>Tap for details <Ionicons name="chevron-forward" size={12} /></Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(Math.max(progressPercent, 0), 100)}%`, backgroundColor: currentRank.color }]} />
        </View>
      </TouchableOpacity>

      {/* ── RECENT TRADE ACTIVITY & LOGS ── */}
      <View style={styles.recentActivitySection}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Recent Trade Activity</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/trading/orders')}>
            <Text style={styles.viewAllText}>View All ({transactions.length})</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyActivityCard}>
            <Text style={styles.emptyActivityText}>No recent orders recorded yet.</Text>
          </View>
        ) : (
          recentTransactions.map((tx, idx) => {
            const isBuy = tx.type === 'BUY';
            const badgeColor = isBuy ? '#10B981' : '#EF4444';
            return (
              <View key={tx.id || tx._id || idx.toString()} style={styles.activityCard}>
                <View style={styles.activityLeft}>
                  <View style={[styles.txBadge, { backgroundColor: isBuy ? (isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7') : (isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2') }]}>
                    <Text style={[styles.txBadgeText, { color: badgeColor }]}>{tx.type}</Text>
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.activitySymbol}>{tx.symbol}</Text>
                    <Text style={styles.activityMeta}>{tx.quantity} Qty • {formatCurrency(tx.price)}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.activityTotal}>{formatCurrency(tx.totalAmount)}</Text>
                  <Text style={styles.activityDate}>
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.menu}>
        {user?.isGuest && (
          <TouchableOpacity style={styles.menuItem} onPress={handleUpgrade}>
            <View style={styles.menuIconInfo}>
              <Ionicons name="log-in-outline" size={22} color={colors.accent} />
              <Text style={[styles.menuText, { color: colors.accent, fontWeight:'bold' }]}>
                Login/Signup to Save Progress
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <View style={styles.menuItem}>
          <View style={styles.menuIconInfo}>
            <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={22} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch 
            value={isDark} 
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
        <View style={styles.menuItem}>
          <View style={styles.menuIconInfo}>
            <Ionicons name="flash-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Pro Mode (Skip Locks)</Text>
          </View>
          <Switch 
            value={proMode} 
            onValueChange={setProMode}
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={proMode ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={handleResetProgressOnly}>
            <View style={styles.menuIconInfo}>
              <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuText, { color: colors.text }]}>Reset Learning Progress</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => setIsFaqModalOpen(true)}>
            <View style={styles.menuIconInfo}>
              <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuText, { color: colors.text }]}>Trading Guide & FAQs</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out & Reset Session</Text>
      </TouchableOpacity>

      {/* THE RANK JOURNEY MODAL (ROAD TO DIAMOND) */}
      <Modal visible={isRankModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%', paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }]}>
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Road to Diamond</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '700', marginTop: 2 }}>
                  Trader Level Map • {xp.toLocaleString()} Total XP
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsRankModalOpen(false)}>
                <Ionicons name="close-circle" size={32} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* TRADER ACHIEVEMENTS & QUEST BADGES */}
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                Trader Quest Badges
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.questBadgeCard, { backgroundColor: colors.card, borderColor: '#3b82f6' }]}>
                    <Ionicons name="flash" size={20} color="#3b82f6" />
                    <Text style={[styles.questBadgeTitle, { color: colors.text }]}>Market Novice</Text>
                    <Text style={{ fontSize: 10, color: '#3b82f6', fontWeight: '800' }}>Unlocked</Text>
                  </View>

                  <View style={[styles.questBadgeCard, { backgroundColor: colors.card, borderColor: xp >= 1500 ? '#10b981' : colors.border }]}>
                    <Ionicons name="stats-chart" size={20} color={xp >= 1500 ? '#10b981' : colors.textSecondary} />
                    <Text style={[styles.questBadgeTitle, { color: colors.text }]}>Chart Sniper</Text>
                    <Text style={{ fontSize: 10, color: xp >= 1500 ? '#10b981' : colors.textSecondary, fontWeight: '800' }}>
                      {xp >= 1500 ? 'Unlocked' : 'Req: 1,500 XP'}
                    </Text>
                  </View>

                  <View style={[styles.questBadgeCard, { backgroundColor: colors.card, borderColor: xp >= 3000 ? '#f59e0b' : colors.border }]}>
                    <Ionicons name="trophy" size={20} color={xp >= 3000 ? '#f59e0b' : colors.textSecondary} />
                    <Text style={[styles.questBadgeTitle, { color: colors.text }]}>Gold Trader</Text>
                    <Text style={{ fontSize: 10, color: xp >= 3000 ? '#f59e0b' : colors.textSecondary, fontWeight: '800' }}>
                      {xp >= 3000 ? 'Unlocked' : 'Req: 3,000 XP'}
                    </Text>
                  </View>

                  <View style={[styles.questBadgeCard, { backgroundColor: colors.card, borderColor: xp >= 10000 ? '#06b6d4' : colors.border }]}>
                    <Ionicons name="diamond" size={20} color={xp >= 10000 ? '#06b6d4' : colors.textSecondary} />
                    <Text style={[styles.questBadgeTitle, { color: colors.text }]}>Diamond Legend</Text>
                    <Text style={{ fontSize: 10, color: xp >= 10000 ? '#06b6d4' : colors.textSecondary, fontWeight: '800' }}>
                      {xp >= 10000 ? 'Unlocked' : 'Req: 10,000 XP'}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                Rank Level Progression Path
              </Text>

              <View style={{ position: 'relative', paddingLeft: 6 }}>
                <View style={styles.journeyLine} />
                
                {RANKS.map((rank, index) => {
                  const isCurrent = rank.name === currentRank.name;
                  const isPassed = xp >= rank.minXp;

                  const RANK_ICONS: Record<string, any> = {
                    'Novice': 'shield-outline',
                    'Bronze': 'ribbon-outline',
                    'Silver': 'star-outline',
                    'Gold': 'medal-outline',
                    'Platinum': 'sparkles-outline',
                    'Diamond': 'diamond-outline',
                  };

                  return (
                    <View key={rank.name} style={[styles.journeyItem, isCurrent && styles.journeyItemCurrent]}>
                      
                      {/* Game Level Node Avatar */}
                      <View style={[
                        styles.gameLevelNode, 
                        { 
                          backgroundColor: isPassed ? rank.color : (isDark ? '#1e293b' : '#e2e8f0'), 
                          borderColor: isCurrent ? '#fff' : 'transparent', 
                          borderWidth: isCurrent ? 3 : 0 
                        }
                      ]}>
                        <Ionicons 
                          name={isPassed ? (RANK_ICONS[rank.name] || 'trophy') : 'lock-closed'} 
                          size={18} 
                          color={isPassed ? '#fff' : colors.textSecondary} 
                        />
                      </View>
                      
                      <View style={styles.journeyTextContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.journeyRankName, { color: isPassed ? rank.color : colors.textSecondary }]}>
                            {rank.name}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                            LVL {index + 1}
                          </Text>
                        </View>
                        <Text style={styles.journeyXpText}>
                          {isCurrent ? `${xp.toLocaleString()} / ` : ''}{rank.minXp.toLocaleString()} XP
                        </Text>
                      </View>

                      {isCurrent ? (
                        <View style={[styles.currentBadge, { backgroundColor: rank.color + '25' }]}>
                          <Text style={[styles.currentBadgeText, { color: rank.color }]}>ACTIVE RANK</Text>
                        </View>
                      ) : isPassed ? (
                        <Ionicons name="checkmark-circle" size={22} color={rank.color} />
                      ) : (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700' }}>
                          +{rank.minXp - xp} XP needed
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

          </View>
        </View>
      </Modal>

      {/* THE TRADING GUIDE & FAQS MODAL */}
      <Modal visible={isFaqModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 30 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paper Trading Guide</Text>
              <TouchableOpacity onPress={() => setIsFaqModalOpen(false)}>
                <Ionicons name="close-circle" size={32} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14, paddingTop: 6 }}>
                <View style={{ backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 }}>CNC vs MIS (Product Types)</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                    • <Text style={{ fontWeight: '700', color: colors.text }}>CNC (Cash & Carry)</Text>: Delivery trading for multi-day holding. 100% cash margin required.{"\n"}
                    • <Text style={{ fontWeight: '700', color: colors.text }}>MIS (Intraday)</Text>: Same-day trading with <Text style={{ fontWeight: '700', color: '#16a34a' }}>5x leverage (20% margin)</Text>. Must be squared off before 3:30 PM.
                  </Text>
                </View>

                <View style={{ backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Stop-Loss (SL) Protection</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                    Automatically triggers a market sell order if the price falls below your designated trigger price, preserving capital.
                  </Text>
                </View>

                <View style={{ backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Market Hours (NSE / BSE)</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                    Indian markets operate Monday to Friday from <Text style={{ fontWeight: '700', color: colors.text }}>09:15 AM to 03:30 PM IST</Text>. Outside market hours, last closing session data is displayed.
                  </Text>
                </View>

                <View style={{ backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Rank Advancement & XP</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                    Earn XP by completing daily learning roadmap lessons and price action puzzles to climb from Bronze to Diamond rank!
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const getStyles = (colors: any) => StyleSheet.create({
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  container: { backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 10 },
  
  header: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  avatarContainer: { marginBottom: 10, backgroundColor: colors.card, borderRadius: 50, padding: 2, elevation: 2, shadowColor: colors.shadowColor, shadowOpacity: 0.1, shadowRadius: 10 },
  name: { fontSize: 24, fontWeight: '900', color: colors.text },
  
  walletPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.isDark ? "rgba(59, 130, 246, 0.12)" : '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  walletText: { color: colors.accent, fontWeight: '800', fontSize: 14 },

  rankCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: colors.shadowColor, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  rankCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  rankSubText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  rankTitle: { fontSize: 28, fontWeight: '900', textTransform: 'uppercase' },
  
  rankInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  xpText: { fontSize: 16, fontWeight: '800', color: colors.text },
  tapDetailsText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  
  track: { width: '100%', height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },

  // --- RECENT ACTIVITY SECTION STYLES ---
  recentActivitySection: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  viewAllText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  emptyActivityCard: { backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  emptyActivityText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  activityCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  activityLeft: { flexDirection: 'row', alignItems: 'center' },
  txBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  txBadgeText: { fontSize: 10, fontWeight: '800' },
  activitySymbol: { fontSize: 14, fontWeight: '800', color: colors.text },
  activityMeta: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', marginTop: 2 },
  activityTotal: { fontSize: 14, fontWeight: '800', color: colors.text },
  activityDate: { fontSize: 10, color: colors.textSecondary, fontWeight: '500', marginTop: 2 },

  menu: { backgroundColor: colors.card, borderRadius: 16, padding: 10, marginBottom: 20, elevation: 1, shadowColor: colors.shadowColor, shadowOpacity: 0.03, shadowRadius: 5, borderWidth: 1, borderColor: colors.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIconInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  menuText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  
  logoutBtn: { backgroundColor: colors.isDark ? "rgba(239, 68, 68, 0.12)" : '#fef2f2', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 'auto', borderWidth: 1, borderColor: colors.isDark ? "#b91c1c" : '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  
  journeyLine: { position: 'absolute', left: 24, top: 20, bottom: 20, width: 3, backgroundColor: colors.border, zIndex: 1 },
  journeyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingLeft: 8, zIndex: 2 },
  journeyItemCurrent: { backgroundColor: colors.background, padding: 14, borderRadius: 18, marginLeft: -4, borderWidth: 1.5, borderColor: colors.accent },
  
  gameLevelNode: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14, elevation: 3 },
  journeyTextContainer: { flex: 1 },
  journeyRankName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  journeyXpText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  
  currentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  currentBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  questBadgeCard: { width: 110, padding: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  questBadgeTitle: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
});