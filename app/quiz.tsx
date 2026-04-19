import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUIZ_DATA } from '../constants/Questions';
import { useGamification } from '../context/GamificationContext';

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const { moduleId, level } = useLocalSearchParams(); 
  const router = useRouter();
  
  const { addXp, currentRank, nextRank, progressPercent } = useGamification(); 
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [canClick, setCanClick] = useState(true);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0)).current;

  const getTheme = (lvl: string) => {
    switch(lvl) {
      case 'Beginner': return { main: '#10b981', light: '#ecfdf5', bg: '#f0fdf4' };
      case 'Intermediate': return { main: '#f59e0b', light: '#fffbeb', bg: '#fffaf0' };
      case 'Advanced': return { main: '#ef4444', light: '#fef2f2', bg: '#fef2f2' };
      case 'Expert': return { main: '#7c3aed', light: '#f3e8ff', bg: '#faf5ff' };
      default: return { main: '#0f62fe', light: '#eff6ff', bg: '#ffffff' };
    }
  };
  
  const theme = getTheme(String(level));
  const activeQuestions = QUIZ_DATA[String(moduleId)] || [];

  useEffect(() => {
    const checkStatus = async () => {
      const completed = await AsyncStorage.getItem(`module_completed_${moduleId}`);
      if (completed === 'true') setIsPracticeMode(true);
    };
    checkStatus();
  }, [moduleId]);

  useEffect(() => {
    if (showResults && !isPracticeMode) {
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }).start();

      Animated.timing(fillAnim, {
        toValue: progressPercent,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [showResults, progressPercent, isPracticeMode]);

  if (activeQuestions.length === 0) return null;

  const handleAnswer = (index: number) => {
    if (!canClick) return;
    setCanClick(false);
    setSelectedOption(index);

    const isRight = index === activeQuestions[currentQuestion].correct;
    const newScore = isRight ? score + 1 : score;
    if (isRight) setScore(newScore);

    setTimeout(() => {
      if (currentQuestion + 1 < activeQuestions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setCanClick(true);
      } else {
        if (!isPracticeMode) {
          const totalXpEarned = newScore * 50; 
          setEarnedXp(totalXpEarned);
          if (totalXpEarned > 0) addXp(totalXpEarned);
          saveProgress(newScore);
        }
        setShowResults(true);
      }
    }, 1200);
  };

  const saveProgress = async (finalScore: number) => {
    if (finalScore === activeQuestions.length) {
      await AsyncStorage.setItem(`module_completed_${moduleId}`, 'true');
    }
  };

  const getOptionColor = (index: number) => {
    if (selectedOption === null) return '#ffffff'; 
    const correctIndex = activeQuestions[currentQuestion].correct;
    if (index === correctIndex) return '#dcfce7'; 
    if (index === selectedOption) return '#fee2e2'; 
    return '#ffffff';
  };
  
  const getBorderColor = (index: number) => {
      if (selectedOption === null) return '#e5e7eb'; 
      const correctIndex = activeQuestions[currentQuestion].correct;
      if (index === correctIndex) return '#16a34a'; 
      if (index === selectedOption) return '#dc2626';
      return '#e5e7eb';
  };

  const animatedWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  if (showResults) {
    const isPerfect = score === activeQuestions.length;

    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.resultBox}>
          
          <Ionicons name={isPerfect ? "shield-checkmark" : "shield-half"} size={80} color={theme.main} />
          <Text style={styles.title}>{isPerfect ? "Module Cleared!" : "Good Effort!"}</Text>
          <Text style={styles.subTitle}>Accuracy: {score} / {activeQuestions.length}</Text>
          
          <View style={[styles.proGameCard, { borderColor: currentRank.color + '30' }]}>
            {isPracticeMode ? (
              <>
                <Text style={styles.proGameSub}>PRACTICE COMPLETED</Text>
                <Ionicons name="school" size={40} color="#9ca3af" style={{ marginVertical: 15 }} />
                <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', fontWeight: '600' }}>
                  XP already collected for this module.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.proGameSub}>Rank Progress</Text>
                
                <Animated.View style={[styles.proRankRow, { transform: [{ scale: popAnim }] }]}>
                  <Ionicons name="leaf" size={28} color={currentRank.color} style={{ transform: [{ scaleX: -1 }, { rotate: '45deg' }], opacity: 0.5 }} />
                  <Text style={[styles.proRankName, { color: currentRank.color }]}>{currentRank.name}</Text>
                  <Ionicons name="leaf" size={28} color={currentRank.color} style={{ transform: [{ rotate: '45deg' }], opacity: 0.5 }} />
                </Animated.View>

                <View style={styles.proXpBarRow}>
                  <Text style={styles.proXpText}>{(currentRank.minXp + earnedXp).toLocaleString()} XP</Text>
                  <Text style={styles.proXpText}>{nextRank ? nextRank.minXp.toLocaleString() + ' XP' : 'MAX'}</Text>
                </View>

                <View style={styles.proTrack}>
                  <Animated.View style={[styles.proFill, { width: animatedWidth, backgroundColor: currentRank.color }]} />
                </View>
                
                <Animated.Text style={[styles.proEarnedText, { opacity: popAnim }]}>
                  +{earnedXp} XP Earned
                </Animated.Text>
              </>
            )}
          </View>
          
          <TouchableOpacity style={[styles.gameButton, { backgroundColor: theme.main }]} onPress={() => router.back()}>
            <Text style={styles.gameButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#374151" />
         </TouchableOpacity>
         <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', color: theme.main, fontSize: 16 }}>{String(level).toUpperCase()}</Text>
            {isPracticeMode && <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '800', letterSpacing: 1 }}>PRACTICE</Text>}
         </View>
         <Ionicons name="close" size={28} color="transparent" /> 
      </View>

      <View style={styles.quizBox}>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((currentQuestion + 1) / activeQuestions.length) * 100}%`, backgroundColor: theme.main }]} />
        </View>
        
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{activeQuestions[currentQuestion].question}</Text>
        </View>
        
        {activeQuestions[currentQuestion].options.map((option: string, index: number) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.option, { backgroundColor: getOptionColor(index), borderColor: getBorderColor(index) }]} 
            onPress={() => handleAnswer(index)}
            disabled={!canClick}
          >
            <Text style={[styles.optionText, { fontWeight: selectedOption === index ? '800' : '600' }]}>{option}</Text>
            
            {selectedOption === index && (
              <Ionicons 
                name={index === activeQuestions[currentQuestion].correct ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={index === activeQuestions[currentQuestion].correct ? "#16a34a" : "#dc2626"} 
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  quizBox: { flex: 1, paddingTop: 10 },
  progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 15 },
  progressBarFill: { height: 8, borderRadius: 4 },
  questionContainer: { minHeight: 140, justifyContent: 'center', marginBottom: 10 },
  questionText: { fontSize: 24, fontWeight: '900', color: '#111827', lineHeight: 34 },
  
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 16, marginBottom: 14, borderWidth: 3, elevation: 0 },
  optionText: { fontSize: 16, color: '#374151', flex: 1 },
  
  resultBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '900', marginTop: 24, color: '#111827', letterSpacing: -0.5 },
  subTitle: { fontSize: 18, color: '#6b7280', marginBottom: 30, marginTop: 8, fontWeight: '700' },
  
  proGameCard: { 
    backgroundColor: '#ffffff', 
    width: '100%', padding: 28, 
    borderRadius: 24, borderWidth: 2, 
    marginBottom: 40, alignItems: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8
  },
  proGameSub: { color: '#9ca3af', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15 },
  
  proRankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginBottom: 25 },
  proRankName: { fontSize: 38, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  
  proXpBarRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 8 },
  proXpText: { color: '#6b7280', fontSize: 13, fontWeight: '800' },
  
  proTrack: { width: '100%', height: 14, backgroundColor: '#f3f4f6', borderRadius: 7, overflow: 'hidden', marginBottom: 20 },
  proFill: { height: '100%', borderRadius: 7 },
  
  proEarnedText: { color: '#10b981', fontSize: 16, fontWeight: '900' },

  gameButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 20, width: '100%', alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  gameButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 18, letterSpacing: 1.5 },
});