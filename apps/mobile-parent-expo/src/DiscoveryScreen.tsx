import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

// TODO: Later, replace with real API integration
const mockSearch = async (school: string, pickupLat: number, pickupLng: number) => {
  // Simulated API call
  return [
    {
      driverId: 'DRV-001',
      name: 'Rajesh Kumar',
      rating: 4.8,
      familiesServed: 12,
      costPerFamily: 2000,
      reviews: [{ parentName: 'Parent A', text: 'Very reliable', rating: 5 }],
    },
    {
      driverId: 'DRV-002',
      name: 'Priya Sharma',
      rating: 4.9,
      familiesServed: 10,
      costPerFamily: 1800,
      reviews: [{ parentName: 'Parent B', text: 'Excellent service', rating: 5 }],
    },
    {
      driverId: 'DRV-003',
      name: 'Ahmed Hassan',
      rating: 4.7,
      familiesServed: 15,
      costPerFamily: 2200,
      reviews: [{ parentName: 'Parent C', text: 'Punctual and friendly', rating: 5 }],
    },
  ];
};

const DiscoveryScreen = ({ onSelectDriver }: { onSelectDriver: (driver: any) => void }) => {
  const [school, setSchool] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    // Get user location
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!school.trim() || !location) {
      alert('Please enter school name and allow location access');
      return;
    }

    setLoading(true);
    try {
      // TODO: Later, call real API: GET /api/discovery/search?school=...&pickupLat=...&pickupLng=...
      const results = await mockSearch(school, location.latitude, location.longitude);
      setDrivers(results);
    } catch (error) {
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const DriverCard = ({ driver }: { driver: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectDriver(driver)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.rating}>⭐ {driver.rating}</Text>
      </View>
      <Text style={styles.detail}>Families served: {driver.familiesServed}</Text>
      <Text style={styles.detail}>Cost: ₹{driver.costPerFamily}/month</Text>
      {driver.reviews[0] && (
        <Text style={styles.review}>"{driver.reviews[0].text}"</Text>
      )}
      <TouchableOpacity style={styles.sendButton}>
        <Text style={styles.buttonText}>Send Request</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Your Driver</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter school name"
        value={school}
        onChangeText={setSchool}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Search Nearby Drivers</Text>
        )}
      </TouchableOpacity>

      {drivers.length > 0 && (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item.driverId}
          renderItem={({ item }) => <DriverCard driver={item} />}
          scrollEnabled={true}
          contentContainerStyle={styles.list}
        />
      )}

      {!loading && drivers.length === 0 && school.trim() && (
        <Text style={styles.noResults}>No drivers found for "{school}"</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#ffc72c',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc72c',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rating: {
    fontSize: 14,
    color: '#f39c12',
  },
  detail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  review: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#999',
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    fontSize: 14,
  },
});

export default DiscoveryScreen;
