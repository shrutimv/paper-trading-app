// components/ui/Toast.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'loading' | 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ visible, message, type, onClose }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    if (visible) {
      // Slide down and Fade In at the top
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      ]).start();

      // Only auto-hide for success or error
      if (type !== 'loading') {
        const timer = setTimeout(() => {
          hide();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, type]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[
        styles.toast, 
        { opacity, transform: [{ translateY }] },
        type === 'success' ? styles.successBorder : type === 'error' ? styles.errorBorder : styles.loadingBorder
      ]}>
        {type === 'loading' ? (
          <ActivityIndicator size="small" color="#0f62fe" />
        ) : (
          <Ionicons 
            name={type === 'success' ? "checkmark-circle" : "alert-circle"} 
            size={24} 
            color={type === 'success' ? "#10b981" : "#ef4444"} 
          />
        )}
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  toast: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1.5,
  },
  successBorder: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  errorBorder: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  loadingBorder: { borderColor: '#0f62fe', backgroundColor: '#eff6ff' },
  text: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flexShrink: 1,
  },
});