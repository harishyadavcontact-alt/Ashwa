import type { DriverVerification } from '@ashwa/shared';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

interface VerificationBadgeProps {
  verification?: DriverVerification | null;
}

export function VerificationBadge({ verification }: VerificationBadgeProps) {
  if (!verification || verification.status === 'NOT_STARTED') {
    return (
      <View style={[styles.badge, styles.notStarted]}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.label}>Verification needed</Text>
      </View>
    );
  }

  if (verification.status === 'PENDING') {
    return (
      <View style={[styles.badge, styles.pending]}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.label}>Pending review</Text>
      </View>
    );
  }

  if (verification.status === 'APPROVED') {
    const verifiedDate = verification.approvedAt
      ? new Date(verification.approvedAt).toLocaleDateString()
      : 'Unknown';
    return (
      <View style={[styles.badge, styles.approved]}>
        <Text style={styles.emoji}>✓</Text>
        <Text style={styles.label}>Verified Driver</Text>
        <Text style={styles.date}>Verified {verifiedDate}</Text>
      </View>
    );
  }

  if (verification.status === 'REJECTED') {
    return (
      <View style={[styles.badge, styles.rejected]}>
        <Text style={styles.emoji}>✗</Text>
        <Text style={styles.label}>Re-upload needed</Text>
        <Text style={styles.reason}>{verification.rejectionReason || 'Documents were rejected'}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
    alignItems: 'center',
  },
  notStarted: {
    backgroundColor: '#f3f3f3',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pending: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  approved: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  rejected: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  emoji: { fontSize: 32 },
  label: { fontSize: 16, fontWeight: '700', color: colors.ink },
  date: { fontSize: 12, color: '#666' },
  reason: { fontSize: 12, color: '#c33', fontStyle: 'italic' },
});
