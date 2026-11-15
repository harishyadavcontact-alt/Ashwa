import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Modal,
} from 'react-native';
import { colors } from './theme';

interface SupportScreenProps {
  role: 'driver' | 'owner' | 'parent';
  onCall: () => void;
  onBack: () => void;
}

export function SupportScreen({
  role,
  onCall,
  onBack,
}: SupportScreenProps) {
  const [callInProgress, setCallInProgress] = useState(false);

  const supportText = role === 'driver'
    ? 'Call our ops team directly for immediate help'
    : role === 'owner'
    ? 'Call your dedicated account manager'
    : 'Chat with our support team';

  const buttonText = role === 'driver' || role === 'owner'
    ? role === 'driver' ? 'Call Support' : 'Call Account Manager'
    : 'Start Chat';

  const handleCallPress = async () => {
    setCallInProgress(true);
    onCall();

    // Simulate call for demo (3 seconds)
    setTimeout(() => {
      setCallInProgress(false);
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleDark}>Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {/* Support Icon */}
        <View style={styles.iconBox}>
          <Text style={styles.supportIcon}>
            {role === 'driver' ? '📞' : role === 'owner' ? '💼' : '💬'}
          </Text>
        </View>

        {/* Support Message */}
        <View style={styles.messageCard}>
          <Text style={styles.message}>{supportText}</Text>
        </View>

        {/* Call/Chat Button */}
        {(role === 'driver' || role === 'owner') && (
          <TouchableOpacity
            style={[styles.callButton, callInProgress && styles.callButtonActive]}
            onPress={handleCallPress}
            disabled={callInProgress}
            activeOpacity={0.8}
          >
            <Text style={styles.callButtonIcon}>{callInProgress ? '⏳' : '📞'}</Text>
            <Text style={styles.callButtonText}>
              {callInProgress ? 'Calling...' : buttonText}
            </Text>
          </TouchableOpacity>
        )}

        {role === 'parent' && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleCallPress}
            activeOpacity={0.8}
          >
            <Text style={styles.chatButtonIcon}>💬</Text>
            <Text style={styles.chatButtonText}>Start Chat</Text>
          </TouchableOpacity>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Available 24/7</Text>
          <Text style={styles.infoText}>
            {role === 'driver'
              ? 'Our ops team is ready to help with any trip, payment, or account issues.'
              : role === 'owner'
              ? 'Your dedicated account manager handles fleet, payroll, and loan questions.'
              : 'Support team available Monday-Saturday, 8 AM - 8 PM'}
          </Text>
        </View>

        {/* Quick Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What we can help with</Text>
          <View style={styles.helpList}>
            {role === 'driver' && (
              <>
                <Text style={styles.helpItem}>• Trip and routing issues</Text>
                <Text style={styles.helpItem}>• Payment and earnings questions</Text>
                <Text style={styles.helpItem}>• Vehicle and document verification</Text>
                <Text style={styles.helpItem}>• Referral and bonus inquiries</Text>
              </>
            )}
            {role === 'owner' && (
              <>
                <Text style={styles.helpItem}>• Fleet management and analytics</Text>
                <Text style={styles.helpItem}>• Payroll and team questions</Text>
                <Text style={styles.helpItem}>• Loan repayment and refinancing</Text>
                <Text style={styles.helpItem}>• Contract and legal matters</Text>
              </>
            )}
            {role === 'parent' && (
              <>
                <Text style={styles.helpItem}>• Child tracking and assignments</Text>
                <Text style={styles.helpItem}>• Payment and billing</Text>
                <Text style={styles.helpItem}>• Attendance and reports</Text>
                <Text style={styles.helpItem}>• Emergency assistance</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Calling Modal */}
      <Modal
        visible={callInProgress}
        transparent
        animationType="fade"
      >
        <View style={styles.callModal}>
          <View style={styles.callModalContent}>
            <Text style={styles.callModalIcon}>📞</Text>
            <Text style={styles.callModalTitle}>
              {role === 'driver'
                ? 'Calling support team...'
                : role === 'owner'
                ? 'Calling account manager...'
                : 'Starting chat...'}
            </Text>
            <Text style={styles.callModalSubtitle}>
              {role === 'driver' ? '+91-XXXX-XXXX-01' : '+91-XXXX-XXXX-02'}
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCallInProgress(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 24,
    gap: 24,
  },
  iconBox: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    backgroundColor: colors.accent + '15',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportIcon: {
    fontSize: 40,
  },
  messageCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  message: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  callButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callButtonActive: {
    opacity: 0.8,
  },
  callButtonIcon: {
    fontSize: 20,
  },
  callButtonText: {
    color: colors.panel,
    fontSize: 16,
    fontWeight: '700',
  },
  chatButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatButtonIcon: {
    fontSize: 20,
  },
  chatButtonText: {
    color: colors.panel,
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.accent + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  infoTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  helpList: {
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  helpItem: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  spacer: {
    height: 20,
  },
  callModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callModalContent: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: colors.panel,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  callModalIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  callModalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  callModalSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: colors.line,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
});
