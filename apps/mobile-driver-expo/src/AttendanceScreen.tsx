import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from './api';

export function AttendanceScreen({ driverId }: { driverId: string }) {
  const [attendance, setAttendance] = useState<any>(null);

  useEffect(() => {
    api.get(`/api/attendance/${driverId}`).then((res) => {
      setAttendance(res.data);
    });
  }, [driverId]);

  if (!attendance) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>This Month Attendance</Text>
        <View style={styles.percentageBox}>
          <Text style={styles.percentage}>{attendance.thisMonthPercentage}%</Text>
          <Text style={styles.label}>Attended</Text>
        </View>
        <Text style={[styles.trendText, { color: attendance.trend === 1 ? '#4CAF50' : attendance.trend === 0 ? '#FF9800' : '#F44336' }]}>
          {attendance.trend === 1 ? '↑ Excellent' : attendance.trend === 0 ? '→ Acceptable' : '↓ Needs improvement'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Last 30 Days</Text>
        {attendance.records.slice(0, 10).map((record: any) => (
          <View key={record.id} style={styles.recordRow}>
            <Text>{record.date}</Text>
            <Text>{record.attended ? '✓' : '✗'}</Text>
            <Text>{record.tripsCompleted} trips, {record.onTimePercentage}% on-time</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  percentageBox: { alignItems: 'center', marginBottom: 12 },
  percentage: { fontSize: 48, fontWeight: 'bold', color: '#1976D2' },
  label: { fontSize: 12, color: '#666' },
  trendText: { textAlign: 'center', fontWeight: '600' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
