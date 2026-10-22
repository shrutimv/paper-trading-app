import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useTrading } from '../context/TradingContext';
import { useGamification } from '../context/GamificationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyRecapModalProps {
  visible: boolean;
  onClose: () => void;
  onViewOrders?: () => void;
}

const formatCurrency = (val: number) =>
  `₹${(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function DailyRecapModal({ visible, onClose, onViewOrders }: DailyRecapModalProps) {
  const { colors, isDark } = useTheme();
  const { transactions, holdings, balance, totalInvestment } = useTrading();
  const { xp } = useGamification();
  const [streak, setStreak] = useState<number>(1);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem('paper_streak').then((val) => {
        if (val) setStreak(parseInt(val, 10) || 1);
      }).catch(() => {});
    }
  }, [visible]);

  // Filter transactions performed today
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const todayTxs = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const txTime = new Date(t.createdAt).getTime();
    return txTime >= todayStart && txTime < todayEnd;
  });

  const buysToday = todayTxs.filter((t) => t.type === 'BUY');
  const sellsToday = todayTxs.filter((t) => t.type === 'SELL');

  // Realized P&L from trades closed today
  const realizedPnlToday = sellsToday.reduce((sum, t) => sum + (t.pnl || 0), 0);

  // Best trade of today
  const bestTrade = sellsToday.reduce<any>((best, curr) => {
    if (!best) return curr;
    return (curr.pnl || 0) > (best.pnl || 0) ? curr : best;
  }, null);

  const isProfitable = realizedPnlToday > 0;
  const isLoss = realizedPnlToday < 0;

  const totalPortfolioValue = balance + totalInvestment;

  // Beginner-friendly coaching tip based on today's trading action
  const getBeginnerCoaching = () => {
    if (sellsToday.length > 0 && isProfitable) {
      return {
        tag: 'WINNER MINDSET',
        headline: 'Great Execution! Protect Your Gains',
        tip: 'Consistent traders never give back profits to the market. Lock in your gains, avoid revenge trading, and stay disciplined.',
        icon: 'trophy',
        color: '#16a34a',
      };
    }
    if (sellsToday.length > 0 && isLoss) {
      return {
        tag: 'RISK MANAGEMENT',
        headline: 'Losses Are Learning In Disguise',
        tip: 'Taking a small loss is normal. The golden rule: Never risk more than 2% of your virtual account on any single trade.',
        icon: 'shield-checkmark',
        color: '#dc2626',
      };
    }
    if (buysToday.length > 0) {
      return {
        tag: 'POSITION IN FLIGHT',
        headline: 'Active Positions Accumulating',
        tip: `You entered ${buysToday.length} position${buysToday.length > 1 ? 's' : ''} today. Remember to monitor support levels and stick to your price targets!`,
        icon: 'time',
        color: '#2563eb',
      };
    }
    return {
      tag: 'PATIENCE IS PROFIT',
      headline: 'Observant Market Session',
      tip: 'Top institutional traders know that sitting on cash when setups aren\'t clear is just as valuable as executing a winning trade.',
      icon: 'sparkles',
      color: '#8b5cf6',
    };
  };

  const coaching = getBeginnerCoaching();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleOrders = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (onViewOrders) onViewOrders();
  };

  const formattedDate = today.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconPill, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe' }]}>
                <Ionicons name="bar-chart" size={18} color="#2563eb" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Today's Trading Recap</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{formattedDate}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Primary Net P&L Banner */}
            <View
              style={[
                styles.pnlBanner,
                {
                  backgroundColor: isProfitable
                    ? isDark ? 'rgba(34,197,94,0.12)' : '#ecfdf5'
                    : isLoss
                    ? isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2'
                    : isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  borderColor: isProfitable
                    ? 'rgba(34,197,94,0.3)'
                    : isLoss
                    ? 'rgba(239,68,68,0.3)'
                    : colors.border,
                },
              ]}
            >
              <Text style={[styles.pnlLabel, { color: colors.textSecondary }]}>
                TODAY'S REALIZED PROFIT & LOSS
              </Text>
              <Text
                style={[
                  styles.pnlValue,
                  {
                    color: isProfitable ? '#16a34a' : isLoss ? '#dc2626' : colors.text,
                  },
                ]}
              >
                {isProfitable ? '+' : ''}
                {formatCurrency(realizedPnlToday)}
              </Text>
              <Text style={[styles.pnlSubtext, { color: colors.textSecondary }]}>
                {sellsToday.length === 0
                  ? 'No closed positions today (0 sells recorded)'
                  : `${sellsToday.length} closed position${sellsToday.length > 1 ? 's' : ''} squared off`}
              </Text>
            </View>

            {/* Quick 3-Tile Performance Matrix */}
            <View style={styles.statsRow}>
              {/* Trades Executed */}
              <View style={[styles.statTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: colors.border }]}>
                <Text style={[styles.statTileLabel, { color: colors.textSecondary }]}>Orders</Text>
                <Text style={[styles.statTileNumber, { color: colors.text }]}>{todayTxs.length}</Text>
                <Text style={[styles.statTileSub, { color: colors.textSecondary }]}>
                  {buysToday.length}B • {sellsToday.length}S
                </Text>
              </View>

              {/* Best Performer */}
              <View style={[styles.statTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: colors.border }]}>
                <Text style={[styles.statTileLabel, { color: colors.textSecondary }]}>Best Trade</Text>
                <Text
                  style={[
                    styles.statTileNumber,
                    { color: bestTrade && (bestTrade.pnl || 0) > 0 ? '#16a34a' : colors.text, fontSize: 13 },
                  ]}
                  numberOfLines={1}
                >
                  {bestTrade ? bestTrade.symbol.replace('.NS', '') : 'None'}
                </Text>
                <Text style={[styles.statTileSub, { color: colors.textSecondary }]}>
                  {bestTrade ? `+${formatCurrency(bestTrade.pnl || 0)}` : 'No sells'}
                </Text>
              </View>

              {/* Demat Holdings */}
              <View style={[styles.statTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: colors.border }]}>
                <Text style={[styles.statTileLabel, { color: colors.textSecondary }]}>Open Stocks</Text>
                <Text style={[styles.statTileNumber, { color: colors.text }]}>{holdings.length}</Text>
                <Text style={[styles.statTileSub, { color: colors.textSecondary }]}>
                  {formatCurrency(totalPortfolioValue)}
                </Text>
              </View>
            </View>

            {/* Beginner Trading Coach Card */}
            <View
              style={[
                styles.coachingCard,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name={coaching.icon as any} size={16} color={coaching.color} />
                <Text style={[styles.coachingTag, { color: coaching.color }]}>{coaching.tag}</Text>
              </View>
              <Text style={[styles.coachingHeadline, { color: colors.text }]}>{coaching.headline}</Text>
              <Text style={[styles.coachingTip, { color: colors.textSecondary }]}>{coaching.tip}</Text>
            </View>

            {/* Gamification Streak & XP Meter */}
            <View
              style={[
                styles.rewardRow,
                {
                  backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#fef3c7',
                  borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>🔥</Text>
                <View>
                  <Text style={[styles.rewardTitle, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                    {streak}-Day Trading Streak!
                  </Text>
                  <Text style={[styles.rewardSub, { color: isDark ? '#fcd34d' : '#92400e' }]}>
                    Keep trading daily to increase your XP multiplier
                  </Text>
                </View>
              </View>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+{todayTxs.length * 20 + 25} XP</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            {onViewOrders && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={handleOrders}
                activeOpacity={0.8}
              >
                <Ionicons name="receipt-outline" size={16} color={colors.text} style={{ marginRight: 6 }} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>View Orders</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleClose} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  pnlBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 14,
  },
  pnlLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pnlValue: {
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  pnlSubtext: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statTile: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statTileNumber: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 1,
  },
  statTileSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  coachingCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  coachingTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  coachingHeadline: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  coachingTip: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rewardSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  xpBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
