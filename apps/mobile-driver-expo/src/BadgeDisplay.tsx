import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Badge {
  id: string;
  emoji: string;
  label: string;
  earned: boolean;
}

interface BadgeDisplayProps {
  badges: Badge[];
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  const earnedBadges = badges.filter((b) => b.earned);

  if (earnedBadges.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Badges</Text>
      <View style={styles.badgesRow}>
        {earnedBadges.map((badge) => (
          <View key={badge.id} style={styles.badge}>
            <Text style={styles.emoji}>{badge.emoji}</Text>
            <Text style={styles.badgeLabel}>{badge.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e8f5e9',
    borderColor: '#1b5e20',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1b5e20',
  },
});
