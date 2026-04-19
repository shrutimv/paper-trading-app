import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface QuizCardProps {
  questionData: { q: string, options: string[] };
  onAnswer: (index: number) => void;
}

export default function QuizCard({ questionData, onAnswer }: QuizCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.questionText}>{questionData.q}</Text>
      {questionData.options.map((option, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.optionButton} 
          onPress={() => onAnswer(index)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, margin: 15, elevation: 4 },
  questionText: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  optionButton: { backgroundColor: '#f0f4f7', padding: 15, borderRadius: 10, marginVertical: 8, borderWidth: 1, borderColor: '#d1d9e0' },
  optionText: { fontSize: 16, color: '#444' }
});