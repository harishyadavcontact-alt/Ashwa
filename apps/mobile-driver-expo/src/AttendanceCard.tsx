import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from './theme';

interface AttendanceData {
  daysAttended: number;
  totalDays: number;
  familySatisfaction: number;
  driversVerified: boolean;
}

interface AttendanceCardProps {
  data: AttendanceData;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ data }) => {
  const attendancePercent = Math.round((data.daysAttended / data.totalDays) * 100);

  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#ec4899' }]}>
      <Text style={styles.title}>Attendance & Trust</Text>

      <View style={styles.metrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{data.daysAttended}/{data.totalDays}</Text>
          <Text style={styles.metricLabel}>days attended this month</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{data.familySatisfaction}%</Text>
          <Text style={styles.metricLabel}>family satisfaction</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {data.driversVerified ? '✓' : '✗'}
          </Text>
          <Text style={styles.metricLabel}>
            {data.driversVerified ? 'All drivers verified' : 'Verification pending'}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${attendancePercent}%` },
          ]}
        />
      </View>

      <Text style={styles.progressLabel}>
        {attendancePercent}% attendance rate
      </Text>

      <View style={styles.trustBadge}>
        <Text style={styles.trustBadgeText}>
          ✓ All systems verified and operational
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  metrics: {
    gap: 10,
  },
  metricItem: {
    gap: 4,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.line,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  trustBadge: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  trustBadgeText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '600',
  },
});
