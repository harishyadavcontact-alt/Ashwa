import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from './theme';

interface TripStatusCardProps {
  schoolName: string;
  address: string;
  pickupTime: string;
  familiesOnBoard: number;
  totalCapacity: number;
  onArrivedPress: () => void;
}

export function TripStatusCard({
  schoolName,
  address,
  pickupTime,
  familiesOnBoard,
  totalCapacity,
  onArrivedPress,
}: TripStatusCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const [hours, minutes] = pickupTime.split(':').map(Number);
      const pickupDate = new Date();
      pickupDate.setHours(hours, minutes, 0);

      if (pickupDate < now) {
        pickupDate.setDate(pickupDate.getDate() + 1);
      }

      const diff = pickupDate.getTime() - now.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      if (diff > 0) {
        setTimeRemaining(`${mins}m ${secs}s`);
      } else {
        setTimeRemaining('NOW');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pickupTime]);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>NEXT PICKUP</Text>
        <Text style={styles.timeCountdown}>{timeRemaining}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.schoolName}>{schoolName}</Text>
        <Text style={styles.address}>{address}</Text>
        <Text style={styles.pickupTime}>Pickup at {pickupTime}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.familiesInfo}>
          <Text style={styles.familiesLabel}>Families on board</Text>
          <Text style={styles.familiesCount}>{familiesOnBoard}/{totalCapacity}</Text>
        </View>
        <TouchableOpacity
          style={styles.arrivedButton}
          onPress={onArrivedPress}
        >
          <Text style={styles.arrivedButtonText}>ARRIVED</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeCountdown: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  cardContent: {
    gap: 6,
  },
  schoolName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  address: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  pickupTime: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  familiesInfo: {
    gap: 4,
  },
  familiesLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  familiesCount: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  arrivedButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  arrivedButtonText: {
    color: colors.panel,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
