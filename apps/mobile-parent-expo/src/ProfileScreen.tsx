import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
} from 'react-native';

export function ProfileScreen({ onLogout, onClose }: { onLogout: () => void; onClose: () => void }) {
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Mock parent profile data (replace with real data from API)
  const parent = {
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya@email.com',
    rating: 4.8,
    trips: 12,
    verified: true,
    children: [
      { id: '1', name: 'Arjun', age: 8, school: "St. Xavier's" },
      { id: '2', name: 'Diya', age: 6, school: 'Vibgyor' },
    ],
    locations: {
      home: 'Whitefield',
      school: "St. Xavier's",
    },
    settings: {
      notifications: true,
      darkMode: false,
      language: 'English',
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Section (Golden Ratio: 30%) */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{parent.name}</Text>
              {parent.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.badgeText}>✓ Verified Phone</Text>
                </View>
              )}
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>⭐ {parent.rating}</Text>
                <Text style={styles.trips}>({parent.trips} trips)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact & Children Section (Golden Ratio: 40%) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Contact</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone</Text>
              <View style={styles.valueRow}>
                <Text style={styles.value}>{parent.phone}</Text>
                <Text style={styles.verified}>✓</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{parent.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧 My Children</Text>
          <View style={styles.sectionContent}>
            {parent.children.map((child, idx) => (
              <View key={child.id}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{child.name}</Text>
                  <Text style={styles.value}>
                    {child.age} yrs • {child.school}
                  </Text>
                </View>
                {idx < parent.children.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Locations</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Home</Text>
              <Text style={styles.value}>{parent.locations.home}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>School</Text>
              <Text style={styles.value}>{parent.locations.school}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section (Golden Ratio: 30%) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingRow} onPress={() => setSettingsModalVisible(true)}>
              <Text style={styles.settingLabel}>🔔 Notifications</Text>
              <Text style={styles.settingValue}>ON (trip alerts, referrals)</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow} onPress={() => setSettingsModalVisible(true)}>
              <Text style={styles.settingLabel}>🌙 Dark Mode</Text>
              <Text style={styles.settingValue}>OFF</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow} onPress={() => setSettingsModalVisible(true)}>
              <Text style={styles.settingLabel}>💬 Language</Text>
              <Text style={styles.settingValue}>English</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Legal</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.legalRow} onPress={() => Linking.openURL('https://ashwa.app/privacy')}>
              <Text style={styles.legalText}>Privacy Policy</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.legalRow} onPress={() => Linking.openURL('https://ashwa.app/terms')}>
              <Text style={styles.legalText}>Terms of Service</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.legalRow} onPress={() => Linking.openURL('https://ashwa.app/security')}>
              <Text style={styles.legalText}>Data Security</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={styles.spacing} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.comingSoon}>Settings coming soon. Manage preferences from app settings.</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSettingsModalVisible(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#fffbea',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc72c',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
    marginRight: 4,
  },
  trips: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  value: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verified: {
    fontSize: 12,
    color: '#16a34a',
    marginLeft: 4,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  settingValue: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },

  // Legal
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  legalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  arrow: {
    fontSize: 16,
    color: '#0066cc',
  },

  // Logout
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
  },
  comingSoon: {
    padding: 20,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#ffc72c',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },

  spacing: {
    height: 20,
  },
});
