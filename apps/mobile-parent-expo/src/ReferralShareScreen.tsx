import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Clipboard, ActivityIndicator } from 'react-native';
import { colors } from './theme';

interface ReferralShareScreenProps {
  parentPhone: string;
  onBack: () => void;
}

export function ReferralShareScreen({ parentPhone, onBack }: ReferralShareScreenProps) {
  const [referralCode, setReferralCode] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [stats, setStats] = useState({ sent: 0, claimed: 0, earned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralInfo();
  }, [parentPhone]);

  const fetchReferralInfo = async () => {
    try {
      // TODO: Replace with actual API endpoint
      const codeResponse = await fetch(
        `http://localhost:3000/api/referrals/code/${encodeURIComponent(parentPhone)}`,
      );
      const codeData = await codeResponse.json();

      const statsResponse = await fetch(
        `http://localhost:3000/api/referrals/stats/${encodeURIComponent(parentPhone)}`,
      );
      const statsData = await statsResponse.json();

      if (codeData.code) {
        setReferralCode(codeData.code);
        setWhatsappMessage(codeData.whatsappMessage);
      }

      if (statsData.sent !== undefined) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch referral info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setString(referralCode);
      Alert.alert('Copied!', `Code ${referralCode} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      // Log the referral send
      await fetch('http://localhost:3000/api/referrals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPhone,
        }),
      });

      // Open WhatsApp with message
      const message = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/?text=${message}`;

      // For React Native, use Share API or linking
      await Share.share({
        message: whatsappMessage,
        title: 'Share Ashwa Invitation',
      });
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Earn ₹200</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Premium Gold Card - Referral Explanation */}
        <View style={styles.premiumCard}>
          <Text style={styles.cardTitle}>Share this code with friends.</Text>
          <Text style={styles.cardSubtitle}>When they join & complete 3 trips, you both earn ₹200.</Text>
        </View>

        {/* Referral Code Box - Prominent */}
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>CODE</Text>
          <View style={styles.codeBoxPremium}>
            <Text style={styles.codePremium}>{referralCode}</Text>
          </View>
        </View>

        {/* Action Buttons - Clean, Professional */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.copyButtonPremium} onPress={handleCopyCode}>
            <Text style={styles.copyButtonText}>📋 Copy Code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappButtonPremium} onPress={handleShareWhatsApp}>
            <Text style={styles.whatsappButtonText}>💬 Share on WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Stats - Referred Families */}
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>Families Referred</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sent:</Text>
            <Text style={styles.statValue}>{stats.sent} invites</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Claimed:</Text>
            <Text style={styles.statValue}>{stats.claimed} families</Text>
          </View>
          <View style={[styles.statRow, { borderTopWidth: 1, borderTopColor: '#1e3a8a', paddingTop: 12, marginTop: 12 }]}>
            <Text style={styles.earnedLabel}>Total Earned:</Text>
            <Text style={styles.earnedValue}>₹{stats.earned}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  // Premium gold card with explanation
  premiumCard: {
    backgroundColor: '#fbbf24',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  cardTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: '#78350f',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  codeSection: {
    gap: 10,
  },
  codeLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  codeBoxPremium: {
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codePremium: {
    color: '#fbbf24',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: 'Courier New',
  },
  actionButtons: {
    gap: 10,
  },
  copyButtonPremium: {
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  whatsappButtonPremium: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statsBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statsTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  earnedLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  earnedValue: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '800',
  },
});
