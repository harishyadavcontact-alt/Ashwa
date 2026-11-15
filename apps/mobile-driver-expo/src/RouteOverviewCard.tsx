import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from './theme';

interface RouteOverviewData {
  activeRoutes: number;
  familiesServed: number;
  monthlyRevenue: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface RouteOverviewCardProps {
  data: RouteOverviewData;
}

export const RouteOverviewCard: React.FC<RouteOverviewCardProps> = ({ data }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#dc2626';
      default: return '#22c55e';
    }
  };

  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#14b8a6' }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Overview</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>✓ All healthy</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.metric}>✓ {data.activeRoutes} routes active</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.metric}>📊 {data.familiesServed} families</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.metric}>💰 ₹{data.monthlyRevenue.toLocaleString()}/month (realized)</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: colors.panel,
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    gap: 10,
  },
  gridItem: {
    paddingVertical: 8,
  },
  metric: {
    color: colors.muted,
    fontSize: 14,
  },
});
