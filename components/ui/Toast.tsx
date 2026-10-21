// components/ui/Toast.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'loading' | 'success' | 'error';
  title?: string;
  onClose: () => void;
}

export default function Toast({ visible, message, type, title, onClose }: ToastProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-40)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      ]).start();

      if (type !== 'loading') {
        const timer = setTimeout(() => {
          hide();
        }, 3400);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, type]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -30, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.95, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  const config = {
    success: {
      accent: '#10b981',
      bg: isDark ? '#0f1f17' : '#ffffff',
      border: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.45)',
      iconBg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
      iconName: 'checkmark-circle' as const,
      defaultTitle: 'ORDER CONFIRMED',
    },
    error: {
      accent: '#ef4444',
      bg: isDark ? '#231114' : '#ffffff',
      border: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.45)',
      iconBg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2',
      iconName: 'alert-circle' as const,
      defaultTitle: 'ORDER ALERT',
    },
    loading: {
      accent: '#3b82f6',
      bg: isDark ? '#0e1726' : '#ffffff',
      border: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.45)',
      iconBg: isDark ? 'rgba(59, 130, 246, 0.18)' : '#eff6ff',
      iconName: 'sync-circle' as const,
      defaultTitle: 'PROCESSING DESK',
    },
  }[type];

  const topOffset = Math.max(insets.top + 8, Platform.OS === 'android' ? 24 : 44);

  return (
    <View style={[styles.overlay, { top: topOffset }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: config.bg,
            borderColor: config.border,
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={hide}
          style={styles.innerRow}
        >
          {/* Status Icon Badge */}
          <View style={[styles.iconBadge, { backgroundColor: config.iconBg }]}>
            {type === 'loading' ? (
              <ActivityIndicator size="small" color={config.accent} />
            ) : (
              <Ionicons name={config.iconName} size={20} color={config.accent} />
            )}
          </View>

          {/* Text Content */}
          <View style={styles.textWrap}>
            <View style={styles.headerLine}>
              <Text style={[styles.title, { color: config.accent }]}>
                {title || config.defaultTitle}
              </Text>
              <Text style={[styles.timeMicro, { color: colors.textSecondary }]}>Just now</Text>
            </View>
            <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
              {message}
            </Text>
          </View>

          {/* Subtle Close Pill */}
          <TouchableOpacity onPress={hide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.dismissBtn}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  container: {
    width: '92%',
    maxWidth: 440,
    borderRadius: 18,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 14,
    overflow: 'hidden',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timeMicro: {
    fontSize: 9,
    fontWeight: '600',
    marginRight: 6,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 6,
  },
});