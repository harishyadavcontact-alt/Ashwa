import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { colors } from './theme';

interface EarningByRoute {
  name: string;
  amount: number;
}

interface EarningsBreakdownScreenProps {
  thisMonthEarnings: number;
  routeEarnings: EarningByRoute[];
  referralEarnings: number;
  bonusEarnings: number;
  allTimeEarnings: number;
  trend?: { month: string; amount: number }[];
  onBack: () => void;
}

export function EarningsBreakdownScreen({
  thisMonthEarnings,
  routeEarnings,
  referralEarnings,
  bonusEarnings,
  allTimeEarnings,
  trend = [],
  onBack,
}: EarningsBreakdownScreenProps) {
  const [expandedTrend, setExpandedTrend] = useState(false);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleDark}>My Earnings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {/* This Month Summary */}
        <View style={styles.highlightCard}>
          <Text style={styles.highlightLabel}>This month</Text>
          <Text style={styles.highlightAmount}>{formatCurrency(thisMonthEarnings)}</Text>
        </View>

        {/* Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown</Text>

          {/* Routes */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Routes</Text>
              <Text style={styles.breakdownAmount}>{formatCurrency(routeEarnings.reduce((sum, r) => sum + r.amount, 0))}</Text>
            </View>
            {routeEarnings.map((route, idx) => (
              <Text key={idx} style={styles.breakdownDetail}>
                • {route.name}: {formatCurrency(route.amount)}
              </Text>
            ))}
          </View>

          {/* Referrals */}
          {referralEarnings > 0 && (
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Referrals</Text>
                <Text style={styles.breakdownAmount}>{formatCurrency(referralEarnings)}</Text>
              </View>
              <Text style={styles.breakdownDetail}>
                • From driver referrals (₹500/driver)
              </Text>
            </View>
          )}

          {/* Bonuses */}
          {bonusEarnings > 0 && (
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Bonuses</Text>
                <Text style={styles.breakdownAmount}>{formatCurrency(bonusEarnings)}</Text>
              </View>
              <Text style={styles.breakdownDetail}>
                • Substitute driver bonus, perfect attendance
              </Text>
            </View>
          )}
        </View>

        {/* All-Time Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All-time</Text>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total earned</Text>
            <Text style={styles.totalAmount}>{formatCurrency(allTimeEarnings)}</Text>
          </View>
        </View>

        {/* 6-Month Trend */}
        {trend.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.trendHeader}
              onPress={() => setExpandedTrend(!expandedTrend)}
            >
              <Text style={styles.sectionTitle}>6-month trend</Text>
              <Text style={styles.expandIcon}>{expandedTrend ? '−' : '+'}</Text>
            </TouchableOpacity>

            {expandedTrend && (
              <View style={styles.trendList}>
                {trend.map((item, idx) => (
                  <View key={idx} style={styles.trendRow}>
                    <Text style={styles.trendMonth}>{item.month}</Text>
                    <Text style={styles.trendAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backButton: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleDark: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  stack: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
  },
  highlightCard: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.accent + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  highlightLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  highlightAmount: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  breakdownCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownAmount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownDetail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  totalCard: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandIcon: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  trendList: {
    gap: 8,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  trendMonth: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  trendAmount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
