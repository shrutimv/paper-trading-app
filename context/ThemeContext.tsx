import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    accent: string;
    tabBg: string;
    statusBar: 'light' | 'dark';
    shadowColor: string;
  };
}

const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  accent: '#0f62fe',
  tabBg: '#F9FAFB',
  statusBar: 'dark' as const,
  shadowColor: '#000000',
};

const darkColors = {
  background: '#0A0F1D',
  card: '#161F30',
  border: '#1E293B',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  accent: '#3B82F6',
  tabBg: '#0F172A',
  statusBar: 'light' as const,
  shadowColor: '#000000',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('dark'); // Default to dark theme

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      await AsyncStorage.setItem('userTheme', nextTheme);
    } catch (e) {
      console.error('Failed to save theme', nextTheme);
    }
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
