// components/ui/Toast.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ visible, message, type, onClose }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Fade and Scale In
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();

      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        hide();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[
        styles.toast, 
        { opacity, transform: [{ scale }] },
        type === 'success' ? styles.successBorder : styles.errorBorder
      ]}>
        <Ionicons 
          name={type === 'success' ? "checkmark-circle" : "alert-circle"} 
          size={28} 
          color={type === 'success' ? "#10b981" : "#ef4444"} 
        />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    width: '80%',
    // Professional Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
  },
  successBorder: { borderColor: '#10b981' },
  errorBorder: { borderColor: '#ef4444' },
  text: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    flexShrink: 1,
  },
});