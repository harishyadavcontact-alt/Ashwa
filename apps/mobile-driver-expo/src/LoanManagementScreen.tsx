import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Switch,
} from 'react-native';
import { colors } from './theme';

interface LoanPaymentScheduleItem {
  dueDate: string;
  amount: number;
  status: 'PENDING' | 'PAID';
}

interface LoanManagementScreenProps {
  loanStatus: 'ACTIVE' | 'PENDING' | 'PAID_OFF';
  principal: number;
  monthlyPayment: number;
  interestRate?: number;
  remaining: number;
  nextDueDate: string;
  autoDeductEnabled?: boolean;
  schedule: LoanPaymentScheduleItem[];
  onToggleAutoDeduct: (enabled: boolean) => void;
  onPayEarly: () => void;
  onBack: () => void;
}

export function LoanManagementScreen({
  loanStatus,
  principal,
  monthlyPayment,
  interestRate = 0,
  remaining,
  nextDueDate,
  autoDeductEnabled = true,
  schedule,
  onToggleAutoDeduct,
  onPayEarly,
  onBack,
}: LoanManagementScreenProps) {
  const [expandedSchedule, setExpandedSchedule] = useState(false);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const progressPercentage = ((principal - remaining) / principal) * 100;

  const statusColor = {
    ACTIVE: colors.accent,
    PENDING: '#f97316',
    PAID_OFF: '#16a34a',
  }[loanStatus];

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleDark}>Loan Status</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {loanStatus === 'ACTIVE' ? 'Active loan'
              : loanStatus === 'PENDING' ? 'Pending approval'
              : 'Paid off ✓'}
          </Text>
        </View>

        {loanStatus !== 'PAID_OFF' && (
          <>
            {/* Loan Details */}
            <View style={styles.section}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Principal</Text>
                <Text style={styles.detailValue}>{formatCurrency(principal)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monthly payment</Text>
                <Text style={styles.detailValue}>{formatCurrency(monthlyPayment)}</Text>
              </View>
              {interestRate > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Interest</Text>
                  <Text style={styles.detailValue}>{interestRate}% p.a.</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remaining</Text>
                <Text style={styles.detailValue}>{formatCurrency(remaining)}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercentage}%`, backgroundColor: colors.accent },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {progressPercentage.toFixed(0)}% paid
              </Text>
            </View>

            {/* Next Due */}
            <View style={styles.dueCard}>
              <Text style={styles.dueLabel}>Next payment due</Text>
              <Text style={styles.dueDate}>{nextDueDate}</Text>
            </View>

            {/* Auto-Deduct Toggle */}
            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Auto-deduct from earnings</Text>
                <Switch
                  value={autoDeductEnabled}
                  onValueChange={onToggleAutoDeduct}
                  trackColor={{ false: colors.line, true: colors.accent }}
                  thumbColor={autoDeductEnabled ? colors.accent : colors.muted}
                />
              </View>
              <Text style={styles.toggleHint}>
                {autoDeductEnabled
                  ? 'Payment will be automatically deducted from your earnings'
                  : 'Manual payment required by due date'}
              </Text>
            </View>

            {/* Pay Early Button */}
            <TouchableOpacity
              style={styles.payEarlyButton}
              onPress={onPayEarly}
              activeOpacity={0.8}
            >
              <Text style={styles.payEarlyButtonText}>Pay early</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Amortization Schedule */}
        {schedule.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.scheduleHeader}
              onPress={() => setExpandedSchedule(!expandedSchedule)}
            >
              <Text style={styles.scheduleTitle}>Payment schedule (next 12 months)</Text>
              <Text style={styles.expandIcon}>{expandedSchedule ? '−' : '+'}</Text>
            </TouchableOpacity>

            {expandedSchedule && (
              <View style={styles.scheduleList}>
                {schedule.slice(0, 12).map((item, idx) => (
                  <View key={idx} style={styles.scheduleRow}>
                    <Text style={styles.scheduleDate}>{item.dueDate}</Text>
                    <Text style={styles.scheduleAmount}>{formatCurrency(item.amount)}</Text>
                    <Text style={[
                      styles.scheduleStatus,
                      { color: item.status === 'PAID' ? '#16a34a' : colors.muted }
                    ]}>
                      {item.status === 'PAID' ? '✓' : ''}
                    </Text>
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
    gap: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  dueCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.accent + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  dueLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  dueDate: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  toggleHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  payEarlyButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
  },
  payEarlyButtonText: {
    color: colors.panel,
    fontSize: 16,
    fontWeight: '700',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scheduleTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  expandIcon: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  scheduleList: {
    gap: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  scheduleDate: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  scheduleAmount: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  scheduleStatus: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  spacer: {
    height: 20,
  },
});
