import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGamification } from '../context/GamificationContext';

export default function LevelProgressBar() {
  const { xp, currentRank, nextRank, progressPercent } = useGamification();

  return (
    <View style={styles.container}>
      <View style={styles.rowBetween}>
        <View style={[styles.rankBadge, { borderColor: currentRank.color + '40', backgroundColor: currentRank.color + '10' }]}>
          <Text style={[styles.rankText, { color: currentRank.color }]}>
            {currentRank.name}
          </Text>
        </View>
        <Text style={styles.xpText}>{xp.toLocaleString()} XP</Text>
      </View>

      <View style={styles.track}>
        <View 
          style={[
            styles.fill, 
            { width: `${Math.min(Math.max(progressPercent, 0), 100)}%`, backgroundColor: currentRank.color }
          ]} 
        />
      </View>

      {nextRank ? (
        <Text style={styles.footerText}>
          {nextRank.minXp - xp} XP to reach <Text style={{ fontWeight: '800', color: nextRank.color }}>{nextRank.name}</Text>
        </Text>
      ) : (
        <Text style={styles.footerText}>Max Rank Achieved! 🏆</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rankBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  rankText: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  xpText: { fontSize: 18, fontWeight: '800', color: '#111827' },
  track: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  fill: { height: '100%', borderRadius: 4 },
  footerText: { fontSize: 12, color: '#64748b', fontWeight: '500', textAlign: 'right' },
});