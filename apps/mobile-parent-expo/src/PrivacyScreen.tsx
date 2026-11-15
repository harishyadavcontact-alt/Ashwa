import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { colors } from './theme';

interface PrivacyScreenProps {
  onBack: () => void;
}

export function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleDark}>Privacy & Legal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {/* Child Safety */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Child safety</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Your child's location is shared only with their assigned driver for the duration of the trip. You can track real-time location during active trips. All location data is encrypted and never stored permanently.
            </Text>
          </View>
        </View>

        {/* Your Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your privacy</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Your personal information, contact details, and payment information are encrypted and protected. We use industry-standard security (AES-256) for all data in transit and at rest.
            </Text>
          </View>
        </View>

        {/* Data Protection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data protection</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              All child records, trip history, and attendance data are protected under RBI guidelines and India's Personal Data Protection Act. We conduct quarterly security audits and comply with the latest safety standards.
            </Text>
          </View>
        </View>

        {/* Third-Party Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-party access</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              We never share your data or your child's data with third parties without your explicit consent. Drivers receive only the minimum information needed to safely transport your child.
            </Text>
          </View>
        </View>

        {/* Account Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account security</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Your account is protected by a secure password. Enable WhatsApp notifications for all trip alerts and account activity. Never share your password or verification code with anyone.
            </Text>
          </View>
        </View>

        {/* Full Terms Link */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Read full Terms & Conditions →</Text>
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
  section: {
    gap: 8,
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
  },
  cardText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.accent + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  linkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
