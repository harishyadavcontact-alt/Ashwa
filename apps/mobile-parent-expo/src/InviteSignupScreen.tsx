import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { colors } from './theme';
import { api } from './api';

interface InviteSignupScreenProps {
  inviteCode: string;
  onSuccess: (parent: any) => void;
  onBack: () => void;
}

export function InviteSignupScreen({ inviteCode, onSuccess, onBack }: InviteSignupScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [childName, setChildName] = useState('');
  const [school, setSchool] = useState('');
  const [pickupLat, setPickupLat] = useState('12.9716');
  const [pickupLng, setPickupLng] = useState('77.5946');
  const [dropLat, setDropLat] = useState('13.0827');
  const [dropLng, setDropLng] = useState('80.2707');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!phoneNumber || !childName || !school) {
      Alert.alert('Missing info', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('http://localhost:3000/api/invites/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: inviteCode,
          parentPhone: phoneNumber,
          name: childName, // Use child name for now
          childName,
          school,
          pickupLat: parseFloat(pickupLat),
          pickupLng: parseFloat(pickupLng),
          dropLat: parseFloat(dropLat),
          dropLng: parseFloat(dropLng),
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success!', result.message);
        onSuccess(result.parent);
      } else {
        Alert.alert('Error', result.error || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Complete Your Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          editable={!loading}
        />

        <Text style={styles.label}>Child's Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Arjun"
          value={childName}
          onChangeText={setChildName}
          editable={!loading}
        />

        <Text style={styles.label}>School Name</Text>
        <TextInput
          style={styles.input}
          placeholder="St. Xavier's School"
          value={school}
          onChangeText={setSchool}
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>Pickup Location (GPS Coordinates)</Text>
        <View style={styles.coordRow}>
          <TextInput
            style={[styles.input, styles.coordInput]}
            placeholder="Latitude"
            keyboardType="decimal-pad"
            value={pickupLat}
            onChangeText={setPickupLat}
            editable={!loading}
          />
          <TextInput
            style={[styles.input, styles.coordInput]}
            placeholder="Longitude"
            keyboardType="decimal-pad"
            value={pickupLng}
            onChangeText={setPickupLng}
            editable={!loading}
          />
        </View>

        <Text style={styles.sectionLabel}>Drop Location (GPS Coordinates)</Text>
        <View style={styles.coordRow}>
          <TextInput
            style={[styles.input, styles.coordInput]}
            placeholder="Latitude"
            keyboardType="decimal-pad"
            value={dropLat}
            onChangeText={setDropLat}
            editable={!loading}
          />
          <TextInput
            style={[styles.input, styles.coordInput]}
            placeholder="Longitude"
            keyboardType="decimal-pad"
            value={dropLng}
            onChangeText={setDropLng}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.signupButton, loading && styles.signupButtonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.panel} />
          ) : (
            <Text style={styles.signupButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
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
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 8,
  },
  coordInput: {
    flex: 1,
  },
  signupButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: colors.panel,
    fontSize: 16,
    fontWeight: '700',
  },
});
