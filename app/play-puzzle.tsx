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
    description: "After a 4-day steep downtrend, a Hammer candlestick forms right at major support. What is the expected price direction?",
    correctAnswer: 'UP',
    pattern: "HAMMER REVERSAL",
    explanation: "Correct! The long lower wick shows heavy rejection of low prices by buyers at key support, signaling a strong bullish reversal."
  },
  {
    id: 2,
    title: "Shooting Star at Resistance",
    description: "The stock rallied +8% into a key 52-week high resistance, forming a candle with a long upper tail and tiny body. What next?",
    correctAnswer: 'DOWN',
    pattern: "SHOOTING STAR",
    explanation: "Correct! The long upper wick shows sellers aggressively rejected high prices at resistance, signaling a bearish pullback."
  },
  {
    id: 3,
    title: "Bullish Engulfing Pattern",
    description: "A large green candle completely covers the previous red candle's body after consolidation. What should a trader do?",
    correctAnswer: 'UP',
    pattern: "BULLISH ENGULFING",
    explanation: "Correct! A Bullish Engulfing pattern confirms buyers have seized complete control from sellers, triggering an upside breakout."
  },
  {
    id: 4,
    title: "Head & Shoulders Breakdown",
    description: "Price breaks below the key neckline of a classic Head & Shoulders pattern on 3x average volume. Predict the move:",
    correctAnswer: 'DOWN',
    pattern: "BEARISH BREAKDOWN",
    explanation: "Correct! Head & Shoulders neckline breakdown with high volume is one of the most reliable bearish trend reversal signals."
  },
  {
    id: 5,
    title: "Golden Crossover (50/200 EMA)",
    description: "The 50-day moving average crosses above the 200-day moving average on daily charts. What trend does this confirm?",
    correctAnswer: 'UP',
    pattern: "GOLDEN CROSSOVER",
    explanation: "Correct! Golden Crossover is the ultimate institutional confirmation of a long-term bullish trend start!"
  }
];

