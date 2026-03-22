import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export default function PageTransition({ children }: { children: React.ReactNode }) {
  // Start off-screen
  const slideAnim = useRef(new Animated.Value(width)).current; 
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // useFocusEffect fires EVERY time you open this tab
  useFocusEffect(
    useCallback(() => {
      // 1. INSTANTLY reset the screen to the right side (invisible to the user)
      slideAnim.setValue(width);
      fadeAnim.setValue(0);

      // 2. Fire the slide-in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, 
          duration: 300, // Quick and snappy
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        // Cleanup when leaving tab (optional)
      };
    }, [slideAnim, fadeAnim])
  );

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim, 
          transform: [{ translateX: slideAnim }] 
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' }
});