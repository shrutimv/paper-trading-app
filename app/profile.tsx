import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// IMPORT BOTH GLOBAL CONTEXTS!
import { RANKS, useGamification } from '../context/GamificationContext';
import { useTrading } from '../context/TradingContext';

const formatCurrency = (val: number) => "₹" + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Pull Balance from Trading Engine
  const { balance } = useTrading();
  
  // Pull Gamification Data
  const { xp, currentRank, nextRank, progressPercent } = useGamification();
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const session = await AsyncStorage.getItem('userSession');
      if (session) setUser(JSON.parse(session));
    } catch (e) {
      console.error("Failed to load user", e);
    } finally {
      setLoading(false);
    }
  };

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
    router.replace('/auth');
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "This will clear your progress on this device. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: 'destructive',
          onPress: async () => {
            await clearProgress(); 
            await AsyncStorage.removeItem('userSession'); 
            router.dismissAll();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0f62fe" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#111" />
      </TouchableOpacity>

      {/* ── HEADER (AVATAR & WALLET BALANCE) ── */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={70} color="#cbd5e1" />
        </View>
        <Text style={styles.name}>{user?.isGuest ? "Guest User" : "Trader"}</Text>
        
        {/* NEW SLEEK WALLET DISPLAY */}
        <View style={styles.walletPill}>
          <Ionicons name="wallet-outline" size={16} color="#0f62fe" style={{ marginRight: 6 }} />
          <Text style={styles.walletText}>{formatCurrency(balance)}</Text>
        </View>
      </View>

      {/* ── SLEEK INTERACTIVE RANK CARD ── */}
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

      {/* ── MENU ITEMS ── */}
      <View style={styles.menu}>
        {user?.isGuest && (
          <TouchableOpacity style={styles.menuItem} onPress={handleUpgrade}>
            <View style={styles.menuIconInfo}>
              <Ionicons name="log-in-outline" size={22} color="#0f62fe" />
              <Text style={[styles.menuText, { color: '#0f62fe', fontWeight:'bold' }]}>
                Login/Signup to Save Progress
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <View style={styles.menuIconInfo}>
              <Ionicons name="settings-outline" size={22} color="#4b5563" />
              <Text style={styles.menuText}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out & Reset Progress</Text>
      </TouchableOpacity>

      {/* ========================================= */}
      {/* THE RANK JOURNEY MODAL (SLIDES UP) */}
      {/* ========================================= */}
      <Modal visible={isRankModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rank Journey</Text>
              <TouchableOpacity onPress={() => setIsRankModalOpen(false)}>
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.journeyLine} />
              
              {RANKS.map((rank, index) => {
                const isCurrent = rank.name === currentRank.name;
                const isPassed = xp >= rank.minXp;
                
                return (
                  <View key={rank.name} style={[styles.journeyItem, isCurrent && styles.journeyItemCurrent]}>
                    
                    {/* Timeline Node */}
                    <View style={[styles.node, { backgroundColor: isPassed ? rank.color : '#e2e8f0', borderColor: isCurrent ? '#fff' : 'transparent', borderWidth: isCurrent ? 3 : 0 }]} />
                    
                    <View style={styles.journeyTextContainer}>
                      <Text style={[styles.journeyRankName, { color: isPassed ? rank.color : '#94a3b8' }]}>
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

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20, paddingTop: 60 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  
  header: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  avatarContainer: { marginBottom: 10, backgroundColor: '#fff', borderRadius: 50, padding: 2, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  name: { fontSize: 24, fontWeight: '900', color: '#111827' },
  
  walletPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  walletText: { color: '#0f62fe', fontWeight: '800', fontSize: 14 },

  // SLEEK RANK CARD
  rankCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  rankCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  rankSubText: { color: '#6b7280', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  rankTitle: { fontSize: 28, fontWeight: '900', textTransform: 'uppercase' },
  
  rankInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  xpText: { fontSize: 16, fontWeight: '800', color: '#111827' },
  tapDetailsText: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  
  track: { width: '100%', height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },

  menu: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIconInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  menuText: { fontSize: 16, color: '#374151', fontWeight: '600' },
  
  logoutBtn: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 'auto', marginBottom: 10, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  
  journeyLine: { position: 'absolute', left: 15, top: 20, bottom: 20, width: 2, backgroundColor: '#f1f5f9', zIndex: 1 },
  journeyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingLeft: 8, zIndex: 2 },
  journeyItemCurrent: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, marginLeft: -7, borderWidth: 1, borderColor: '#f1f5f9' },
  
  node: { width: 16, height: 16, borderRadius: 8, marginRight: 20 },
  journeyTextContainer: { flex: 1 },
  journeyRankName: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  journeyXpText: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginTop: 2 },
  
  currentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  currentBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});