import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LinearGradient } from 'react-native';

interface NextLevelCardProps {
  currentLevel: number;
  nextLevel: number;
  nextTitle: string;
  nextBadge: string;
  milestone: string;
  progress: number; // 0-100
  daysRemaining?: number;
  familiesRemaining?: number;
  tripsRemaining?: number;
  onViewPath: () => void;
}

export function NextLevelCard({
  currentLevel,
  nextLevel,
  nextTitle,
  nextBadge,
  milestone,
  progress,
  daysRemaining,
  familiesRemaining,
  tripsRemaining,
  onViewPath,
}: NextLevelCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ffc72c', '#ffb300']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.levelLabel}>Level {currentLevel} → Level {nextLevel}</Text>
          <Text style={styles.nextBadge}>{nextBadge}</Text>
        </View>

        <Text style={styles.nextTitle}>{nextTitle}</Text>
        <Text style={styles.milestone}>{milestone}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}% complete</Text>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {daysRemaining && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{daysRemaining}</Text>
              <Text style={styles.statLabel}>days</Text>
            </View>
          )}
          {familiesRemaining && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{familiesRemaining}</Text>
              <Text style={styles.statLabel}>families</Text>
            </View>
          )}
          {tripsRemaining && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{tripsRemaining}</Text>
              <Text style={styles.statLabel}>trips</Text>
            </View>
          )}
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.button} onPress={onViewPath}>
          <Text style={styles.buttonText}>View Path to {nextTitle} 🚀</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    marginHorizontal: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    opacity: 0.8,
  },
  nextBadge: {
    fontSize: 28,
  },
  nextTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  milestone: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1b5e20',
  },
  progressText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#1b5e20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
