import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { colors } from './theme';

interface LoanData {
  principal: number;
  monthlyPayment: number;
  amountPaid: number;
  totalPayment: number;
  monthsRemaining: number;
  nextPaymentDate: number;
  progressPercent: number;
  autoDeductEnabled: boolean;
}

interface LoanCardProps {
  data: LoanData;
  onToggleAutoDeduct?: (enabled: boolean) => void;
  onViewSchedule?: () => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({ data, onToggleAutoDeduct, onViewSchedule }) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const [autoDeductEnabled, setAutoDeductEnabled] = useState(data.autoDeductEnabled);

  const handleToggleAutoDeduct = () => {
    const newState = !autoDeductEnabled;
    setAutoDeductEnabled(newState);
    onToggleAutoDeduct?.(newState);
  };

  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#f59e0b' }]}>
      <Text style={styles.title}>Van Loan</Text>

      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Principal</Text>
          <Text style={styles.value}>₹{data.principal.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Monthly payment</Text>
          <Text style={styles.value}>₹{data.monthlyPayment.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Amount paid</Text>
          <Text style={styles.progressAmount}>
            ₹{data.amountPaid.toLocaleString()} / ₹{data.totalPayment.toLocaleString()}
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(data.progressPercent, 100)}%` },
            ]}
          />
        </View>

        <Text style={styles.progressPercent}>{Math.round(data.progressPercent)}% complete</Text>
      </View>

      <View style={styles.nextPaymentSection}>
        <View style={styles.nextPaymentInfo}>
          <Text style={styles.label}>Next payment</Text>
          <Text style={styles.value}>{data.nextPaymentDate}th</Text>
        </View>
        <View style={styles.nextPaymentInfo}>
          <Text style={styles.label}>Years remaining</Text>
          <Text style={styles.value}>{data.monthsRemaining} months</Text>
        </View>
      </View>

      <View style={styles.autoDeductSection}>
        <Text style={styles.autoDeductLabel}>Auto-deduct on payment date</Text>
        <TouchableOpacity
          style={[
            styles.toggle,
            { backgroundColor: autoDeductEnabled ? '#22c55e' : colors.line },
          ]}
          onPress={handleToggleAutoDeduct}
        >
          <Text style={styles.toggleText}>{autoDeductEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => setShowSchedule(!showSchedule)}
        style={styles.expandButton}
      >
        <Text style={styles.expandButtonText}>
          {showSchedule ? 'Hide payment schedule' : 'View payment schedule'}
        </Text>
      </TouchableOpacity>

      {showSchedule && (
        <View style={styles.schedulePreview}>
          <Text style={styles.scheduleText}>Next 3 payments due:</Text>
          <Text style={styles.scheduleItem}>1. {data.nextPaymentDate}th: ₹{data.monthlyPayment.toLocaleString()}</Text>
          <Text style={styles.scheduleItem}>2. {((data.nextPaymentDate + 30) % 31) || 30}th: ₹{data.monthlyPayment.toLocaleString()}</Text>
          <Text style={styles.scheduleItem}>3. {((data.nextPaymentDate + 60) % 31) || 30}th: ₹{data.monthlyPayment.toLocaleString()}</Text>
        </View>
      )}
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
  loanDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: 13,
  },
  value: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    gap: 4,
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  progressAmount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  progressPercent: {
    color: colors.muted,
    fontSize: 12,
  },
  nextPaymentSection: {
    flexDirection: 'row',
    gap: 16,
  },
  nextPaymentInfo: {
    flex: 1,
    gap: 4,
  },
  autoDeductSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f8f6',
    padding: 12,
    borderRadius: 12,
  },
  autoDeductLabel: {
    color: colors.muted,
    fontSize: 13,
    flex: 1,
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleText: {
    color: colors.panel,
    fontSize: 11,
    fontWeight: '700',
  },
  expandButton: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  expandButtonText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '600',
  },
  schedulePreview: {
    backgroundColor: '#fefce8',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  scheduleText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleItem: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
