// app/play-puzzle.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGamification } from '../context/GamificationContext';

const PUZZLES = [
  {
    id: 1,
    title: "The Hammer Reversal",
    description: "After a steady downtrend, this candle formed. What happens next?",
    correctAnswer: 'UP',
    explanation: "Correct! This is a Hammer pattern. The long lower wick shows buyers rejected the lower prices, signaling a bullish reversal."
  }
];

export default function PlayPuzzleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addXp } = useGamification();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<'UP' | 'DOWN' | null>(null);
  const [showResult, setShowResult] = useState(false);

  const popAnim = useRef(new Animated.Value(0)).current;
  const currentPuzzle = PUZZLES[currentIndex];

  const handleGuess = (guess: 'UP' | 'DOWN') => {
    if (showResult) return; 
    setSelectedGuess(guess);
    setShowResult(true);

    if (guess === currentPuzzle.correctAnswer) {
      addXp(100); 
    }

    Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
  };

  const nextPuzzle = () => {
    router.back(); // Just go back for now when done
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHART PUZZLE</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.content}>
        <Text style={styles.puzzleTitle}>{currentPuzzle.title}</Text>
        <Text style={styles.puzzleDesc}>{currentPuzzle.description}</Text>

        <View style={styles.chartContainer}>
          <Ionicons name="bar-chart" size={80} color="#9ca3af" />
          <Text style={{ color: '#9ca3af', marginTop: 10, fontWeight: '700' }}>[Candlestick Snapshot Here]</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.guessBtn, styles.guessUpBtn, selectedGuess === 'UP' && styles.selectedUp, (showResult && selectedGuess !== 'UP') && styles.dimmed]} 
            onPress={() => handleGuess('UP')} disabled={showResult}
          >
            <Ionicons name="trending-up" size={32} color={selectedGuess === 'UP' ? '#fff' : '#16a34a'} />
            <Text style={[styles.guessBtnText, { color: selectedGuess === 'UP' ? '#fff' : '#16a34a' }]}>BULLISH</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guessBtn, styles.guessDownBtn, selectedGuess === 'DOWN' && styles.selectedDown, (showResult && selectedGuess !== 'DOWN') && styles.dimmed]} 
            onPress={() => handleGuess('DOWN')} disabled={showResult}
          >
            <Ionicons name="trending-down" size={32} color={selectedGuess === 'DOWN' ? '#fff' : '#dc2626'} />
            <Text style={[styles.guessBtnText, { color: selectedGuess === 'DOWN' ? '#fff' : '#dc2626' }]}>BEARISH</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showResult && (
        <Animated.View style={[styles.resultCard, { transform: [{ translateY: popAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
          <View style={styles.resultHeader}>
            <Ionicons name={selectedGuess === currentPuzzle.correctAnswer ? "checkmark-circle" : "close-circle"} size={32} color={selectedGuess === currentPuzzle.correctAnswer ? "#10b981" : "#ef4444"} />
            <Text style={[styles.resultTitle, { color: selectedGuess === currentPuzzle.correctAnswer ? "#10b981" : "#ef4444" }]}>
              {selectedGuess === currentPuzzle.correctAnswer ? "Correct! +100 XP" : "Not quite!"}
            </Text>
          </View>
          <Text style={styles.explanation}>{currentPuzzle.explanation}</Text>
          <TouchableOpacity style={styles.nextBtn} onPress={nextPuzzle}>
            <Text style={styles.nextBtnText}>FINISH</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4, backgroundColor: '#e5e7eb', borderRadius: 20 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#6b7280', letterSpacing: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  puzzleTitle: { fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 8 },
  puzzleDesc: { fontSize: 16, color: '#4b5563', lineHeight: 24, marginBottom: 24 },
  chartContainer: { width: '100%', height: 280, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  guessBtn: { flex: 1, paddingVertical: 24, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, backgroundColor: '#fff' },
  guessUpBtn: { borderColor: '#16a34a' },
  guessDownBtn: { borderColor: '#dc2626' },
  selectedUp: { backgroundColor: '#16a34a' },
  selectedDown: { backgroundColor: '#dc2626' },
  dimmed: { opacity: 0.3 },
  guessBtnText: { fontSize: 18, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  resultCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resultTitle: { fontSize: 22, fontWeight: '900' },
  explanation: { fontSize: 16, color: '#4b5563', lineHeight: 24, marginBottom: 24 },
  nextBtn: { backgroundColor: '#111827', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});