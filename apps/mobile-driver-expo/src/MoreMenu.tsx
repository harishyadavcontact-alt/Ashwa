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

interface MoreMenuProps {
  role: 'driver' | 'owner';
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName?: string;
}

export function MoreMenu({ role, onNavigate, onLogout, userName = 'User' }: MoreMenuProps) {
  const menuItems = role === 'driver'
    ? [
        { label: 'Settings', screen: 'settings' },
        { label: 'My Earnings', screen: 'earnings' },
        { label: 'My Referrals', screen: 'my-referrals' },
        { label: 'Success Stories', screen: 'success-stories' },
        { label: 'Loan Status', screen: 'loan-status' },
        { label: 'Documents', screen: 'documents' },
        { label: 'Support', screen: 'support' },
        { label: 'Logout', action: 'logout' },
      ]
    : [ // owner
        { label: 'Settings', screen: 'settings' },
        { label: 'Fleet Analytics', screen: 'fleet-analytics' },
        { label: 'Team Management', screen: 'team-management' },
        { label: 'Loan Management', screen: 'loan-management' },
        { label: 'Documents', screen: 'documents' },
        { label: 'Success Stories', screen: 'success-stories' },
        { label: 'Integrations', screen: 'integrations' },
        { label: 'Support', screen: 'support' },
        { label: 'Logout', action: 'logout' },
      ];

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.action === 'logout') {
      onLogout();
    } else if (item.screen) {
      onNavigate(item.screen);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.titleDark}>More</Text>
        <Text style={styles.bodyDark}>Account & preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.menuItem,
              item.action === 'logout' && styles.logoutItem,
            ]}
            onPress={() => handleMenuPress(item)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.menuItemText,
                item.action === 'logout' && styles.logoutText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
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
  titleDark: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  bodyDark: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  stack: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  logoutItem: {
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  menuItemText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
