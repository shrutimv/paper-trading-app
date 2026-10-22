import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Holding } from '../context/TradingContext';

interface SellStockModalProps {
  visible: boolean;
  onClose: () => void;
  holding: Holding | null;
  currentPrice: number;
  onConfirmSell: (quantity: number, effectivePrice: number) => Promise<boolean>;
}

const formatCurrency = (val: number) =>
  `₹${(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function SellStockModal({
  visible,
  onClose,
  holding,
  currentPrice,
  onConfirmSell,
}: SellStockModalProps) {
  const { colors, isDark } = useTheme();
  const [quantity, setQuantity] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const maxQty = holding?.quantity || 1;
  const avgPrice = holding?.averagePrice || 0;
  const effPrice = currentPrice && currentPrice > 0 ? currentPrice : avgPrice;

  useEffect(() => {
    if (visible && holding) {
      setQuantity('1');
      setIsSubmitting(false);
    }
  }, [visible, holding]);

  const parsedQty = parseInt(quantity, 10);
  const validQty = isNaN(parsedQty) || parsedQty <= 0 ? 0 : Math.min(parsedQty, maxQty);

  // Calculations
  const totalCostPrice = validQty * avgPrice;
  const totalSaleValue = validQty * effPrice;
  const pnl = totalSaleValue - totalCostPrice;
  const pnlPercent = totalCostPrice > 0 ? (pnl / totalCostPrice) * 100 : 0;
  const isProfit = pnl > 0;
  const isLoss = pnl < 0;

  const handleQtyChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setQuantity('');
    } else {
      const clamped = Math.min(Math.max(1, num), maxQty);
      setQuantity(clamped.toString());
    }
  };

  const handleStep = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const curr = parseInt(quantity, 10) || 1;
    const next = Math.min(Math.max(1, curr + delta), maxQty);
    setQuantity(next.toString());
  };

  const handleSelectQuick = (qty: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(qty.toString());
  };

  const handleConfirm = async () => {
    if (validQty <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await onConfirmSell(validQty, effPrice);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  if (!holding) return null;

  const rawSymbol = holding.symbol.replace('.NS', '').replace('.BO', '');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.symbolText, { color: colors.text }]}>{rawSymbol}</Text>
                <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' }]}>
                  <Text style={[styles.badgeText, { color: '#ef4444' }]}>SELL ORDER</Text>
                </View>
              </View>
              <Text style={[styles.subText, { color: colors.textSecondary }]}>
                {holding.name || rawSymbol} • {holding.productType?.toUpperCase() || 'CNC'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Price & Ownership Strip */}
          <View style={[styles.priceStrip, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: colors.border }]}>
            <View>
              <Text style={[styles.stripLabel, { color: colors.textSecondary }]}>CURRENT MARKET PRICE</Text>
              <Text style={[styles.stripPrice, { color: colors.text }]}>{formatCurrency(effPrice)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.stripLabel, { color: colors.textSecondary }]}>YOUR AVG BUY PRICE</Text>
              <Text style={[styles.stripPrice, { color: colors.text }]}>{formatCurrency(avgPrice)}</Text>
            </View>
          </View>

          {/* Quantity Selector Section */}
          <View style={{ marginVertical: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quantity to Sell</Text>
              <Text style={[styles.maxHoldText, { color: colors.textSecondary }]}>
                You own: <Text style={{ fontWeight: '800', color: colors.text }}>{maxQty} shares</Text>
              </Text>
            </View>

            {/* Stepper + Input */}
            <View style={[styles.stepperContainer, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff' }]}>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: colors.border }]}
                onPress={() => handleStep(-1)}
                disabled={validQty <= 1}
              >
                <Ionicons name="remove" size={20} color={validQty <= 1 ? colors.textSecondary : colors.text} />
              </TouchableOpacity>

              <TextInput
                style={[styles.qtyInput, { color: colors.text }]}
                value={quantity}
                onChangeText={handleQtyChange}
                keyboardType="number-pad"
                selectTextOnFocus
              />

              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: colors.border }]}
                onPress={() => handleStep(1)}
                disabled={validQty >= maxQty}
              >
                <Ionicons name="add" size={20} color={validQty >= maxQty ? colors.textSecondary : colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Quantity Chips */}
            <View style={styles.quickChipsRow}>
              <TouchableOpacity
                style={[styles.chip, { borderColor: colors.border, backgroundColor: validQty === 1 ? 'rgba(239, 68, 68, 0.12)' : 'transparent' }]}
                onPress={() => handleSelectQuick(1)}
              >
                <Text style={[styles.chipText, { color: validQty === 1 ? '#ef4444' : colors.textSecondary }]}>
                  1 Share
                </Text>
              </TouchableOpacity>

              {maxQty > 2 && (
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      borderColor: colors.border,
                      backgroundColor: validQty === Math.floor(maxQty / 2) ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelectQuick(Math.floor(maxQty / 2))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: validQty === Math.floor(maxQty / 2) ? '#ef4444' : colors.textSecondary },
                    ]}
                  >
                    Half ({Math.floor(maxQty / 2)})
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    borderColor: colors.border,
                    backgroundColor: validQty === maxQty ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                  },
                ]}
                onPress={() => handleSelectQuick(maxQty)}
              >
                <Text style={[styles.chipText, { color: validQty === maxQty ? '#ef4444' : colors.textSecondary }]}>
                  Sell All ({maxQty})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Financial Breakdown & P&L Card */}
          <View style={[styles.breakdownCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: colors.border }]}>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Total Invested ({validQty} sh @ {formatCurrency(avgPrice)}):
              </Text>
              <Text style={[styles.breakdownVal, { color: colors.text }]}>{formatCurrency(totalCostPrice)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Total Sale Value ({validQty} sh @ {formatCurrency(effPrice)}):
              </Text>
              <Text style={[styles.breakdownVal, { color: colors.text, fontWeight: '800' }]}>
                {formatCurrency(totalSaleValue)}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Estimated P&L Banner */}
            <View
              style={[
                styles.pnlBanner,
                {
                  backgroundColor: isProfit
                    ? isDark ? 'rgba(34,197,94,0.12)' : '#ecfdf5'
                    : isLoss
                    ? isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2'
                    : isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                  borderColor: isProfit
                    ? 'rgba(34,197,94,0.3)'
                    : isLoss
                    ? 'rgba(239,68,68,0.3)'
                    : colors.border,
                },
              ]}
            >
              <View>
                <Text style={[styles.pnlBadgeLabel, { color: isProfit ? '#16a34a' : isLoss ? '#dc2626' : colors.textSecondary }]}>
                  {isProfit ? 'ESTIMATED PROFIT 🎉' : isLoss ? 'ESTIMATED LOSS ⚠️' : 'BREAK-EVEN'}
                </Text>
                <Text
                  style={[
                    styles.pnlAmount,
                    { color: isProfit ? '#16a34a' : isLoss ? '#dc2626' : colors.text },
                  ]}
                >
                  {isProfit ? '+' : ''}
                  {formatCurrency(pnl)} ({isProfit ? '+' : ''}
                  {pnlPercent.toFixed(2)}%)
                </Text>
              </View>
              <Ionicons
                name={isProfit ? 'trending-up' : isLoss ? 'trending-down' : 'remove'}
                size={24}
                color={isProfit ? '#16a34a' : isLoss ? '#dc2626' : colors.textSecondary}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { opacity: validQty <= 0 || isSubmitting ? 0.6 : 1 }]}
              onPress={handleConfirm}
              disabled={validQty <= 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="arrow-down-circle" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>
                    Sell {validQty} {validQty === 1 ? 'Share' : 'Shares'}
                  </Text>
                </View>
              )}
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
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  symbolText: {
    fontSize: 20,
    fontWeight: '900',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  priceStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  stripLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stripPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  maxHoldText: {
    fontSize: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: 10,
  },
  stepBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  breakdownCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  pnlBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  pnlBadgeLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pnlAmount: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#ef4444',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
