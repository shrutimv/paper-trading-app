import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QUIZ_DATA } from '../constants/Questions';

export default function QuizScreen() {
  const { moduleId, level } = useLocalSearchParams(); // Get Level
  const router = useRouter();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [canClick, setCanClick] = useState(true);

  // --- THEME LOGIC ---
  const getTheme = (lvl: string) => {
    switch(lvl) {
      case 'Beginner': return { main: '#10b981', light: '#ecfdf5', bg: '#f0fdf4' };
      case 'Intermediate': return { main: '#f59e0b', light: '#fffbeb', bg: '#fffaf0' };
      case 'Advanced': return { main: '#ef4444', light: '#fef2f2', bg: '#fef2f2' };
      case 'Expert': return { main: '#7c3aed', light: '#f3e8ff', bg: '#faf5ff' };
      default: return { main: '#0f62fe', light: '#eff6ff', bg: '#fff' };
    }
  };
  const theme = getTheme(String(level));

  const activeQuestions = QUIZ_DATA[String(moduleId)] || [];

  if (activeQuestions.length === 0) return null; // Or fallback UI

  const handleAnswer = (index: number) => {
    if (!canClick) return;
    setCanClick(false);
    setSelectedOption(index);

    const isRight = index === activeQuestions[currentQuestion].correct;
    if (isRight) setScore(score + 1);

    setTimeout(() => {
      if (currentQuestion + 1 < activeQuestions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setCanClick(true);
      } else {
        saveProgress(isRight ? score + 1 : score);
        setShowResults(true);
      }
    }, 1200);
  };

  const saveProgress = async (finalScore: number) => {
    if (finalScore === activeQuestions.length) {
      await AsyncStorage.setItem(`module_completed_${moduleId}`, 'true');
    }
  };

  // --- DYNAMIC COLORS ---
  const getOptionColor = (index: number) => {
    if (selectedOption === null) return '#fff'; // White background for cards
    const correctIndex = activeQuestions[currentQuestion].correct;
    if (index === correctIndex) return '#dcfce7'; // Green Success
    if (index === selectedOption) return '#fee2e2'; // Red Error
    return '#fff';
  };
  
  const getBorderColor = (index: number) => {
      if (selectedOption === null) return '#e5e7eb'; // Gray border
      const correctIndex = activeQuestions[currentQuestion].correct;
      if (index === correctIndex) return '#16a34a'; 
      if (index === selectedOption) return '#dc2626';
      return '#e5e7eb';
  };

  if (showResults) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.resultBox}>
          <Ionicons 
            name={score === activeQuestions.length ? "trophy" : "ribbon"} 
            size={80} 
            color={theme.main} 
          />
          <Text style={styles.title}>
            {score === activeQuestions.length ? "Module Complete!" : "Good Try!"}
          </Text>
          <Text style={styles.subTitle}>You scored {score} / {activeQuestions.length}</Text>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.main }]} onPress={() => router.replace('/(tabs)/puzzles')}>
            <Text style={styles.buttonText}>Continue Journey</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#374151" />
         </TouchableOpacity>
         <Text style={{ fontWeight: 'bold', color: theme.main }}>{String(level).toUpperCase()}</Text>
         <View style={{width: 24}} /> 
      </View>

      <View style={styles.quizBox}>
        {/* Themed Progress Bar */}
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((currentQuestion + 1) / activeQuestions.length) * 100}%`, backgroundColor: theme.main }]} />
        </View>
        
        <Text style={styles.questionText}>{activeQuestions[currentQuestion].question}</Text>
        
        {activeQuestions[currentQuestion].options.map((option: string, index: number) => (
          <TouchableOpacity 
            key={index} 
            style={[
                styles.option, 
                { backgroundColor: getOptionColor(index), borderColor: getBorderColor(index) }
            ]} 
            onPress={() => handleAnswer(index)}
            disabled={!canClick}
          >
            <Text style={[styles.optionText, { fontWeight: selectedOption === index ? 'bold' : '500' }]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  
  quizBox: { flex: 1, paddingTop: 20 },
  progressBarBg: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 24 },
  progressBarFill: { height: 4, borderRadius: 2 },
  
  questionText: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 30, lineHeight: 28 },
  
  option: { 
      padding: 16, borderRadius: 12, marginBottom: 12, 
      borderWidth: 2, // Thicker border for better touch target visibility
      elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width:0, height:2}
  },
  optionText: { fontSize: 16, color: '#1f2937' },
  
  resultBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 20, color: '#111' },
  subTitle: { fontSize: 18, color: '#6b7280', marginBottom: 40, marginTop: 10 },
  
  button: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});