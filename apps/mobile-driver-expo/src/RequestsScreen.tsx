import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';

// TODO: Later, replace with real API integration
const mockGetRequests = async (driverId: string) => {
  return [
    {
      id: 'REQ-001',
      childName: 'Arjun',
      school: 'Delhi Public School',
      pickupLat: 28.5,
      pickupLng: 77.4,
      status: 'pending',
      requestedAt: new Date(),
    },
    {
      id: 'REQ-002',
      childName: 'Priya',
      school: 'St Columba High School',
      pickupLat: 28.55,
      pickupLng: 77.45,
      status: 'pending',
      requestedAt: new Date(),
    },
  ];
};

const RequestsScreen = ({ driverId }: { driverId: string }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      // TODO: Later, call real API: GET /api/discovery/requests/driver/{driverId}
      const data = await mockGetRequests(driverId);
      setRequests(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      // TODO: Later, call real API: POST /api/discovery/requests/{requestId}/accept
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'accepted' } : r))
      );
      Alert.alert('Success', 'Family request accepted! They are now linked to you.');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      // TODO: Later, call real API: POST /api/discovery/requests/{requestId}/reject
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      Alert.alert('Request rejected');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const RequestCard = ({ request }: { request: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.childName}>{request.childName}</Text>
        <Text style={[styles.status, request.status === 'accepted' && styles.statusAccepted]}>
          {request.status === 'pending' ? '⏳ Pending' : '✓ Accepted'}
        </Text>
      </View>

      <Text style={styles.detail}>School: {request.school}</Text>
      <Text style={styles.detail}>Location: {request.pickupLat.toFixed(3)}, {request.pickupLng.toFixed(3)}</Text>
      <Text style={styles.time}>Requested: {new Date(request.requestedAt).toLocaleTimeString()}</Text>

      {request.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(request.id)}
          >
            <Text style={styles.buttonText}>✓ Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleReject(request.id)}
          >
            <Text style={styles.buttonText}>✗ Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'accepted' && (
        <Text style={styles.acceptedText}>Family linked to your route ✓</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffc72c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Requests ({requests.filter(r => r.status === 'pending').length})</Text>

      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No family requests yet</Text>
          <Text style={styles.emptySubtext}>Share your invite code with parents to receive requests</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RequestCard request={item} />}
          scrollEnabled={true}
          contentContainerStyle={styles.list}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
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
    alignItems: 'center',
    marginBottom: 10,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9500',
  },
  statusAccepted: {
    color: '#2ecc71',
  },
  detail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  acceptedText: {
    fontSize: 13,
    color: '#2ecc71',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RequestsScreen;
