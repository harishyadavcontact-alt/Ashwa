import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface LevelUpProps {
  level: number;
  title: string;
  badge: string;
  unlockedFeature: string;
  onContinue: () => void;
}

export function LevelUpScreen({ level, title, badge, unlockedFeature, onContinue }: LevelUpProps) {
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    // Celebration animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.celebration,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text style={styles.confetti}>🎉</Text>
        <Text style={styles.badge}>{badge}</Text>
        <Text style={styles.confetti}>🎉</Text>
      </Animated.View>

      <Text style={styles.levelUp}>LEVEL UP!</Text>
      <Text style={styles.levelNum}>Level {level}</Text>
      <Text style={styles.levelTitle}>{title}</Text>

      <View style={styles.featureBox}>
        <Text style={styles.featureLabel}>✨ You Unlocked:</Text>
        <Text style={styles.featureText}>{unlockedFeature}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Continue 🚀</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b5e20',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  celebration: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  confetti: {
    fontSize: 48,
  },
  badge: {
    fontSize: 80,
  },
  levelUp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffc72c',
    marginBottom: 8,
    textAlign: 'center',
  },
  levelNum: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
  },
  featureBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 32,
    borderColor: '#ffc72c',
    borderWidth: 2,
    width: '100%',
  },
  featureLabel: {
    fontSize: 12,
    color: '#ffc72c',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#ffc72c',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: '#1b5e20',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
