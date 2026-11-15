import type { DriverVerification } from '@ashwa/shared';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from './theme';

interface AdminVerificationProps {
  verifications: DriverVerification[];
  onApprove: (verificationId: string) => Promise<void>;
  onReject: (verificationId: string, reason: string) => Promise<void>;
  onBack: () => void;
}

export function AdminVerificationDashboard({
  verifications,
  onApprove,
  onReject,
  onBack,
}: AdminVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const pendingVerifications = verifications.filter((v) => v.status === 'PENDING');

  const handleApprove = async (verificationId: string) => {
    setLoading(true);
    try {
      await onApprove(verificationId);
      setStatus('Verification approved!');
      setSelectedVerificationId(null);
    } catch (error: any) {
      setStatus(error.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (verificationId: string) => {
    if (!rejectionReason) {
      setStatus('Please enter a rejection reason');
      return;
    }
    setLoading(true);
    try {
      await onReject(verificationId, rejectionReason);
      setStatus('Verification rejected');
      setSelectedVerificationId(null);
      setRejectionReason('');
    } catch (error: any) {
      setStatus(error.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  if (selectedVerificationId) {
    const verification = verifications.find((v) => v.id === selectedVerificationId);
    if (!verification) return null;

    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Review Verification</Text>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>License Details</Text>
            <Text style={styles.metric}>License #: {verification.licenseNumber}</Text>
            <Text style={styles.metric}>Expiry: {verification.licenseExpiry}</Text>
            <Text style={styles.helperText}>License photo would be displayed from Supabase Storage</Text>
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Insurance Details</Text>
            <Text style={styles.metric}>Policy #: {verification.policyNumber}</Text>
            <Text style={styles.metric}>Expiry: {verification.insuranceExpiry}</Text>
            <Text style={styles.helperText}>Insurance document would be displayed from Supabase Storage</Text>
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Police Check</Text>
            <Text style={styles.metric}>{verification.policeCheckDone ? 'Completed' : 'Not completed'}</Text>
          </View>

          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Approve Verification</Text>
            <Button
              title={loading ? 'Approving...' : 'APPROVE'}
              onPress={() => handleApprove(verificationId)}
              disabled={loading}
            />
          </View>

          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Reject Verification</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Reason for rejection (e.g., 'License expired')"
              style={styles.input}
              multiline
            />
            <Button
              title={loading ? 'Rejecting...' : 'REJECT'}
              onPress={() => handleReject(verificationId, rejectionReason)}
              disabled={loading || !rejectionReason}
            />
          </View>

          {status && <Text style={styles.status}>{status}</Text>}

          <Button title="Back to list" onPress={() => setSelectedVerificationId(null)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.stack}>
        <Text style={styles.titleDark}>Pending Verifications</Text>
        <Text style={styles.bodyDark}>Review and approve driver documents ({pendingVerifications.length})</Text>

        {loading ? <ActivityIndicator color={colors.accent} /> : null}

        {pendingVerifications.length > 0 ? (
          <FlatList
            data={pendingVerifications}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Driver ID: {item.driverId.substring(0, 8)}</Text>
                  <Text style={styles.metric}>License: {item.licenseNumber}</Text>
                  <Text style={styles.metric}>Policy: {item.policyNumber}</Text>
                  <Text style={styles.metric}>
                    Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
                <Button
                  title="Review"
                  onPress={() => setSelectedVerificationId(item.id)}
                />
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>No pending verifications</Text>
            <Text style={styles.metric}>All driver verifications are processed</Text>
          </View>
        )}

        <Button title="Back" onPress={onBack} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  stack: { padding: 20, gap: 16 },
  cardInline: {
    backgroundColor: colors.panel,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  row: {
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  titleDark: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  bodyDark: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  metric: { color: colors.muted, fontSize: 14 },
  helperText: { color: '#999', fontSize: 12, fontStyle: 'italic' },
  emptyCard: { backgroundColor: '#eef3f5', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#c3d3d8', gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fbfaf7',
    minHeight: 80,
  },
  status: { color: colors.muted, fontSize: 13 },
});
