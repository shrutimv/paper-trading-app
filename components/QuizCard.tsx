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
      
      <View style={styles.optionsContainer}>
        {questionData.options.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.optionButton} 
            onPress={() => onAnswer(index)}
            activeOpacity={0.6}
          >
            <View style={styles.optionLetterBox}>
              <Text style={styles.optionLetter}>{String.fromCharCode(65 + index)}</Text>
            </View>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 24, 
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  questionText: { 
    fontSize: 20, 
    fontWeight: '800', 
    marginBottom: 24, 
    color: '#0F172A',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12, // Spacing between buttons
  },
  // 3D Duolingo-style text buttons
  optionButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: '#E2E8F0',
    borderBottomWidth: 5, // The 3D pop effect
    borderBottomColor: '#CBD5E1',
  },
  optionLetterBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 14,
  },
  optionText: { 
    flex: 1,
    fontSize: 16, 
    color: '#334155',
    fontWeight: '700',
  }
});