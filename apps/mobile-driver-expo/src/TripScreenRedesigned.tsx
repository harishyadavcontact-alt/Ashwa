import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';

interface Stop {
  id: string;
  name: string;
  status: 'pending' | 'arrived' | 'boarded' | 'completed';
  pickupTime: string;
  families: number;
}

export function TripScreenRedesigned() {
  const [currentStop, setCurrentStop] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [tripActive, setTripActive] = useState(false);

  const stops: Stop[] = [
    { id: '1', name: 'Whitefield Pickup', status: 'pending', pickupTime: '7:45 AM', families: 3 },
    { id: '2', name: 'Indiranagar Pickup', status: 'pending', pickupTime: '8:05 AM', families: 2 },
    { id: '3', name: "St. Xavier's School", status: 'pending', pickupTime: '8:30 AM', families: 5 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: Trip Status + Earnings */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Today's Earnings</Text>
          <Text style={styles.earnings}>₹{earnings}</Text>
        </View>
        <View>
          <Text style={styles.headerLabel}>Trip Status</Text>
          <Text style={[styles.status, { color: tripActive ? '#4CAF50' : '#FF9800' }]}>
            {tripActive ? '🟢 Active' : '⏸ Ready'}
          </Text>
        </View>
      </View>

      {/* Next Action: BIG AND OBVIOUS */}
      <View style={styles.nextActionBox}>
        <Text style={styles.nextActionLabel}>NEXT ACTION</Text>
        {tripActive ? (
          <>
            <Text style={styles.nextActionText}>
              👉 GO TO{'\n'}
              <Text style={styles.locationBold}>{stops[currentStop].name}</Text>
            </Text>
            <Text style={styles.distanceText}>~{(currentStop + 1) * 2} km away</Text>
          </>
        ) : (
          <>
            <Text style={styles.nextActionText}>Ready to operate</Text>
            <Text style={styles.distanceText}>{stops.length} stops, 15 families</Text>
          </>
        )}
      </View>

      {/* Trip Progress Timeline */}
      <ScrollView style={styles.timeline} horizontal showsHorizontalScrollIndicator={false}>
        {stops.map((stop, index) => (
          <View key={stop.id} style={styles.timelineStop}>
            {/* Circle */}
            <View
              style={[
                styles.stopCircle,
                index === currentStop && styles.stopCircleActive,
                stop.status === 'completed' && styles.stopCircleCompleted,
              ]}
            >
              <Text style={styles.stopCircleText}>
                {stop.status === 'completed' ? '✓' : index + 1}
              </Text>
            </View>

            {/* Stop info */}
            <Text style={[styles.stopTime, index === currentStop && styles.stopTimeActive]}>
              {stop.pickupTime}
            </Text>
            <Text
              style={[
                styles.stopNameTimeline,
                index === currentStop && styles.stopNameTimelineActive,
              ]}
              numberOfLines={2}
            >
              {stop.name}
            </Text>
            <Text style={styles.familiesCount}>{stop.families} families</Text>

            {/* Connector line */}
            {index < stops.length - 1 && <View style={styles.connector} />}
          </View>
        ))}
      </ScrollView>

      {/* Action Buttons - Clean and Big */}
      <View style={styles.actionButtonsContainer}>
        {!tripActive ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setTripActive(true);
              setEarnings(0);
            }}
          >
            <Text style={styles.primaryButtonText}>▶ START TRIP</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Main action: ARRIVED button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setEarnings(earnings + 100);
                if (currentStop < stops.length - 1) {
                  setCurrentStop(currentStop + 1);
                }
              }}
            >
              <Text style={styles.primaryButtonText}>✓ ARRIVED AT PICKUP</Text>
            </TouchableOpacity>

            {/* Secondary actions (compact) */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>📞 CALL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>⏸ PAUSE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>⋮ MORE</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Bottom: Current stop details */}
      {tripActive && (
        <View style={styles.currentStopDetails}>
          <Text style={styles.detailLabel}>Current Stop</Text>
          <Text style={styles.detailName}>{stops[currentStop].name}</Text>
          <Text style={styles.detailFamilies}>
            {stops[currentStop].families} families waiting
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  headerLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  earnings: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginTop: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  nextActionBox: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#1b5e20',
  },
  nextActionLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  nextActionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 8,
  },
  locationBold: {
    fontSize: 24,
    color: '#1b5e20',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  timeline: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  timelineStop: {
    marginRight: 20,
    alignItems: 'center',
    width: 90,
  },
  stopCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  stopCircleActive: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  stopCircleCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stopCircleText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
  },
  stopTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  stopTimeActive: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  stopNameTimeline: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  stopNameTimelineActive: {
    fontWeight: 'bold',
    color: '#000',
  },
  familiesCount: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  connector: {
    width: 2,
    height: 30,
    backgroundColor: '#ddd',
    marginTop: 4,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1b5e20',
    paddingVertical: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  currentStopDetails: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  detailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 4,
  },
  detailFamilies: {
    fontSize: 12,
    color: '#666',
  },
});
