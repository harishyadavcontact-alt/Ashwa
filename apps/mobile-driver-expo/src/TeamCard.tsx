import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { colors } from './theme';

interface TeamMember {
  name: string;
  monthlyPay: number;
  earnedToday: number;
  paymentDate: number;
}

interface TeamData {
  members: TeamMember[];
  totalPayroll: number;
  nextPayoutDays: number;
}

interface TeamCardProps {
  data: TeamData;
  onPayEarly?: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ data, onPayEarly }) => {
  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#a855f7' }]}>
      <Text style={styles.title}>My Team</Text>
      <Text style={styles.subtitle}>{data.members.length} hired drivers</Text>

      <View style={styles.membersList}>
        {data.members.map((member, idx) => (
          <View key={idx} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberDetails}>
                ₹{member.monthlyPay.toLocaleString()}/month | ₹{member.earnedToday.toLocaleString()} today
              </Text>
              <Text style={styles.memberPayment}>✓ Paid on {member.paymentDate}th</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.payrollSummary}>
        <Text style={styles.payrollLabel}>Total payroll scheduled</Text>
        <Text style={styles.payrollAmount}>₹{data.totalPayroll.toLocaleString()}/month</Text>
        <Text style={styles.nextPayment}>Next payout: {data.nextPayoutDays} days</Text>
      </View>

      {onPayEarly && (
        <View style={styles.buttonContainer}>
          <Button title="PAY EARLY" onPress={onPayEarly} color="#22c55e" />
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
  subtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    borderLeftWidth: 2,
    borderLeftColor: '#a855f7',
    paddingLeft: 12,
    paddingVertical: 8,
  },
  memberInfo: {
    gap: 4,
  },
  memberName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  memberDetails: {
    color: colors.muted,
    fontSize: 13,
  },
  memberPayment: {
    color: '#22c55e',
    fontSize: 12,
  },
  payrollSummary: {
    backgroundColor: '#f9f8f6',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  payrollLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  payrollAmount: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  nextPayment: {
    color: colors.muted,
    fontSize: 12,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
