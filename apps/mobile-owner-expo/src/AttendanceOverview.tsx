import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from './api';

export function AttendanceOverview({ ownerId }: { ownerId: string }) {
  const [teamAttendance, setTeamAttendance] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/api/leaderboard/drivers?limit=50`).then((res) => {
      setTeamAttendance(res.data);
    });
  }, [ownerId]);

  const averageAttendance = teamAttendance.length > 0 ? Math.round(teamAttendance.reduce((sum, d) => sum + d.attendancePercentage, 0) / teamAttendance.length) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.title}>Team Attendance Overview</Text>
        <View style={styles.averageBox}>
          <Text style={styles.averagePercent}>{averageAttendance}%</Text>
          <Text style={styles.averageLabel}>Team Average</Text>
        </View>
        <Text style={styles.statsText}>
          {teamAttendance.filter((d) => d.attendancePercentage >= 95).length} drivers at 95%+ • {teamAttendance.length} total drivers
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attendance Breakdown</Text>
        {[95, 85, 75].map((threshold, idx) => {
          const count = teamAttendance.filter((d) => d.attendancePercentage >= threshold).length;
          const pct = Math.round((count / (teamAttendance.length || 1)) * 100);
          return (
            <View key={idx} style={styles.breakdownRow}>
              <Text>{threshold}%+ attendance</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text>{count} drivers</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Driver Rankings (by Attendance)</Text>
        {teamAttendance.sort((a, b) => b.attendancePercentage - a.attendancePercentage).slice(0, 5).map((driver, idx) => (
          <View key={driver.driverId} style={styles.driverRow}>
            <Text style={styles.rank}>{idx + 1}</Text>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.attendance}>{driver.attendancePercentage}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  averageBox: { alignItems: 'center', marginBottom: 12 },
  averagePercent: { fontSize: 48, fontWeight: 'bold', color: '#4CAF50' },
  averageLabel: { fontSize: 12, color: '#666' },
  statsText: { textAlign: 'center', fontSize: 12, color: '#666', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, marginHorizontal: 8 },
  progressFill: { height: 6, backgroundColor: '#4CAF50', borderRadius: 3 },
  driverRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rank: { width: 24, fontWeight: 'bold', color: '#1976D2' },
  driverName: { flex: 1, fontSize: 12 },
  attendance: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
});
