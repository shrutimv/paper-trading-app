import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recordCourseCompleted, recordPuzzleSolved } from '../src/services/progressService';
import { useGamification } from '../context/GamificationContext';
import { useTheme } from '../context/ThemeContext';

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const { moduleId, level } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const { addXp, currentRank, nextRank, progressPercent } = useGamification();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0)).current;

  const getTheme = (lvl: string) => {
    switch (lvl) {
      case 'Beginner':
        return { main: '#059669', light: '#ecfdf5', border: '#a7f3d0' };
      case 'Intermediate':
        return { main: '#d97706', light: '#fffbeb', border: '#fde68a' };
      case 'Advanced':
        return { main: '#dc2626', light: '#fef2f2', border: '#fecaca' };
      case 'Expert':
        return { main: '#7c3aed', light: '#f3e8ff', border: '#e9d5ff' };
      default:
        return { main: '#2563eb', light: '#eff6ff', border: '#bfdbfe' };
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

  if (activeQuestions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '700' }}>No Quiz Available</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Questions are being prepared for this module.</Text>
        </View>
      </View>
    );
  }

  const currentQ = activeQuestions[currentQuestion];

  const handleSelectOption = (index: number) => {
    if (answered) return;
    setSelectedOption(index);
    setAnswered(true);

    const isRight = index === currentQ.correct;
    if (isRight) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion + 1 < activeQuestions.length) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      // Quiz finished
      const finalScore = selectedOption === currentQ.correct ? score + 1 : score;
      if (!isPracticeMode) {
        const totalXpEarned = finalScore * 50;
        setEarnedXp(totalXpEarned);
        if (totalXpEarned > 0) addXp(totalXpEarned);
        saveProgress(finalScore);
      }
      setShowResults(true);
    }
  };

  const saveProgress = async (finalScore: number) => {
    if (finalScore >= Math.ceil(activeQuestions.length * 0.7)) {
      await AsyncStorage.setItem(`module_completed_${moduleId}`, 'true');
      recordCourseCompleted(`module_${moduleId}`).catch(() => {});
      recordPuzzleSolved().catch(() => {});
    }
  };

  const getOptionBg = (index: number) => {
    if (!answered) return colors.card;
    if (index === currentQ.correct) return 'rgba(16, 185, 129, 0.15)';
    if (index === selectedOption) return 'rgba(239, 68, 68, 0.15)';
    return colors.card;
  };

  const getOptionBorder = (index: number) => {
    if (!answered) return colors.border;
    if (index === currentQ.correct) return '#10b981';
    if (index === selectedOption) return '#ef4444';
    return colors.border;
  };

  const animatedWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (showResults) {
    const isPassed = score >= Math.ceil(activeQuestions.length * 0.7);

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.resultBox}>
          <Ionicons
            name={isPassed ? 'shield-checkmark' : 'shield-half'}
            size={80}
            color={isPassed ? theme.main : '#f59e0b'}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {isPassed ? 'Module Cleared!' : 'Keep Learning!'}
          </Text>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
            Score: {score} / {activeQuestions.length} Correct ({Math.round((score / activeQuestions.length) * 100)}%)
          </Text>

          <View style={[styles.proGameCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {isPracticeMode ? (
              <>
                <Text style={styles.proGameSub}>PRACTICE COMPLETED</Text>
                <Ionicons name="school" size={40} color="#9ca3af" style={{ marginVertical: 15 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontWeight: '600' }}>
                  Great revision! Module already unlocked in your portfolio.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.proGameSub}>Rank Progress</Text>

                <Animated.View style={[styles.proRankRow, { transform: [{ scale: popAnim }] }]}>
                  <Ionicons
                    name="leaf"
                    size={28}
                    color={currentRank.color}
                    style={{ transform: [{ scaleX: -1 }, { rotate: '45deg' }], opacity: 0.5 }}
                  />
                  <Text style={[styles.proRankName, { color: currentRank.color }]}>{currentRank.name}</Text>
                  <Ionicons
                    name="leaf"
                    size={28}
                    color={currentRank.color}
                    style={{ transform: [{ rotate: '45deg' }], opacity: 0.5 }}
                  />
                </Animated.View>

                <View style={styles.proXpBarRow}>
                  <Text style={styles.proXpText}>{(currentRank.minXp + earnedXp).toLocaleString()} XP</Text>
                  <Text style={styles.proXpText}>{nextRank ? nextRank.minXp.toLocaleString() + ' XP' : 'MAX'}</Text>
                </View>

                <View style={[styles.proTrack, { backgroundColor: colors.border }]}>
                  <Animated.View
                    style={[styles.proFill, { width: animatedWidth, backgroundColor: currentRank.color }]}
                  />
                </View>

                <Animated.Text style={[styles.proEarnedText, { opacity: popAnim }]}>
                  +{earnedXp} XP Earned
                </Animated.Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.gameButton, { backgroundColor: theme.main }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.gameButtonText}>CONTINUE TO ACADEMY</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isCurrentCorrect = selectedOption === currentQ.correct;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', color: theme.main, fontSize: 14 }}>
            {String(level).toUpperCase()} • Q{currentQuestion + 1}/{activeQuestions.length}
          </Text>
          {isPracticeMode && (
            <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '800', letterSpacing: 0.8 }}>
              PRACTICE MODE
            </Text>
          )}
        </View>
        <View style={{ width: 30 }} />
      </View>

      {/* PROGRESS BAR */}
      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${((currentQuestion + 1) / activeQuestions.length) * 100}%`, backgroundColor: theme.main },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollQuizContent} showsVerticalScrollIndicator={false}>
        {/* QUESTION TEXT */}
        <View style={styles.questionContainer}>
          <Text style={[styles.questionText, { color: colors.text }]}>{currentQ.question}</Text>
        </View>

        {/* OPTIONS */}
        {currentQ.options.map((option: string, index: number) => {
          const isSelected = selectedOption === index;
          const isRight = index === currentQ.correct;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                {
                  backgroundColor: getOptionBg(index),
                  borderColor: getOptionBorder(index),
                },
              ]}
              onPress={() => handleSelectOption(index)}
              disabled={answered}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.optionLetter,
                  {
                    backgroundColor: answered
                      ? isRight
                        ? '#10b981'
                        : isSelected
                        ? '#ef4444'
                        : colors.border
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: answered && (isRight || isSelected) ? '#fff' : colors.text,
                    fontWeight: '800',
                    fontSize: 12,
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>

              <Text style={[styles.optionText, { color: colors.text, fontWeight: isSelected ? '800' : '600' }]}>
                {option}
              </Text>

              {answered && isRight && <Ionicons name="checkmark-circle" size={22} color="#10b981" />}
              {answered && isSelected && !isRight && <Ionicons name="close-circle" size={22} color="#ef4444" />}
            </TouchableOpacity>
          );
        })}

        {/* EXPLANATION BOX (Revealed upon answering) */}
        {answered && (
          <View
            style={[
              styles.explanationCard,
              {
                backgroundColor: isCurrentCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: isCurrentCorrect ? '#10b981' : '#ef4444',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons
                name={isCurrentCorrect ? 'sparkles' : 'alert-circle'}
                size={18}
                color={isCurrentCorrect ? '#10b981' : '#ef4444'}
              />
              <Text
                style={{
                  color: isCurrentCorrect ? '#10b981' : '#ef4444',
                  fontWeight: '900',
                  fontSize: 12,
                  letterSpacing: 0.8,
                }}
              >
                {isCurrentCorrect ? 'EXCELLENT! SPOT ON' : 'LEARNING POINT'}
              </Text>
            </View>
            <Text style={[styles.explanationText, { color: colors.text }]}>{currentQ.explanation}</Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* BOTTOM CONTINUE BUTTON (Active when answered) */}
      {answered && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: isCurrentCorrect ? '#10b981' : theme.main }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {currentQuestion + 1 < activeQuestions.length ? 'NEXT QUESTION →' : 'VIEW RESULTS 🎉'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 54,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  scrollQuizContent: {
    paddingBottom: 20,
  },
  questionContainer: {
    minHeight: 90,
    justifyContent: 'center',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    gap: 12,
  },
  optionLetter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14.5,
    flex: 1,
    lineHeight: 20,
  },

  explanationCard: {
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  explanationText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '600',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  resultBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 15,
    marginBottom: 24,
    marginTop: 6,
    fontWeight: '700',
  },

  proGameCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 30,
    alignItems: 'center',
  },
  proGameSub: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  proRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  proRankName: {
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  proXpBarRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  proXpText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '800',
  },
  proTrack: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  proFill: {
    height: '100%',
    borderRadius: 6,
  },
  proEarnedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '900',
  },

  gameButton: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  gameButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
});