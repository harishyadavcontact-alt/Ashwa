import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Switch,
} from 'react-native';
import { colors } from './theme';

interface SettingsScreenProps {
  userName: string;
  userPhone: string;
  userEmail?: string;
  isDarkMode?: boolean;
  whatsAppNotifications?: boolean;
  onChangeName: (name: string) => void;
  onChangeEmail: (email: string) => void;
  onToggleDarkMode: (enabled: boolean) => void;
  onToggleWhatsApp: (enabled: boolean) => void;
  onSave: () => void;
  onBack: () => void;
}

export function SettingsScreen({
  userName,
  userPhone,
  userEmail = '',
  isDarkMode = false,
  whatsAppNotifications = true,
  onChangeName,
  onChangeEmail,
  onToggleDarkMode,
  onToggleWhatsApp,
  onSave,
  onBack,
}: SettingsScreenProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [darkMode, setDarkMode] = useState(isDarkMode);
  const [whatsApp, setWhatsApp] = useState(whatsAppNotifications);

  const hasChanges =
    name !== userName ||
    email !== userEmail ||
    darkMode !== isDarkMode ||
    whatsApp !== whatsAppNotifications;

  const handleSave = () => {
    onChangeName(name);
    onChangeEmail(email);
    onToggleDarkMode(darkMode);
    onToggleWhatsApp(whatsApp);
    onSave();
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleDark}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {/* Profile Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Profile name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Phone (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.label}>Phone number</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{userPhone}</Text>
            <Text style={styles.verifiedBadge}>✓ Verified</Text>
          </View>
        </View>

        {/* Email */}
        <View style={styles.section}>
          <Text style={styles.label}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* WhatsApp Notifications */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>WhatsApp notifications</Text>
            <Switch
              value={whatsApp}
              onValueChange={setWhatsApp}
              trackColor={{ false: colors.line, true: colors.accent }}
              thumbColor={whatsApp ? colors.accent : colors.muted}
            />
          </View>
          <Text style={styles.hint}>Receive alerts about trips and payments via WhatsApp</Text>
        </View>

        {/* Dark Mode */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Dark mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.line, true: colors.accent }}
              thumbColor={darkMode ? colors.accent : colors.muted}
            />
          </View>
        </View>

        {/* Save Button */}
        {hasChanges && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save changes</Text>
          </TouchableOpacity>
        )}
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
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontSize: 16,
  },
  readOnlyField: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.line + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '500',
  },
  verifiedBadge: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  saveButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: colors.panel,
    fontSize: 16,
    fontWeight: '700',
  },
});
