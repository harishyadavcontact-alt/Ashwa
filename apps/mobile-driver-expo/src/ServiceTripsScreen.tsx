import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from './api';

const ServiceTripsScreen = ({ driverId }) => {
  const [driverServices, setDriverServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchDriverServices();
  }, [driverId]);

  const fetchDriverServices = async () => {
    try {
      const response = await api.get(`/api/services/driver/${driverId}`);
      setDriverServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Demo fallback
      setDriverServices([
        {
          id: 'DSVC-ABC123',
          driverId,
          serviceType: 'dance',
          description: 'Dance class pickups and drops',
          baseRate: 50,
          areasServiced: ['Delhi Dance Academy', 'Kathak Studio'],
          active: true,
        },
        {
          id: 'DSVC-DEF456',
          driverId,
          serviceType: 'tuition',
          description: 'Tuition center services',
          baseRate: 40,
          areasServiced: ['Math Masters', 'English Coaching Center'],
          active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    // Open form to add new service type
    alert('Add Service: Select service type, description, and areas served');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Services You Offer
      </Text>

      {driverServices.length === 0 ? (
        <View style={{ backgroundColor: '#ecf0f1', padding: 16, borderRadius: 8 }}>
          <Text style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>
            You haven't added any services yet. Add service types to get trips outside of school runs.
          </Text>
          <TouchableOpacity
            onPress={handleAddService}
            style={{
              backgroundColor: '#2ecc71',
              padding: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
              ➕ Add Service Type
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        driverServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            onPress={() => setSelectedService(selectedService?.id === service.id ? null : service)}
            style={{
              backgroundColor: '#f8f9fa',
              padding: 14,
              borderRadius: 8,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: service.serviceType === 'dance' ? '#e74c3c' : '#3498db',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', textTransform: 'capitalize' }}>
                  {service.serviceType}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {service.description}
                </Text>
                <Text style={{ fontSize: 14, color: '#27ae60', fontWeight: '600', marginTop: 8 }}>
                  ₹{service.baseRate}/trip
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#bdc3c7' }}>
                {selectedService?.id === service.id ? '▼' : '▶'}
              </Text>
            </View>

            {selectedService?.id === service.id && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#ddd' }}>
                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Areas Serviced:</Text>
                {service.areasServiced.map((area, idx) => (
                  <Text key={idx} style={{ fontSize: 13, color: '#555', marginBottom: 4, paddingLeft: 8 }}>
                    • {area}
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        onPress={handleAddService}
        style={{
          backgroundColor: '#2ecc71',
          padding: 14,
          borderRadius: 8,
          marginTop: 16,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          ➕ Add New Service
        </Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

export default ServiceTripsScreen;
