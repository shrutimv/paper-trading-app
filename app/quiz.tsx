import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { quizData } from '../src/quizData';

export default function QuizScreen() {
  const { moduleId } = useLocalSearchParams();
  const router = useRouter();
  const module = quizData.modules.find(m => m.id === moduleId) || quizData.modules[0];

  const [stage, setStage] = useState<'reading' | 'quiz' | 'result'>('reading');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswer = (index: number) => {
    if (showExplanation) return; // Prevent double clicking
    setSelectedOption(index);
    setShowExplanation(true);
    if (index === module.questions[currentIdx].correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    setSelectedOption(null);
    if (currentIdx < module.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setStage('result');
    }
  };

  if (stage === 'reading') {
    return (
      <View style={styles.container}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <Text style={styles.title}>{module.title}</Text>
          <Text style={styles.readingText}>{module.content}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStage('quiz')}>
            <Text style={styles.btnText}>I'm Ready, Start Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStage('quiz')}>
            <Text style={styles.secondaryBtnText}>Skip Reading & Take Quiz</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (stage === 'quiz') {
    const q = module.questions[currentIdx];
    return (
      <View style={styles.container}>
        <Text style={styles.progress}>Question {currentIdx + 1} of {module.questions.length}</Text>
        <Text style={styles.questionText}>{q.question}</Text>

        {q.options.map((opt, i) => (
          <TouchableOpacity 
            key={i} 
            disabled={showExplanation}
            style={[
              styles.optionBtn,
              selectedOption === i && (i === q.correct ? styles.correctOpt : styles.wrongOpt)
            ]}
            onPress={() => handleAnswer(i)}
          >
            <Text>{opt}</Text>
          </TouchableOpacity>
        ))}

        {showExplanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>
              {selectedOption === q.correct ? "✅ Correct!" : "❌ Incorrect"}
            </Text>
            <Text style={styles.explanationText}>{q.explanation}</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
              <Text style={styles.btnText}>Next Question</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz Completed!</Text>
      <Text style={styles.scoreText}>You scored {score} / {module.questions.length}</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/puzzles')}>
        <Text style={styles.btnText}>Return to Modules</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#0f1724' },
  readingText: { fontSize: 16, lineHeight: 24, color: '#4b5563', marginBottom: 30 },
  primaryBtn: { backgroundColor: '#0f62fe', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  secondaryBtn: { padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtnText: { color: '#0f62fe', fontWeight: '600' },
  questionText: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  optionBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  correctOpt: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  wrongOpt: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  explanationBox: { marginTop: 20, padding: 15, backgroundColor: '#eff6ff', borderRadius: 10 },
  explanationTitle: { fontWeight: 'bold', marginBottom: 5 },
  explanationText: { color: '#1e40af', marginBottom: 15 },
  nextBtn: { backgroundColor: '#0f62fe', padding: 12, borderRadius: 8, alignItems: 'center' },
  progress: { color: '#6b7280', marginBottom: 10 },
  scoreText: { fontSize: 22, textAlign: 'center', marginBottom: 30 }
});