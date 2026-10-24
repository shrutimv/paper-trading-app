import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEARNING_DATA } from '../constants/LearningData';
import { useTheme } from '../context/ThemeContext';

// --- HELPER: Parse **Bold** Text ---
const ParsedText = ({ text, style }: { text: string; style?: any }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={{ fontWeight: '800' }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const { moduleId, level } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const idKey = String(moduleId);
  const lesson = LEARNING_DATA[idKey];

  // --- THEME ACCENTS BASED ON LEVEL (DARK & LIGHT MODE COMPLIANT) ---
  const getTheme = (lvl: string, dark: boolean) => {
    switch (lvl) {
      case 'Beginner':
        return {
          dark: dark ? '#34d399' : '#059669',
          light: dark ? 'rgba(5, 150, 105, 0.18)' : '#ecfdf5',
          border: dark ? 'rgba(52, 211, 153, 0.4)' : '#a7f3d0',
        };
      case 'Intermediate':
        return {
          dark: dark ? '#fbbf24' : '#d97706',
          light: dark ? 'rgba(217, 119, 6, 0.18)' : '#fffbeb',
          border: dark ? 'rgba(251, 191, 36, 0.4)' : '#fde68a',
        };
      case 'Advanced':
        return {
          dark: dark ? '#f87171' : '#dc2626',
          light: dark ? 'rgba(220, 38, 38, 0.18)' : '#fef2f2',
          border: dark ? 'rgba(248, 113, 113, 0.4)' : '#fecaca',
        };
      case 'Expert':
        return {
          dark: dark ? '#a78bfa' : '#7c3aed',
          light: dark ? 'rgba(124, 58, 237, 0.18)' : '#f3e8ff',
          border: dark ? 'rgba(167, 139, 250, 0.4)' : '#e9d5ff',
        };
      default:
        return {
          dark: dark ? '#60a5fa' : '#2563eb',
          light: dark ? 'rgba(37, 99, 235, 0.18)' : '#eff6ff',
          border: dark ? 'rgba(96, 165, 250, 0.4)' : '#bfdbfe',
        };
    }
  };

  const theme = getTheme(String(level), isDark);

  if (!lesson) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Module Not Found</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>This module content is coming soon.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* 1. TOP HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerCategory, { color: theme.dark }]}>
            {lesson.level.toUpperCase()} • MODULE {idKey.replace('m', '')}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {lesson.title}
          </Text>
        </View>
        <View style={[styles.readPill, { backgroundColor: theme.light, borderColor: theme.border }]}>
          <Ionicons name="time-outline" size={13} color={theme.dark} />
          <Text style={[styles.readPillText, { color: theme.dark }]}>{lesson.readTime}</Text>
        </View>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO TITLE & TAGLINE */}
        <View style={styles.heroBox}>
          <View style={[styles.taglineBadge, { backgroundColor: theme.light }]}>
            <Text style={[styles.taglineText, { color: theme.dark }]}>{lesson.level} Track</Text>
          </View>
          <Text style={[styles.mainTitle, { color: colors.text }]}>{lesson.title}</Text>
          <Text style={[styles.mainTagline, { color: colors.textSecondary }]}>{lesson.tagline}</Text>
        </View>

        {/* CURRICULUM SECTIONS */}
        {lesson.content.map((section, index) => (
          <View key={index} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepCircle, { backgroundColor: theme.dark }]}>
                <Text style={styles.stepNum}>{index + 1}</Text>
              </View>
              <Text style={[styles.heading, { color: colors.text }]}>{section.heading}</Text>
            </View>

            <ParsedText text={section.body} style={[styles.body, { color: colors.textSecondary }]} />

            {/* PRO-TIP CALLOUT BOX */}
            {section.proTip && (
              <View style={[styles.proTipBox, { backgroundColor: theme.light, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="bulb-outline" size={16} color={theme.dark} />
                  <Text style={[styles.proTipTitle, { color: theme.dark }]}>PRO INSIGHT</Text>
                </View>
                <Text style={[styles.proTipText, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{section.proTip}</Text>
              </View>
            )}
          </View>
        ))}

        {/* KEY TAKEAWAYS CARD */}
        {lesson.takeaway && (
          <View style={[styles.takeawayCard, { borderColor: theme.dark, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={22} color={theme.dark} />
              <Text style={[styles.takeawayTitle, { color: theme.dark }]}>KEY TAKEAWAY</Text>
            </View>
            <Text style={[styles.takeawayBody, { color: colors.text }]}>{lesson.takeaway}</Text>
          </View>
        )}

        {/* EXTRA PADDING FOR FIXED FOOTER */}
        <View style={{ height: 110 + insets.bottom }} />
      </ScrollView>

      {/* 3. FIXED BOTTOM ACTION BAR */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: colors.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.outlineBtnText, { color: colors.textSecondary }]}>Syllabus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quizBtn, { backgroundColor: theme.dark }]}
          onPress={() => router.replace({ pathname: '/quiz', params: { moduleId: idKey, level: level } })}
          activeOpacity={0.85}
        >
          <Ionicons name="school" size={18} color="#fff" />
          <Text style={styles.btnText}>Test Your Knowledge</Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>+250 XP</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
  },
  headerCategory: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  readPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  readPillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  heroBox: {
    marginBottom: 20,
  },
  taglineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 6,
  },
  mainTagline: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  sectionCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 23,
    textAlign: 'left',
  },

  proTipBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  proTipTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  proTipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  takeawayCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 20,
  },
  takeawayTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  takeawayBody: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  outlineBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  quizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  xpBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  xpBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
});