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
        <Text style={styles.title}>Share & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>You've earned</Text>
          <Text style={styles.earningsAmount}>₹{stats.earned}</Text>
          <Text style={styles.earningsSubtext}>
            {stats.claimed} families joined • {stats.sent - stats.claimed} more to reach
          </Text>
        </View>

        <View style={styles.codeSection}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{referralCode}</Text>
          </View>

          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Text style={styles.buttonText}>📋 Copy Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Share on WhatsApp</Text>
          <View style={styles.messagePreview}>
            <Text style={styles.messageText}>{whatsappMessage}</Text>
          </View>

          <TouchableOpacity style={styles.whatsappButton} onPress={handleShareWhatsApp}>
            <Text style={styles.buttonText}>💬 Share on WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>💡 Each family that joins with your code earns you ₹200!</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backButton: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  earningsBox: {
    backgroundColor: 'rgba(255, 199, 44, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffc72c',
  },
  earningsLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  earningsAmount: {
    color: '#ffc72c',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  earningsSubtext: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  codeSection: {
    gap: 12,
    marginBottom: 24,
  },
  shareSection: {
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  codeBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  code: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Courier New',
  },
  messagePreview: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    minHeight: 60,
  },
  messageText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  copyButton: {
    backgroundColor: '#34AF23',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: 'rgba(50, 180, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#32b4ff',
    padding: 12,
  },
  infoText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
});
