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
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName?: string;
}

const menuItems = [
  { label: 'Settings', screen: 'settings' },
  { label: 'Referral Earnings', screen: 'referral-earnings' },
  { label: 'Success Stories', screen: 'success-stories' },
  { label: 'Support', screen: 'support' },
  { label: 'Privacy', screen: 'privacy' },
  { label: 'Logout', action: 'logout' },
];

export function MoreMenu({ onNavigate, onLogout, userName = 'User' }: MoreMenuProps) {
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
