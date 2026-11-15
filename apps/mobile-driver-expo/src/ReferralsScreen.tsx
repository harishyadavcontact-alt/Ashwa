import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { colors } from './theme';

interface ReferredDriver {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  bonusEarned: number;
}

interface ReferralsScreenProps {
  referrals: ReferredDriver[];
  totalBonusEarned: number;
  onBack: () => void;
}

export function ReferralsScreen({
  referrals,
  totalBonusEarned,
  onBack,
}: ReferralsScreenProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#16a34a';
      case 'PENDING':
        return '#f97316';
      default:
        return colors.muted;
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleDark}>My Referrals</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total bonus earned</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalBonusEarned)}</Text>
          <Text style={styles.summaryDetail}>From {referrals.length} driver{referrals.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Referrals List */}
        {referrals.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Drivers invited</Text>
            <FlatList
              data={referrals}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.referralCard}>
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>{item.name}</Text>
                    <View style={styles.statusBadge}>
                      <View
                        style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]}
                      />
                      <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.referralEarning}>
                    <Text style={styles.referralAmount}>{formatCurrency(item.bonusEarned)}</Text>
                    <Text style={styles.referralHint}>bonus earned</Text>
                  </View>
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No referrals yet</Text>
            <Text style={styles.emptyBody}>Invite drivers to earn ₹500 per referral</Text>
          </View>
        )}

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
    gap: 20,
  },
  summaryCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.accent + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryAmount: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  referralCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  referralInfo: {
    flex: 1,
    gap: 6,
  },
  referralName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  referralEarning: {
    alignItems: 'flex-end',
    gap: 2,
  },
  referralAmount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  referralHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  emptyCard: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
});
