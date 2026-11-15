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
        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your privacy</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Your location is only visible to parents you are serving and to our ops team for route optimization. We encrypt all location data in transit and at rest. You can disable location sharing from Settings at any time.
            </Text>
          </View>
        </View>

        {/* Data Protection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data protection</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              We use industry-standard encryption (AES-256) to protect all your personal data, including payment information, documents, and communications. Your data is never shared with third parties without your explicit consent.
            </Text>
          </View>
        </View>

        {/* Account Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account security</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Your account is protected by a secure password. We recommend using a strong, unique password and not sharing your credentials with anyone. Enable WhatsApp notifications for account activity alerts.
            </Text>
          </View>
        </View>

        {/* Compliance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Ashwa complies with India's Personal Data Protection Act, RBI guidelines for payment systems, and transportation regulations. Our privacy practices are reviewed quarterly by independent auditors.
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
