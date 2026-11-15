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
  onChat: () => void;
  onBack: () => void;
}

export function SupportScreen({
  onChat,
  onBack,
}: SupportScreenProps) {
  const [chatInProgress, setChatInProgress] = useState(false);

  const handleChatPress = async () => {
    setChatInProgress(true);
    onChat();

    // Simulate chat start for demo (3 seconds)
    setTimeout(() => {
      setChatInProgress(false);
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
          <Text style={styles.supportIcon}>💬</Text>
        </View>

        {/* Support Message */}
        <View style={styles.messageCard}>
          <Text style={styles.message}>Get instant help from our support team</Text>
        </View>

        {/* Chat Button */}
        <TouchableOpacity
          style={[styles.chatButton, chatInProgress && styles.chatButtonActive]}
          onPress={handleChatPress}
          disabled={chatInProgress}
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonIcon}>{chatInProgress ? '⏳' : '💬'}</Text>
          <Text style={styles.chatButtonText}>
            {chatInProgress ? 'Starting chat...' : 'Start Chat'}
          </Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Available 24/7</Text>
          <Text style={styles.infoText}>
            Our support team is here to help with any questions about your child's trips, drivers, and account.
          </Text>
        </View>

        {/* Quick Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What we can help with</Text>
          <View style={styles.helpList}>
            <Text style={styles.helpItem}>• Child tracking and locations</Text>
            <Text style={styles.helpItem}>• Trip history and driver details</Text>
            <Text style={styles.helpItem}>• Payment and billing questions</Text>
            <Text style={styles.helpItem}>• Emergency assistance</Text>
            <Text style={styles.helpItem}>• Account and profile issues</Text>
            <Text style={styles.helpItem}>• Referral program questions</Text>
          </View>
        </View>

        {/* Response Time */}
        <View style={styles.responseCard}>
          <Text style={styles.responseIcon}>⚡</Text>
          <View>
            <Text style={styles.responseTitle}>Typical response: 2 minutes</Text>
            <Text style={styles.responseText}>We aim to respond to all chats within 2 minutes during business hours</Text>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        visible={chatInProgress}
        transparent
        animationType="fade"
      >
        <View style={styles.chatModal}>
          <View style={styles.chatModalContent}>
            <Text style={styles.chatModalIcon}>💬</Text>
            <Text style={styles.chatModalTitle}>Starting chat...</Text>
            <Text style={styles.chatModalSubtitle}>Connecting to support team</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setChatInProgress(false)}
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
  chatButtonActive: {
    opacity: 0.8,
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
  responseCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  responseIcon: {
    fontSize: 20,
  },
  responseTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  responseText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  spacer: {
    height: 20,
  },
  chatModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatModalContent: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: colors.panel,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  chatModalIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  chatModalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  chatModalSubtitle: {
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
