import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from './theme';

interface RouteEarning {
  routeName: string;
  amount: number;
}

interface EarningsData {
  totalToday: number;
  breakdown: RouteEarning[];
  trend: number;
  trendDirection: 'up' | 'down';
}

interface EarningsCardProps {
  data: EarningsData;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#3b82f6' }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Today's Earnings</Text>
          <View style={styles.bigNumber}>
            <Text style={styles.bigNumberText}>₹{data.totalToday.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.breakdownButton}
      >
        <Text style={styles.breakdownLabel}>
          {expanded ? 'Hide breakdown' : 'Show breakdown'}
        </Text>
        <Text style={styles.arrow}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.breakdown}>
          {data.breakdown.map((item, idx) => (
            <View key={idx} style={styles.breakdownItem}>
              <Text style={styles.routeName}>{item.routeName}</Text>
              <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.trendContainer}>
        <Text style={[styles.trend, { color: data.trendDirection === 'up' ? '#22c55e' : '#dc2626' }]}>
          {data.trendDirection === 'up' ? '↑' : '↓'} {Math.abs(data.trend) > 0 ? `${data.trendDirection === 'up' ? '+' : ''}₹${Math.abs(data.trend).toLocaleString()}` : 'No change'} vs yesterday
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
  header: {
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  bigNumber: {
    gap: 4,
  },
  bigNumberText: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: '700',
  },
  breakdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  arrow: {
    color: '#3b82f6',
    fontSize: 12,
  },
  breakdown: {
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeName: {
    color: colors.muted,
    fontSize: 14,
  },
  amount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  trendContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  trend: {
    fontSize: 13,
    fontWeight: '500',
  },
});
