import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from './theme';

interface ReferralCardProps {
  earnings: number;
  referralCode: string;
  totalReferrals?: number;
  potentialEarnings?: number;
  onCopyCode: () => void;
  onViewDetails: () => void;
}

export function ReferralCard({
  earnings,
  referralCode,
  totalReferrals = 0,
  potentialEarnings = 0,
  onCopyCode,
  onViewDetails,
}: ReferralCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.earningsSection}>
        <Text style={styles.label}>You earned</Text>
        <Text style={styles.amount}>₹{earnings}</Text>
        <Text style={styles.subText}>Refer {Math.max(0, 5 - totalReferrals)} more for ₹{potentialEarnings}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Share your code:</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{referralCode || 'LOADING...'}</Text>
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={onCopyCode}>
          <Text style={styles.copyButtonText}>Copy & Share</Text>
        </TouchableOpacity>
      </View>

      {earnings > 0 && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.detailsLink} onPress={onViewDetails}>
            <Text style={styles.detailsLinkText}>View referral details</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  earningsSection: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  subText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  codeSection: {
    gap: 8,
    alignItems: 'center',
  },
  codeLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    width: '100%',
    alignItems: 'center',
  },
  code: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Courier New',
  },
  copyButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  copyButtonText: {
    color: colors.panel,
    fontSize: 14,
    fontWeight: '700',
  },
  detailsLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailsLinkText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
