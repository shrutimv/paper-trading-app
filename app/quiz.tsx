import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUIZ_DATA } from '../constants/Questions';
import { recordCourseCompleted, recordPuzzleSolved } from '../src/services/progressService';
import { useGamification } from '../context/GamificationContext';
import { useTheme } from '../context/ThemeContext';

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const { moduleId, level } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const { addXp, currentRank, nextRank, progressPercent } = useGamification();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

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

  const PASSING_PERCENTAGE = 60;
  const passingScore = Math.ceil((activeQuestions.length * PASSING_PERCENTAGE) / 100);

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
    setUserAnswers((prev) => ({ ...prev, [currentQuestion]: index }));

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
      // Quiz finished - compute definitive score based on recorded answers
      const allAnswers = { ...userAnswers, [currentQuestion]: selectedOption ?? -1 };
      const finalScore = activeQuestions.reduce((acc, q, idx) => {
        return allAnswers[idx] === q.correct ? acc + 1 : acc;
      }, 0);

      const isPassed = finalScore >= passingScore;

      if (!isPracticeMode) {
        if (isPassed) {
          // STRICT RULE: Award XP only if user passes the exam!
          const totalXpEarned = 100 + finalScore * 25;
          setEarnedXp(totalXpEarned);
          if (totalXpEarned > 0) addXp(totalXpEarned);
          saveProgress(finalScore);
        } else {
          // Failed exam: 0 XP awarded
          setEarnedXp(0);
        }
      }
      setShowResults(true);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
    setAnswered(false);
    setUserAnswers({});
    setEarnedXp(0);
    setShowResults(false);
  };

  const saveProgress = async (finalScore: number) => {
    if (finalScore >= passingScore) {
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
    const finalScore = activeQuestions.reduce((acc, q, idx) => {
      return userAnswers[idx] === q.correct ? acc + 1 : acc;
    }, 0);
    const scorePct = Math.round((finalScore / activeQuestions.length) * 100);
    const isPassed = finalScore >= passingScore;

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {/* TOP BAR */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16 }}>
            Module Exam Results
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── TOP FOLD: RESULT SUMMARY & PASS/FAIL CARD ── */}
          <View style={styles.resultBox}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isPassed
                    ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7')
                    : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2'),
                },
              ]}
            >
              <Ionicons
                name={isPassed ? 'shield-checkmark' : 'alert-circle'}
                size={60}
                color={isPassed ? '#10b981' : '#ef4444'}
              />
            </View>

            {/* HIGH-VISIBILITY STATUS BADGE */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isPassed
                    ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0')
                    : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca'),
                  borderColor: isPassed ? '#10b981' : '#ef4444',
                },
              ]}
            >
              <Ionicons
                name={isPassed ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isPassed ? '#10b981' : '#ef4444'}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isPassed ? '#10b981' : '#ef4444' },
                ]}
              >
                {isPassed ? 'EXAM PASSED 🎉' : 'EXAM FAILED ❌'}
              </Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              {isPassed ? 'Congratulations!' : 'Needs Revision'}
            </Text>

            {/* DETAILED SCORE BREAKDOWN */}
            <View style={[styles.scoreSummaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Your Final Score
                </Text>
                <Text style={[styles.bigScoreText, { color: isPassed ? '#10b981' : '#ef4444' }]}>
                  {finalScore} <Text style={{ fontSize: 20, color: colors.textSecondary }}>/ {activeQuestions.length}</Text>
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: isPassed ? '#10b981' : '#ef4444' }}>
                  {scorePct}% Correct
                </Text>
              </View>

              <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />

              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Passing Score Required:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                    {passingScore} / {activeQuestions.length} ({PASSING_PERCENTAGE}%)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Result Decision:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: isPassed ? '#10b981' : '#ef4444' }}>
                    {isPassed ? 'PASSED (Module Cleared)' : `FAILED (Needs ${passingScore - finalScore} more correct)`}
                  </Text>
                </View>
              </View>
            </View>

            {/* GAMIFICATION & XP STATUS */}
            <View style={[styles.proGameCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {isPracticeMode ? (
                <>
                  <Text style={styles.proGameSub}>PRACTICE COMPLETED</Text>
                  <Ionicons name="school" size={36} color="#9ca3af" style={{ marginVertical: 10 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', fontWeight: '600' }}>
                    Great revision! Module is already completed and unlocked in your portfolio.
                  </Text>
                </>
              ) : isPassed ? (
                <>
                  <Text style={styles.proGameSub}>Rank Progress</Text>
                  <Animated.View style={[styles.proRankRow, { transform: [{ scale: popAnim }] }]}>
                    <Ionicons
                      name="leaf"
                      size={26}
                      color={currentRank.color}
                      style={{ transform: [{ scaleX: -1 }, { rotate: '45deg' }], opacity: 0.5 }}
                    />
                    <Text style={[styles.proRankName, { color: currentRank.color }]}>{currentRank.name}</Text>
                    <Ionicons
                      name="leaf"
                      size={26}
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
                    +{earnedXp} XP Earned 🎉
                  </Animated.Text>
                </>
              ) : (
                <>
                  <Text style={styles.proGameSub}>XP REWARD LOCKED</Text>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginVertical: 8,
                    }}
                  >
                    <Ionicons name="lock-closed" size={22} color="#ef4444" />
                  </View>
                  <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '900', marginBottom: 4 }}>
                    0 XP Earned
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12.5, textAlign: 'center', lineHeight: 18 }}>
                    XP is awarded only when passing the exam with ≥ {PASSING_PERCENTAGE}% ({passingScore}/{activeQuestions.length} correct). Retake the exam to earn XP and level up!
                  </Text>
                </>
              )}
            </View>

            {/* ACTION BUTTONS */}
            <View style={{ width: '100%', gap: 10 }}>
              {isPassed ? (
                <TouchableOpacity
                  style={[styles.gameButton, { backgroundColor: theme.main }]}
                  onPress={() => router.back()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gameButtonText}>CONTINUE TO ACADEMY →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.gameButton, { backgroundColor: theme.main }]}
                  onPress={handleRetakeQuiz}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gameButtonText}>RETAKE QUIZ 🔄</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* SCROLL DOWN HINT (VISIBLE AT BOTTOM OF TOP FOLD) */}
            <View style={styles.scrollHintContainer}>
              <Text style={[styles.scrollHintText, { color: colors.textSecondary }]}>
                Scroll down to review questions & answers
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </View>
          </View>

          {/* ── BELOW THE FOLD: COMPLETE QUESTION & ANSWER REVIEW ── */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text-outline" size={20} color={colors.text} />
                <Text style={[styles.reviewSectionTitle, { color: colors.text }]}>
                  Question & Answer Review
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary }}>
                  {finalScore}/{activeQuestions.length} Correct
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
              Review your answers, correct options, and detailed financial explanations below:
            </Text>

            {activeQuestions.map((q, qIndex) => {
              const userAnswer = userAnswers[qIndex];
              const isUserCorrect = userAnswer === q.correct;

              return (
                <View
                  key={qIndex}
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isUserCorrect
                        ? (isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0')
                        : (isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca'),
                    },
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.reviewCardHeader}>
                    <Text style={[styles.reviewQNumber, { color: colors.textSecondary }]}>
                      QUESTION {qIndex + 1} OF {activeQuestions.length}
                    </Text>
                    <View
                      style={[
                        styles.reviewStatusBadge,
                        {
                          backgroundColor: isUserCorrect
                            ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7')
                            : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2'),
                        },
                      ]}
                    >
                      <Ionicons
                        name={isUserCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={13}
                        color={isUserCorrect ? '#10b981' : '#ef4444'}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '900',
                          color: isUserCorrect ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isUserCorrect ? 'CORRECT' : 'INCORRECT'}
                      </Text>
                    </View>
                  </View>

                  {/* Question Text */}
                  <Text style={[styles.reviewQText, { color: colors.text }]}>
                    {q.question}
                  </Text>

                  {/* Options List */}
                  <View style={{ gap: 8, marginTop: 10 }}>
                    {q.options.map((option: string, optIdx: number) => {
                      const isCorrectOption = optIdx === q.correct;
                      const isUserPick = optIdx === userAnswer;

                      let optBg = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
                      let optBorder = colors.border;
                      let badgeText = '';
                      let badgeColor = '';
                      let badgeBg = '';

                      if (isCorrectOption && isUserPick) {
                        optBg = isDark ? 'rgba(16, 185, 129, 0.12)' : '#dcfce7';
                        optBorder = '#10b981';
                        badgeText = '✓ Your Answer (Correct)';
                        badgeColor = '#10b981';
                        badgeBg = isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0';
                      } else if (isCorrectOption) {
                        optBg = isDark ? 'rgba(16, 185, 129, 0.12)' : '#dcfce7';
                        optBorder = '#10b981';
                        badgeText = '✓ Correct Answer';
                        badgeColor = '#10b981';
                        badgeBg = isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0';
                      } else if (isUserPick) {
                        optBg = isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2';
                        optBorder = '#ef4444';
                        badgeText = '✗ Your Answer';
                        badgeColor = '#ef4444';
                        badgeBg = isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca';
                      }

                      return (
                        <View
                          key={optIdx}
                          style={[
                            styles.reviewOptionRow,
                            { backgroundColor: optBg, borderColor: optBorder },
                          ]}
                        >
                          <View style={styles.reviewOptLeft}>
                            <View
                              style={[
                                styles.reviewOptLetter,
                                {
                                  backgroundColor: isCorrectOption
                                    ? '#10b981'
                                    : isUserPick
                                    ? '#ef4444'
                                    : colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '800',
                                  color: (isCorrectOption || isUserPick) ? '#fff' : colors.text,
                                }}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </Text>
                            </View>
                            <Text style={[styles.reviewOptText, { color: colors.text }]}>
                              {option}
                            </Text>
                          </View>

                          {badgeText ? (
                            <View style={[styles.reviewBadge, { backgroundColor: badgeBg }]}>
                              <Text style={{ fontSize: 9.5, fontWeight: '800', color: badgeColor }}>
                                {badgeText}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>

                  {/* Explanation */}
                  {q.explanation && (
                    <View
                      style={[
                        styles.reviewExplanationBox,
                        {
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
                          borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe',
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <Ionicons name="bulb-outline" size={14} color="#2563eb" />
                        <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#2563eb', textTransform: 'uppercase' }}>
                          Reasoning & Explanation
                        </Text>
                      </View>
                      <Text style={[styles.reviewExplanationText, { color: colors.text }]}>
                        {q.explanation}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Bottom Actions after review */}
            <View style={{ marginTop: 20, gap: 10 }}>
              <TouchableOpacity
                style={[styles.gameButton, { backgroundColor: theme.main }]}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Text style={styles.gameButtonText}>RETURN TO ACADEMY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.gameButton,
                  {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleRetakeQuiz}
                activeOpacity={0.85}
              >
                <Text style={[styles.gameButtonText, { color: colors.text }]}>RETAKE QUIZ 🔄</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreSummaryCard: {
    width: '100%',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  bigScoreText: {
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 4,
  },
  scoreDivider: {
    height: 1,
    marginVertical: 12,
  },
  scrollHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 8,
  },
  scrollHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewSection: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  reviewCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewQNumber: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  reviewStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reviewQText: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },
  reviewOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewOptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  reviewOptLetter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewOptText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  reviewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewExplanationBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewExplanationText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
});