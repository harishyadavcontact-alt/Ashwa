import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';

interface DriverLevel {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  badge: string;
  description: string;
  unlocked: boolean;
  progress: number; // 0-100
  nextMilestone: string;
}

export function LevelProgressionScreen() {
  const [currentLevel, setCurrentLevel] = useState<DriverLevel>({
    level: 1,
    title: 'Driver',
    badge: '🚗',
    description: 'Run trips, earn money, see earnings',
    unlocked: true,
    progress: 45,
    nextMilestone: 'Complete 1 trip',
  });

  const levels: DriverLevel[] = [
    {
      level: 1,
      title: 'Driver',
      badge: '🚗',
      description: 'Run trips, earn money, see earnings',
      unlocked: true,
      progress: 100,
      nextMilestone: 'Completed',
    },
    {
      level: 2,
      title: 'Verified Driver',
      badge: '✓',
      description: 'Unlock loan eligibility',
      unlocked: true,
      progress: 80,
      nextMilestone: 'Complete 1 more trip',
    },
    {
      level: 3,
      title: 'Owner Ready',
      badge: '💰',
      description: 'Loan eligibility active',
      unlocked: false,
      progress: 25,
      nextMilestone: 'Serve 50 families (12/50)',
    },
    {
      level: 4,
      title: 'Van Owner',
      badge: '🚗',
      description: 'Add vans, hire drivers, build routes',
      unlocked: false,
      progress: 0,
      nextMilestone: 'Approve loan + documents',
    },
    {
      level: 5,
      title: 'Fleet Operator',
      badge: '👥',
      description: 'Manage multiple routes, see team earnings',
      unlocked: false,
      progress: 0,
      nextMilestone: 'Add 2nd van + hire driver',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleDark}>Your Progress</Text>
        <Text style={styles.bodyDark}>Level up to unlock new features</Text>
      </View>

      {/* Current Level Card */}
      <View style={styles.currentLevelCard}>
        <Text style={styles.levelBadge}>{currentLevel.badge}</Text>
        <Text style={styles.levelTitle}>Level {currentLevel.level}</Text>
        <Text style={styles.levelName}>{currentLevel.title}</Text>
        <Text style={styles.levelDesc}>{currentLevel.description}</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${currentLevel.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{currentLevel.progress}% to next level</Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>📊 {currentLevel.nextMilestone}</Text>
        </TouchableOpacity>
      </View>

      {/* Level Roadmap */}
      <View style={styles.roadmapCard}>
        <Text style={styles.roadmapTitle}>Your Path to Fleet</Text>
        {levels.map((level, idx) => (
          <View key={level.level} style={styles.levelRow}>
            <View style={[styles.levelCircle, level.unlocked ? styles.unlocked : styles.locked]}>
              <Text style={styles.levelNumber}>{level.badge}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelLabel, level.unlocked ? styles.activeLabel : styles.inactiveLabel]}>
                Level {level.level} • {level.title}
              </Text>
              <Text style={styles.levelSubtext}>{level.nextMilestone}</Text>
            </View>
            {level.unlocked && <Text style={styles.checkmark}>✓</Text>}
          </View>
        ))}
      </View>

      {/* Earnings Impact */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsTitle}>💰 Earnings Potential</Text>
        <View style={styles.earningsRow}>
          <Text>Level 1: ₹500/day (1 van)</Text>
          <Text style={styles.earnAmount}>₹500</Text>
        </View>
        <View style={styles.earningsRow}>
          <Text>Level 3: ₹2,000/day (loan active)</Text>
          <Text style={styles.earnAmount}>₹2,000</Text>
        </View>
        <View style={styles.earningsRow}>
          <Text>Level 5: ₹5,000/day (team earnings)</Text>
          <Text style={styles.earnAmount}>₹5,000</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  titleDark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  bodyDark: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  currentLevelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffc72c',
  },
  levelBadge: {
    fontSize: 48,
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  levelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  levelDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1b5e20',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1b5e20',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roadmapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  roadmapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  levelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  unlocked: {
    backgroundColor: '#e8f5e9',
    borderColor: '#1b5e20',
  },
  locked: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  levelNumber: {
    fontSize: 24,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeLabel: {
    color: '#1b5e20',
  },
  inactiveLabel: {
    color: '#999',
  },
  levelSubtext: {
    fontSize: 12,
    color: '#666',
  },
  checkmark: {
    fontSize: 20,
    color: '#1b5e20',
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  earnAmount: {
    fontWeight: 'bold',
    color: '#1b5e20',
  },
});
