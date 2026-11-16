import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface SharedRide {
  id: string;
  driverId: string;
  costPerFamily: number;
  families: string[];
  status: 'available' | 'in_progress' | 'completed';
  pickups: { parentPhone: string; childName: string; address?: string }[];
  drops: { school: string }[];
}

export default function SharedRidesScreen({ parentPhone, childName, onBack }: any) {
  const [rides, setRides] = useState<SharedRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch available rides from API
    // For now, show dummy rides
    const dummyRides: SharedRide[] = [
      {
        id: 'RIDE-ABC123',
        driverId: 'DRV-001',
        costPerFamily: 1500,
        families: ['9876543210', '9876543211'],
        status: 'available',
        pickups: [
          { parentPhone: '9876543210', childName: 'Arjun', address: 'Sector 5' },
          { parentPhone: '9876543211', childName: 'Priya', address: 'Sector 6' },
        ],
        drops: [{ school: 'Delhi Public School' }],
      },
      {
        id: 'RIDE-DEF456',
        driverId: 'DRV-002',
        costPerFamily: 1200,
        families: ['9876543212'],
        status: 'available',
        pickups: [{ parentPhone: '9876543212', childName: 'Rahul', address: 'Sector 7' }],
        drops: [
          { school: 'St Columba' },
          { school: 'Sunbeam School' },
        ],
      },
    ];
    setRides(dummyRides);
    setLoading(false);
  }, []);

  const handleJoinRide = async (rideId: string, costPerFamily: number) => {
    try {
      // TODO: Call API to join ride
      // For now, just show alert
      Alert.alert('Join Shared Ride', `Join for ₹${costPerFamily}/trip?\n\nYou save 40% vs solo fare!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to join ride');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading shared rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shared Rides</Text>
        <Text style={styles.subtitle}>Save up to 40% on pickup costs</Text>
      </View>

      <ScrollView style={styles.content}>
        {rides.length === 0 ? (
          <Text style={styles.empty}>No shared rides available right now</Text>
        ) : (
          rides.map((ride) => (
            <View key={ride.id} style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <Text style={styles.rideId}>Ride {ride.id.substring(5)}</Text>
                <Text style={styles.status}>{ride.families.length} families</Text>
              </View>

              <View style={styles.pickupDropList}>
                <Text style={styles.label}>Pickups:</Text>
                {ride.pickups.map((p, idx) => (
                  <Text key={idx} style={styles.item}>
                    • {p.childName} ({p.address || 'Address'})
                  </Text>
                ))}

                <Text style={styles.label} onPress={() => {}}>
                  Drops:
                </Text>
                {ride.drops.map((d, idx) => (
                  <Text key={idx} style={styles.item}>
                    • {d.school}
                  </Text>
                ))}
              </View>

              <View style={styles.costSection}>
                <View>
                  <Text style={styles.costLabel}>Cost per family</Text>
                  <Text style={styles.costAmount}>₹{ride.costPerFamily}</Text>
                </View>
                <View>
                  <Text style={styles.savingLabel}>You save</Text>
                  <Text style={styles.savingAmount}>₹{Math.round(ride.costPerFamily * 0.4)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinRide(ride.id, ride.costPerFamily)}
              >
                <Text style={styles.joinButtonText}>Join Ride</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    fontSize: 16,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc72c',
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rideId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pickupDropList: {
    marginVertical: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  item: {
    fontSize: 13,
    color: '#333',
    paddingLeft: 8,
    lineHeight: 20,
  },
  costSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginVertical: 12,
  },
  costLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  costAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  savingLabel: {
    fontSize: 12,
    color: '#4caf50',
    marginBottom: 4,
  },
  savingAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  joinButton: {
    backgroundColor: '#ffc72c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  joinButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
});
