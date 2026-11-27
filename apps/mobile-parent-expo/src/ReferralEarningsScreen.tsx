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
        <Text style={styles.titleDark}>Your Earnings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {/* GOLDEN RATIO: Main Earnings (70% visual weight) */}
        <View style={styles.premiumEarningsCard}>
          <Text style={styles.earningsLabel}>THIS MONTH</Text>
          <Text style={styles.largeAmount}>{formatCurrency(totalEarned)}</Text>
          <View style={styles.earningsBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>This Month</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(totalEarned)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Next Month (Pending)</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(potentialEarnings)}</Text>
            </View>
            <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#1e3a8a', paddingTopVertical: 12, marginTop: 12 }]}>
              <Text style={styles.totalLabel}>Total Potential</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalEarned + potentialEarnings)}</Text>
            </View>
          </View>
        </View>

        {/* GOLDEN RATIO: Referred Families (20% weight) */}
        <View style={styles.referredFamiliesSection}>
          <Text style={styles.sectionTitle}>Families You've Referred</Text>
          <View style={styles.familyCard}>
            <View style={styles.familyRow}>
              <View style={styles.familyInfo}>
                <Text style={styles.familyName}>Priya's Family</Text>
                <Text style={styles.familyStatus}>✓ Joined 15 days ago</Text>
              </View>
              <Text style={styles.familyEarnings}>{formatCurrency(200)}</Text>
            </View>
          </View>
          <View style={styles.familyCard}>
            <View style={styles.familyRow}>
              <View style={styles.familyInfo}>
                <Text style={styles.familyName}>Ahmed's Family</Text>
                <Text style={styles.familyStatus}>⏳ 2 days remaining (3-trip trial)</Text>
              </View>
              <Text style={styles.familyPotential}>{formatCurrency(200)}</Text>
            </View>
          </View>
        </View>

        {/* GOLDEN RATIO: Action Buttons (10% weight) */}
        <View style={styles.actionButtonsSection}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>📋 Copy Referral Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>📱 Share on WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>💳 Withdraw to Bank Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleDark: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  stack: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  // GOLDEN RATIO: 70% visual weight for earnings
  premiumEarningsCard: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#fbbf24',
    borderRadius: 16,
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  earningsLabel: {
    color: '#78350f',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  largeAmount: {
    color: '#111827',
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 64,
    marginBottom: 20,
  },
  earningsBreakdown: {
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: '#78350f',
    fontSize: 13,
    fontWeight: '500',
  },
  breakdownValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  totalLabel: {
    color: '#78350f',
    fontSize: 13,
    fontWeight: '700',
  },
  totalValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  // GOLDEN RATIO: 20% weight for referred families
  referredFamiliesSection: {
    gap: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  familyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  familyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  familyStatus: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  familyEarnings: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '800',
  },
  familyPotential: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '800',
  },
  // GOLDEN RATIO: 10% weight for action buttons
  actionButtonsSection: {
    gap: 10,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  withdrawButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  spacer: {
    height: 20,
  },
});
