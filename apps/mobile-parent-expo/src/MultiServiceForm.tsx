import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from './api';

const MultiServiceForm = ({ childId, onClose, onServiceAdded }) => {
  const [serviceType, setServiceType] = useState('dance');
  const [location, setLocation] = useState('');
  const [schedule, setSchedule] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [loading, setLoading] = useState(false);

  const handleAddService = async () => {
    if (!location.trim() || !schedule.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/services/add', {
        childId,
        type: serviceType,
        location,
        schedule,
        frequency,
      });

      alert(`✓ ${serviceType} added: ${location} at ${schedule}`);
      onServiceAdded?.(response.data);
      onClose?.();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Add a Service for {childId}
      </Text>

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Service Type</Text>
      <Picker selectedValue={serviceType} onValueChange={setServiceType} style={{ marginBottom: 16 }}>
        <Picker.Item label="Dance Class" value="dance" />
        <Picker.Item label="Tuition" value="tuition" />
        <Picker.Item label="Sports" value="sports" />
        <Picker.Item label="Medical" value="medical" />
        <Picker.Item label="Custom" value="custom" />
      </Picker>

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Location</Text>
      <TextInput
        placeholder="e.g., Delhi Dance Academy"
        value={location}
        onChangeText={setLocation}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 10,
          marginBottom: 16,
          fontSize: 14,
        }}
      />

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Schedule</Text>
      <TextInput
        placeholder="e.g., Mon, Wed, Fri 5:30pm"
        value={schedule}
        onChangeText={setSchedule}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 10,
          marginBottom: 16,
          fontSize: 14,
        }}
      />

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Frequency</Text>
      <Picker selectedValue={frequency} onValueChange={setFrequency} style={{ marginBottom: 24 }}>
        <Picker.Item label="Weekly" value="weekly" />
        <Picker.Item label="Bi-weekly" value="biweekly" />
        <Picker.Item label="Monthly" value="monthly" />
        <Picker.Item label="Daily" value="daily" />
      </Picker>

      <TouchableOpacity
        onPress={handleAddService}
        disabled={loading}
        style={{
          backgroundColor: '#2ecc71',
          padding: 14,
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          {loading ? 'Adding...' : `✓ Add ${serviceType}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClose}
        style={{
          backgroundColor: '#ecf0f1',
          padding: 14,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: '#333', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          Cancel
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MultiServiceForm;
