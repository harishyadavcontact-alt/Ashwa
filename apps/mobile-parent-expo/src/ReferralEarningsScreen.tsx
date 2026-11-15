import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { colors } from './theme';

interface ReferralEarningsScreenProps {
  totalEarned: number;
  familiesJoined: number;
  invitesSent: number;
  potentialEarnings: number;
  onBack: () => void;
}

export function ReferralEarningsScreen({
  totalEarned,
  familiesJoined,
  invitesSent,
  potentialEarnings,
  onBack,
}: ReferralEarningsScreenProps) {
  const [expandedStats, setExpandedStats] = useState(false);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleDark}>Referral Earnings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {/* Main Earnings Card */}
        <View style={styles.highlightCard}>
          <Text style={styles.highlightLabel}>Total earned</Text>
          <Text style={styles.highlightAmount}>{formatCurrency(totalEarned)}</Text>
          <Text style={styles.highlightDetail}>from {familiesJoined} families</Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{invitesSent}</Text>
            <Text style={styles.statLabel}>Invites sent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{familiesJoined}</Text>
            <Text style={styles.statLabel}>Families joined</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(potentialEarnings)}</Text>
            <Text style={styles.statLabel}>Potential pending</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How referrals work</Text>
          <View style={styles.card}>
            <Text style={styles.cardStep}>1. Share your code with friends</Text>
            <Text style={styles.cardStep}>2. They sign up using your code</Text>
            <Text style={styles.cardStep}>3. Get ₹200 when their family completes first trip</Text>
            <Text style={styles.cardStep}>4. Bonus unlocks: Earn extra for active referrals</Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpandedStats(!expandedStats)}
        >
          <Text style={styles.expandButtonText}>
            {expandedStats ? '− Hide' : '+ Show'} detailed breakdown
          </Text>
        </TouchableOpacity>

        {expandedStats && (
          <View style={styles.section}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invites sent</Text>
              <Text style={styles.detailValue}>{invitesSent}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Signed up</Text>
              <Text style={styles.detailValue}>{familiesJoined}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Conversion rate</Text>
              <Text style={styles.detailValue}>
                {invitesSent > 0 ? ((familiesJoined / invitesSent) * 100).toFixed(0) : 0}%
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Average per family</Text>
              <Text style={styles.detailValue}>
                {familiesJoined > 0 ? formatCurrency(totalEarned / familiesJoined) : '₹0'}
              </Text>
            </View>
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
    marginBottom: 4,
  },
  highlightDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  cardStep: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  expandButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.accent + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  expandButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
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
  detailLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  spacer: {
    height: 20,
  },
});
