import React, { useEffect, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NotificationBannerProps {
  type: 'trip-start' | 'arrived' | 'boarded' | 'school-arrival' | 'trip-complete';
  driverName: string;
  childName: string;
  schoolName?: string;
  eta?: number;
  arrivalTime?: string;
  duration?: string;
  distance?: string;
  onDismiss: () => void;
  onAction?: () => void;
}

const NOTIFICATION_CONFIG = {
  'trip-start': {
    emoji: '✓',
    headline: 'Trip Started',
    color: '#10b981',
    actionLabel: '📍 View',
  },
  'arrived': {
    emoji: '🚗',
    headline: 'Driver Arrived!',
    color: '#3b82f6',
    actionLabel: '📞 Call',
  },
  'boarded': {
    emoji: '✓',
    headline: 'Child Boarded',
    color: '#10b981',
    actionLabel: '🗺️ Track',
  },
  'school-arrival': {
    emoji: '🎉',
    headline: 'Dropped at School!',
    color: '#f59e0b',
    actionLabel: '⭐ Rate',
  },
  'trip-complete': {
    emoji: '✓',
    headline: 'Trip Complete',
    color: '#10b981',
    actionLabel: 'View Details',
  },
};

export function NotificationBanner({
  type,
  driverName,
  childName,
  schoolName,
  eta,
  arrivalTime,
  duration,
  distance,
  onDismiss,
  onAction,
}: NotificationBannerProps) {
  const [slideAnim] = useState(new Animated.Value(-100));
  const config = NOTIFICATION_CONFIG[type];

  useEffect(() => {
    // Slide in from top
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, 6000);

    return () => clearTimeout(timer);
  }, [slideAnim, onDismiss]);

  const getSubtext = () => {
    switch (type) {
      case 'trip-start':
        return `${driverName} started your trip to ${schoolName}\nETA: ${eta} min`;
      case 'arrived':
        return `${driverName} is ${eta} min away`;
      case 'boarded':
        return `On the way to ${schoolName}`;
      case 'school-arrival':
        return `${childName} arrived safely at ${schoolName}\nArrival time: ${arrivalTime}`;
      case 'trip-complete':
        return `${childName} back home safely\nDuration: ${duration} | Distance: ${distance}`;
      default:
        return '';
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.banner, { borderLeftColor: config.color }]}>
        <View style={styles.content}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.headline}>{config.headline}</Text>
            <Text style={styles.subtext}>{getSubtext()}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: config.color }]}
          onPress={() => {
            onAction?.();
            Animated.timing(slideAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            }).start(() => onDismiss());
          }}
        >
          <Text style={styles.actionLabel}>{config.actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  banner: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 28,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  headline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