export default function PlayPuzzleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addXp } = useGamification();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<'UP' | 'DOWN' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);

  const popAnim = useRef(new Animated.Value(0)).current;
  const currentPuzzle = PUZZLES[currentIndex];

  const handleGuess = (guess: 'UP' | 'DOWN') => {
    if (showResult) return; 
    setSelectedGuess(guess);
    setShowResult(true);

    if (guess === currentPuzzle.correctAnswer) {
      addXp(50); 
      setScore(prev => prev + 1);
    } else {
      setHearts(prev => Math.max(0, prev - 1));
    }

    Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
  };

  const nextPuzzle = () => {
    setShowResult(false);
    setSelectedGuess(null);
    popAnim.setValue(0);
    
    if (currentIndex < PUZZLES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#64748B" />
        </TouchableOpacity>
        <View style={styles.progressBarBg}>
           <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / PUZZLES.length) * 100}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[1, 2, 3].map(h => (
            <Ionicons key={h} name="heart" size={20} color={h <= hearts ? "#EF4444" : "#CBD5E1"} />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 1 }}>
            STAGE {currentIndex + 1} OF {PUZZLES.length}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>
            SCORE: {score} / {PUZZLES.length}
          </Text>
        </View>

        <Text style={styles.puzzleTitle}>{currentPuzzle.title}</Text>
        <Text style={styles.puzzleDesc}>{currentPuzzle.description}</Text>

        <View style={styles.chartContainer}>
          <View style={styles.patternBadge}>
            <Text style={styles.patternBadgeText}>{currentPuzzle.pattern}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginVertical: 14 }}>
            <Ionicons name="stats-chart" size={90} color={currentPuzzle.correctAnswer === 'UP' ? '#10B981' : '#EF4444'} />
          </View>

          <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 13 }}>
            Identify technical pattern direction
          </Text>
        </View>

        {/* 3D ACTION BUTTONS */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[
              styles.guessBtn, 
              styles.guessUpBtn, 
              selectedGuess === 'UP' && styles.selectedUp, 
              (showResult && selectedGuess !== 'UP') && styles.dimmed
            ]} 
            onPress={() => handleGuess('UP')} disabled={showResult}
            activeOpacity={0.7}
          >
            <Ionicons name="trending-up" size={32} color={selectedGuess === 'UP' ? '#fff' : '#10B981'} />
            <Text style={[styles.guessBtnText, { color: selectedGuess === 'UP' ? '#fff' : '#10B981' }]}>BULLISH (UP)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.guessBtn, 
              styles.guessDownBtn, 
              selectedGuess === 'DOWN' && styles.selectedDown, 
              (showResult && selectedGuess !== 'DOWN') && styles.dimmed
            ]} 
            onPress={() => handleGuess('DOWN')} disabled={showResult}
            activeOpacity={0.7}
          >
            <Ionicons name="trending-down" size={32} color={selectedGuess === 'DOWN' ? '#fff' : '#EF4444'} />
            <Text style={[styles.guessBtnText, { color: selectedGuess === 'DOWN' ? '#fff' : '#EF4444' }]}>BEARISH</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RESULT SLIDE UP SHEET */}
      {showResult && (
        <Animated.View style={[styles.resultCard, { 
            backgroundColor: selectedGuess === currentPuzzle.correctAnswer ? '#ECFDF5' : '#FEF2F2',
            transform: [{ translateY: popAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] 
          }]}>
          
          <View style={styles.resultHeader}>
            <Ionicons name={selectedGuess === currentPuzzle.correctAnswer ? "checkmark-circle" : "close-circle"} size={28} color={selectedGuess === currentPuzzle.correctAnswer ? "#059669" : "#DC2626"} />
            <Text style={[styles.resultTitle, { color: selectedGuess === currentPuzzle.correctAnswer ? "#059669" : "#DC2626" }]}>
              {selectedGuess === currentPuzzle.correctAnswer ? "Correct! +100 XP" : "Not quite!"}
            </Text>
          </View>
          
          <Text style={[styles.explanation, { color: selectedGuess === currentPuzzle.correctAnswer ? "#047857" : "#991B1B" }]}>
            {currentPuzzle.explanation}
          </Text>
          
          <TouchableOpacity 
            style={[styles.nextBtn, { backgroundColor: selectedGuess === currentPuzzle.correctAnswer ? "#10B981" : "#EF4444" }]} 
            onPress={nextPuzzle}
          >
            <Text style={styles.nextBtnText}>CONTINUE</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 8 },
  progressBarBg: { flex: 1, height: 12, backgroundColor: '#E2E8F0', borderRadius: 10, marginHorizontal: 20 },
  progressBarFill: { width: '50%', height: '100%', backgroundColor: '#10B981', borderRadius: 10 },
  
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  puzzleTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  puzzleDesc: { fontSize: 16, color: '#64748B', lineHeight: 24, marginBottom: 24, fontWeight: '500' },
  
  chartContainer: { 
    width: '100%', 
    height: 260, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    borderWidth: 2, 
    borderColor: '#E2E8F0', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
  },
  patternBadge: {
    position: 'absolute',
    top: 14,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  patternBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563eb',
    letterSpacing: 0.8,
  },
  
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  
  // 3D BUTTON STYLING
  guessBtn: { 
    flex: 1, 
    paddingVertical: 24, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 6, // This creates the 3D depth
  },
  guessUpBtn: { borderColor: '#10B981', borderBottomColor: '#059669' },
  guessDownBtn: { borderColor: '#EF4444', borderBottomColor: '#B91C1C' },
  selectedUp: { backgroundColor: '#10B981', borderBottomWidth: 2, transform: [{ translateY: 4 }] }, // "Press down" animation
  selectedDown: { backgroundColor: '#EF4444', borderBottomWidth: 2, transform: [{ translateY: 4 }] },
  dimmed: { opacity: 0.4 },
  guessBtnText: { fontSize: 16, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  
  resultCard: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 30, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resultTitle: { fontSize: 22, fontWeight: '900' },
  explanation: { fontSize: 15, lineHeight: 22, marginBottom: 24, fontWeight: '600' },
  nextBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.2)' },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});