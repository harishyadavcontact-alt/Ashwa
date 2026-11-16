import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface SharedRideTrip {
  id: string;
  pickups: { childName: string; parentPhone: string; address?: string; status?: 'pending' | 'picked' }[];
  drops: { school: string; childrenCount?: number; status?: 'pending' | 'dropped' }[];
  totalEarnings: number;
  familiesServed: number;
}

export default function SharedRideTripScreen({ trip, onStart, onComplete, onBack }: any) {
  const [tripStarted, setTripStarted] = useState(false);

  const handleStartTrip = () => {
    Alert.alert('Start Trip?', `Begin shared ride with ${trip.familiesServed} families?`, [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Start',
        onPress: () => {
          setTripStarted(true);
          onStart?.();
        },
      },
    ]);
  };

  const handleCompleteTrip = () => {
    Alert.alert('Complete Trip?', `Earned ₹${trip.totalEarnings}`, [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          onComplete?.();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shared Ride Trip</Text>
        <Text style={styles.subtitle}>{trip.familiesServed} families • ₹{trip.totalEarnings}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* PICKUPS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Pickup Sequence</Text>
          {trip.pickups.map((pickup, idx) => (
            <View key={idx} style={styles.stepCard}>
              <View style={[styles.stepNumber, { backgroundColor: pickup.status === 'picked' ? '#4caf50' : '#ddd' }]}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{pickup.childName}</Text>
                <Text style={styles.stepSubtitle}>{pickup.address || 'Pick up location'}</Text>
                <Text style={styles.stepPhone}>{pickup.parentPhone}</Text>
                {pickup.status === 'picked' && <Text style={styles.pickedLabel}>✓ Picked</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* DROPS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏫 Drop Sequence</Text>
          {trip.drops.map((drop, idx) => (
            <View key={idx} style={styles.stepCard}>
              <View style={[styles.stepNumber, { backgroundColor: drop.status === 'dropped' ? '#4caf50' : '#1a73e8' }]}>
                <Text style={styles.stepNumberText}>D{idx + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{drop.school}</Text>
                <Text style={styles.stepSubtitle}>{drop.childrenCount || 0} children</Text>
                {drop.status === 'dropped' && <Text style={styles.droppedLabel}>✓ Dropped</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* EARNINGS */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Total Earnings Today</Text>
          <Text style={styles.earningsAmount}>₹{trip.totalEarnings}</Text>
          <Text style={styles.earningsNote}>Shared ride with {trip.familiesServed} families</Text>
        </View>
      </ScrollView>

      {/* ACTION BUTTON */}
      <View style={styles.actionBar}>
        {!tripStarted ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartTrip}>
            <Text style={styles.buttonText}>▶ START TRIP</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteTrip}>
            <Text style={styles.buttonText}>✓ COMPLETE TRIP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    color: '#0066cc',
    fontSize: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  stepPhone: {
    fontSize: 12,
    color: '#999',
  },
  pickedLabel: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 6,
  },
  droppedLabel: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 6,
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 80,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  earningsTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 8,
  },
  earningsNote: {
    fontSize: 12,
    color: '#999',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  startButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
