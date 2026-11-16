import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { api } from './api';

export function LeaderboardScreen({ currentDriverId }: { currentDriverId: string }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentRank, setCurrentRank] = useState<any>(null);

  useEffect(() => {
    api.get('/api/leaderboard/drivers?limit=10').then((res) => {
      const entries = res.data;
      setLeaderboard(entries);
      const myRank = entries.find((e: any) => e.driverId === currentDriverId);
      setCurrentRank(myRank);
    });
  }, [currentDriverId]);

  return (
    <ScrollView style={styles.container}>
      {currentRank && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>Your Rank</Text>
          <Text style={styles.myRankNumber}>#{currentRank.rank}</Text>
          <Text style={styles.myNextMilestone}>Next: {currentRank.rank > 1 ? currentRank.familiesServed + 2 + ' families' : 'Top driver!'}</Text>
        </View>
      )}

      <FlatList
        scrollEnabled={false}
        data={leaderboard}
        keyExtractor={(item) => item.driverId}
        renderItem={({ item, index }) => (
          <View style={[styles.leaderboardRow, item.driverId === currentDriverId && styles.currentDriverRow]}>
            <Text style={styles.rank}>#{item.rank}</Text>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{item.name}</Text>
              <Text style={styles.driverStats}>
                {item.familiesServed} families • {item.attendancePercentage}% attendance
              </Text>
            </View>
            <View style={styles.earnings}>
              <Text style={styles.earningsAmount}>₹{(item.totalEarnings / 1000).toFixed(0)}k</Text>
              <Text style={styles.rating}>⭐ {item.rating}</Text>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  myRankCard: { backgroundColor: '#FFD700', borderRadius: 12, padding: 20, marginBottom: 20, alignItems: 'center' },
  myRankLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  myRankNumber: { fontSize: 56, fontWeight: 'bold', color: '#333' },
  myNextMilestone: { fontSize: 12, color: '#555', marginTop: 4 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  currentDriverRow: { backgroundColor: '#E3F2FD', borderLeftWidth: 4, borderLeftColor: '#1976D2' },
  rank: { fontSize: 18, fontWeight: 'bold', width: 40, color: '#1976D2' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 14, fontWeight: '600' },
  driverStats: { fontSize: 12, color: '#666', marginTop: 2 },
  earnings: { alignItems: 'flex-end' },
  earningsAmount: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
  rating: { fontSize: 12, marginTop: 2 },
});
