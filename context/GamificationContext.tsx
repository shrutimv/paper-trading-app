import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// The Rank Ladder
export const RANKS = [
  { name: 'Novice',    minXp: 0,     color: '#64748b' }, 
  { name: 'Bronze',    minXp: 500,   color: '#b45309' }, 
  { name: 'Silver',    minXp: 1500,  color: '#94a3b8' }, 
  { name: 'Gold',      minXp: 3000,  color: '#eab308' }, 
  { name: 'Platinum',  minXp: 6000,  color: '#8b5cf6' }, 
  { name: 'Diamond',   minXp: 10000, color: '#06b6d4' }, 
];

type GamificationType = {
  xp: number;
  addXp: (amount: number) => void;
  currentRank: typeof RANKS[0];
  nextRank: typeof RANKS[0] | null;
  progressPercent: number;
};

const GamificationContext = createContext<GamificationType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [xp, setXp] = useState<number>(0);

  // Load XP on app start
  useEffect(() => {
    const loadXp = async () => {
      try {
        const savedXp = await AsyncStorage.getItem('user_xp');
        if (savedXp !== null) setXp(parseInt(savedXp));
      } catch (e) { console.error("Failed to load XP", e); }
    };
    loadXp();
  }, []);

  // Save XP whenever it changes
  useEffect(() => {
    AsyncStorage.setItem('user_xp', xp.toString()).catch(e => console.error("Failed to save XP", e));
  }, [xp]);

  // Give XP when they get an answer right!
  const addXp = (amount: number) => {
    setXp(prev => prev + amount);
  };

  const currentRankIndex = RANKS.map(r => r.minXp).reverse().findIndex(min => xp >= min);
  const actualIndex = currentRankIndex >= 0 ? RANKS.length - 1 - currentRankIndex : 0;
  
  const currentRank = RANKS[actualIndex];
  const nextRank = actualIndex < RANKS.length - 1 ? RANKS[actualIndex + 1] : null;

  let progressPercent = 100;
  if (nextRank) {
    const xpNeededForNext = nextRank.minXp - currentRank.minXp;
    const xpGainedInCurrentRank = xp - currentRank.minXp;
    progressPercent = (xpGainedInCurrentRank / xpNeededForNext) * 100;
  }

  return (
    <GamificationContext.Provider value={{ xp, addXp, currentRank, nextRank, progressPercent }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error("useGamification must be used within GamificationProvider");
  return context;
};