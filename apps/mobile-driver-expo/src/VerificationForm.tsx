import type { DriverVerification } from '@ashwa/shared';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from './theme';

interface VerificationFormProps {
  token: string;
  driverId: string;
  currentVerification?: DriverVerification | null;
  onSubmit: (data: {
    licenseNumber: string;
    licenseExpiry: string;
    policyNumber: string;
    insuranceExpiry: string;
    policeCheckDone: boolean;
  }) => Promise<void>;
  onBack: () => void;
}

export function VerificationForm({
  token,
  driverId,
  currentVerification,
  onSubmit,
  onBack,
}: VerificationFormProps) {
  const [step, setStep] = useState<'license' | 'insurance' | 'police' | 'review'>(
    currentVerification?.status === 'REJECTED' ? 'license' : 'license'
  );
  const [licenseNumber, setLicenseNumber] = useState(currentVerification?.licenseNumber || '');
  const [licenseExpiry, setLicenseExpiry] = useState(currentVerification?.licenseExpiry || '');
  const [policyNumber, setPolicyNumber] = useState(currentVerification?.policyNumber || '');
  const [insuranceExpiry, setInsuranceExpiry] = useState(currentVerification?.insuranceExpiry || '');
  const [policeCheckDone, setPoliceCheckDone] = useState(currentVerification?.policeCheckDone || false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (!licenseNumber || !licenseExpiry || !policyNumber || !insuranceExpiry) {
      setStatus('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        licenseNumber,
        licenseExpiry,
        policyNumber,
        insuranceExpiry,
        policeCheckDone,
      });
      setStatus('Verification submitted for admin review!');
    } catch (error: any) {
      setStatus(error.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  if (currentVerification?.status === 'PENDING') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Verification Pending</Text>
          <Text style={styles.bodyDark}>Your documents are under review. You will be notified when approved.</Text>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>⏳ Pending Admin Review</Text>
            <Text style={styles.metric}>License #: {currentVerification.licenseNumber}</Text>
            <Text style={styles.metric}>License Expiry: {currentVerification.licenseExpiry}</Text>
            <Text style={styles.metric}>Policy #: {currentVerification.policyNumber}</Text>
            <Text style={styles.metric}>Insurance Expiry: {currentVerification.insuranceExpiry}</Text>
            <Text style={styles.metric}>Police Check: {currentVerification.policeCheckDone ? 'Done' : 'Not done'}</Text>
            {currentVerification.submittedAt && (
              <Text style={styles.metric}>
                Submitted: {new Date(currentVerification.submittedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          <Button title="Back" onPress={onBack} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentVerification?.status === 'APPROVED') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>✓</Text>
            <Text style={styles.titleDark}>Verified Driver</Text>
            <Text style={styles.bodyDark}>Your documents have been approved!</Text>
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>License Details</Text>
            <Text style={styles.metric}>License #: {currentVerification.licenseNumber}</Text>
            <Text style={styles.metric}>Expiry: {currentVerification.licenseExpiry}</Text>
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Insurance Details</Text>
            <Text style={styles.metric}>Policy #: {currentVerification.policyNumber}</Text>
            <Text style={styles.metric}>Expiry: {currentVerification.insuranceExpiry}</Text>
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Police Check</Text>
            <Text style={styles.metric}>{currentVerification.policeCheckDone ? 'Completed ✓' : 'Not completed'}</Text>
          </View>
          {currentVerification.approvedAt && (
            <Text style={styles.metric}>Verified {new Date(currentVerification.approvedAt).toLocaleDateString()}</Text>
          )}
          <Button title="Back" onPress={onBack} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentVerification?.status === 'REJECTED') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <View style={styles.errorCard}>
            <Text style={styles.titleDark}>Document Rejected</Text>
            <Text style={styles.metric}>{currentVerification.rejectionReason}</Text>
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Previous Submission</Text>
            <Text style={styles.metric}>License #: {currentVerification.licenseNumber}</Text>
            <Text style={styles.metric}>Policy #: {currentVerification.policyNumber}</Text>
          </View>
          <Text style={styles.bodyDark}>Please re-upload the documents that were rejected.</Text>
          {/* Continue with form */}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.stack}>
        <Text style={styles.titleDark}>Driver Verification</Text>
        <Text style={styles.bodyDark}>Complete document verification to be visible to parents.</Text>

        {loading ? <ActivityIndicator color={colors.accent} /> : null}

        {/* License Section */}
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>📋 License Details</Text>
          <TextInput
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="License number (e.g., DL-12345)"
            style={styles.input}
          />
          <TextInput
            value={licenseExpiry}
            onChangeText={setLicenseExpiry}
            placeholder="Expiry date (YYYY-MM-DD)"
            style={styles.input}
          />
          <Text style={styles.helperText}>Upload your license photo to Supabase Storage in production</Text>
        </View>

        {/* Insurance Section */}
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>🛡️ Insurance Details</Text>
          <TextInput
            value={policyNumber}
            onChangeText={setPolicyNumber}
            placeholder="Policy number (e.g., POL-98765)"
            style={styles.input}
          />
          <TextInput
            value={insuranceExpiry}
            onChangeText={setInsuranceExpiry}
            placeholder="Expiry date (YYYY-MM-DD)"
            style={styles.input}
          />
          <Text style={styles.helperText}>Upload your insurance document to Supabase Storage in production</Text>
        </View>

        {/* Police Check Section */}
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>🔍 Police Verification</Text>
          <View style={styles.switchRow}>
            <Text style={styles.metric}>Have you completed police verification?</Text>
            <Switch
              value={policeCheckDone}
              onValueChange={setPoliceCheckDone}
              trackColor={{ false: '#767577', true: colors.accent }}
            />
          </View>
        </View>

        {/* Status */}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={loading ? 'Submitting...' : 'Submit for Approval'}
            onPress={handleSubmit}
            disabled={loading}
          />
          <Button title="Cancel" onPress={onBack} />
        </View>
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
  successCard: {
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 18,
    gap: 10,
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: '#ffebee',
    padding: 20,
    borderRadius: 18,
    gap: 10,
  },
  successEmoji: { fontSize: 48, color: '#4caf50' },
  titleDark: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  bodyDark: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  metric: { color: colors.muted, fontSize: 14 },
  helperText: { color: '#999', fontSize: 12, fontStyle: 'italic' },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fbfaf7',
  },
  status: { color: colors.muted, fontSize: 13 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: { gap: 10, paddingBottom: 24 },
});
