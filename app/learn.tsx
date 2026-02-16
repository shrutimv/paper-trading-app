import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LEARNING_DATA } from '../constants/LearningData';

// --- HELPER: Parse **Bold** Text ---
const ParsedText = ({ text, style }: { text: string, style?: any }) => {
  if (!text) return null;
  // Split by **...**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Remove asterisks and make bold
          return <Text key={index} style={{ fontWeight: '800' }}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

export default function LearnScreen() {
  const { moduleId, level } = useLocalSearchParams(); // Get Level
  const router = useRouter();
  const idKey = String(moduleId);
  const lesson = LEARNING_DATA[idKey];

  // --- THEME COLORS ---
  const getTheme = (lvl: string) => {
    switch(lvl) {
      case 'Beginner': return { bg: '#ecfdf5', dark: '#10b981', light: '#d1fae5' };
      case 'Intermediate': return { bg: '#fffbeb', dark: '#d97706', light: '#fde68a' }; // Darker Orange for text
      case 'Advanced': return { bg: '#fef2f2', dark: '#dc2626', light: '#fecaca' };
      case 'Expert': return { bg: '#f3e8ff', dark: '#7c3aed', light: '#e9d5ff' };
      default: return { bg: '#f3f4f6', dark: '#4b5563', light: '#e5e7eb' };
    }
  };

  const theme = getTheme(String(level));

  if (!lesson) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      {/* 1. COMPACT HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.dark }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.dark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.dark }]}>
          {String(level).toUpperCase()} MODULE • {idKey.replace('m','')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.mainTitle, { color: '#111' }]}>{lesson.title}</Text>

        {/* 2. DENSE CONTENT BLOCKS */}
        {lesson.content.map((section: any, index: number) => (
          <View key={index} style={styles.section}>
            {/* Colored Bullet Point */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={[styles.bullet, { backgroundColor: theme.dark }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.heading, { color: theme.dark }]}>{section.heading}</Text>
                
                {/* USE PARSED TEXT FOR BODY */}
                <ParsedText text={section.body} style={styles.body} />
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} /> 
      </ScrollView>

      {/* 3. THEMED FOOTER BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.quizBtn, { backgroundColor: theme.dark }]} 
          onPress={() => router.replace({ pathname: "/quiz", params: { moduleId: idKey, level: level } })}
        >
          <Text style={styles.btnText}>Start Quiz 📝</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, 
    backgroundColor: 'rgba(255,255,255,0.6)', 
    borderBottomWidth: 1 
  },
  headerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  scrollContent: { padding: 20 },
  mainTitle: { fontSize: 26, fontWeight: '900', marginBottom: 20, lineHeight: 32 },
  
  // Compact Section Styling
  section: { marginBottom: 18 }, // Reduced from 24
  bullet: { width: 4, height: 18, borderRadius: 2, marginTop: 4 }, // Vertical Line accent
  heading: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  body: { 
    fontSize: 15, // Slightly smaller for density
    lineHeight: 22, // Tighter lines
    color: '#333',
    textAlign: 'justify' // Professional look
  },

  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 16, backgroundColor: 'rgba(255,255,255,0.9)' },
  quizBtn: { padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }
});