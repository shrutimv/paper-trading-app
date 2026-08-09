import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- 1. IMPORT HOOK
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
  
  const { balance } = useTrading();
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

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 60 }]}
      showsVerticalScrollIndicator={false}
    >
      
      {/* <-- DYNAMIC BACK BUTTON PLACEMENT --> */}
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 15 }]} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={colors.text} />
      </TouchableOpacity>

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
        <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <View style={styles.menuIconInfo}>
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out & Reset Progress</Text>
      </TouchableOpacity>

      {/* THE RANK JOURNEY MODAL */}
      <Modal visible={isRankModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }]}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rank Journey</Text>
              <TouchableOpacity onPress={() => setIsRankModalOpen(false)}>
                <Ionicons name="close-circle" size={32} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.journeyLine} />
              
              {RANKS.map((rank) => {
                const isCurrent = rank.name === currentRank.name;
                const isPassed = xp >= rank.minXp;
                
                return (
                  <View key={rank.name} style={[styles.journeyItem, isCurrent && styles.journeyItemCurrent]}>
                    
                    <View style={[styles.node, { backgroundColor: isPassed ? rank.color : colors.border, borderColor: isCurrent ? colors.card : 'transparent', borderWidth: isCurrent ? 3 : 0 }]} />
                    
                    <View style={styles.journeyTextContainer}>
                      <Text style={[styles.journeyRankName, { color: isPassed ? rank.color : colors.textSecondary }]}>
                        {rank.name}
                      </Text>
                      <Text style={styles.journeyXpText}>
                        {isCurrent ? `${xp.toLocaleString()} / ` : ''}{rank.minXp.toLocaleString()} XP
                      </Text>
                    </View>

                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: rank.color + '20' }]}>
                        <Text style={[styles.currentBadgeText, { color: rank.color }]}>YOU ARE HERE</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  
  backBtn: { position: 'absolute', left: 20, zIndex: 10, padding: 4 },
  
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
  
  journeyLine: { position: 'absolute', left: 15, top: 20, bottom: 20, width: 2, backgroundColor: colors.border, zIndex: 1 },
  journeyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingLeft: 8, zIndex: 2 },
  journeyItemCurrent: { backgroundColor: colors.background, padding: 15, borderRadius: 16, marginLeft: -7, borderWidth: 1, borderColor: colors.border },
  
  node: { width: 16, height: 16, borderRadius: 8, marginRight: 20 },
  journeyTextContainer: { flex: 1 },
  journeyRankName: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  journeyXpText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  
  currentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  currentBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});