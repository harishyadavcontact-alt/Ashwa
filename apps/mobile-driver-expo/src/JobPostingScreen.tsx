import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { api } from './api';

interface Route {
  id: string;
  name: string;
}

const mockRoutes: Route[] = [
  { id: 'route-1', name: 'School A Morning' },
  { id: 'route-2', name: 'School A Evening' },
  { id: 'route-3', name: 'School B Morning' },
  { id: 'route-4', name: 'Tuition Center Route' },
];

export function JobPostingScreen({ ownerId }: { ownerId: string }) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [monthlyPay, setMonthlyPay] = useState('12000');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handlePostJob = async () => {
    if (!selectedRoute || !monthlyPay) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const route = mockRoutes.find((r) => r.id === selectedRoute);
      // TODO: Later, replace with Supabase insert
      const res = await api.post('/api/jobs/create', {
        ownerId,
        routeId: selectedRoute,
        routeName: route?.name,
        monthlyPayment: parseInt(monthlyPay),
        startDate,
      });

      Alert.alert('Success', `Job posted: ${route?.name}`);
      setSelectedRoute(null);
      setMonthlyPay('12000');
    } catch (error) {
      Alert.alert('Error', 'Failed to post job');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 20 }}>📝 Post a Job</Text>

      {/* Route Selection */}
      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Select Route</Text>
      {mockRoutes.map((route) => (
        <TouchableOpacity
          key={route.id}
          onPress={() => setSelectedRoute(route.id)}
          style={{
            padding: 12,
            marginBottom: 8,
            borderRadius: 8,
            backgroundColor: selectedRoute === route.id ? '#ffc72c' : '#f5f5f5',
          }}
        >
          <Text style={{ fontWeight: selectedRoute === route.id ? '600' : '400' }}>{route.name}</Text>
        </TouchableOpacity>
      ))}

      {/* Monthly Pay */}
      <Text style={{ fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8 }}>Monthly Payment (₹)</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 16,
        }}
        keyboardType="numeric"
        value={monthlyPay}
        onChangeText={setMonthlyPay}
        placeholder="e.g., 12000"
      />

      {/* Start Date */}
      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Start Date</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 12,
          borderRadius: 8,
          marginBottom: 24,
          fontSize: 16,
        }}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
      />

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handlePostJob}
        disabled={loading}
        style={{
          backgroundColor: '#ffc72c',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontWeight: '600', fontSize: 16 }}>
          {loading ? 'Posting...' : 'Post Job'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
