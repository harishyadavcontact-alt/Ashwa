import type { CurrentAssignmentState, CurrentTripState, DriverServiceSummary, TimelineEventSummary } from '@ashwa/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Notifications from 'expo-notifications';
import { io } from 'socket.io-client';
import { api } from './api';
import { API_BASE_URL } from './config';
import { colors } from './theme';

type Screen = 'auth' | 'home' | 'children' | 'drivers' | 'track';

const SESSION_KEY = 'ashwa.parent.session';

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('parent@ashwa.app');
  const [password, setPassword] = useState('Password123');
  const [children, setChildren] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<DriverServiceSummary[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverServiceSummary | null>(null);
  const [assignmentState, setAssignmentState] = useState<CurrentAssignmentState | null>(null);
  const [tripState, setTripState] = useState<CurrentTripState | null>(null);
  const [events, setEvents] = useState<TimelineEventSummary[]>([]);
  const [driverLoc, setDriverLoc] = useState({ latitude: 12.97, longitude: 77.59 });
  const [childDraft, setChildDraft] = useState({
    name: '',
    institutionId: '',
    pickupAddress: '',
    pickupLat: 12.97,
    pickupLng: 77.59,
    dropAddress: '',
    dropLat: 12.98,
    dropLng: 77.61,
    emergencyPhone: '',
  });
  const [status, setStatus] = useState('Sign in to see trip readiness, trust state, and next action.');
  const [loading, setLoading] = useState(false);

  const assignment = assignmentState?.primary || null;
  const trip = tripState?.trip || null;

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((value) => {
      if (!value) return;
      setToken(value);
      setScreen('home');
    });
    Notifications.requestPermissionsAsync().then((result) => {
      setStatus(
        result.granted
          ? 'Notifications ready. Live trip changes can surface immediately.'
          : 'Notifications are off. Tracking still works, but proactive alerts are muted.',
      );
    });
    api.listInstitutions().then(setInstitutions).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshHome();
  }, [token]);

  useEffect(() => {
    if (!token || !trip?.id) return;
    api
      .tripTimeline(token, trip.id)
      .then((result) => setEvents(result.timeline))
      .catch(() => undefined);
    const socket = io(`${API_BASE_URL}/ws`, { auth: { token } });
    socket.emit('subscribe', { tripId: trip.id, driverId: assignment?.driver?.id });
    socket.on('location', (payload: any) => {
      setDriverLoc({ latitude: payload.lat, longitude: payload.lng });
    });
    return () => socket.close();
  }, [assignment?.driver?.id, token, trip?.id]);

  async function refreshHome() {
    try {
      const [childrenData, assignmentData, nextTripState] = await Promise.all([
        api.listChildren(token),
        api.currentAssignment(token),
        api.currentTrip(token),
      ]);
      setChildren(childrenData);
      setAssignmentState(assignmentData);
      setTripState(nextTripState);
      setEvents(nextTripState.timeline || []);
      if (nextTripState.latestLocation) {
        setDriverLoc({
          latitude: nextTripState.latestLocation.lat,
          longitude: nextTripState.latestLocation.lng,
        });
      }
    } catch (error: any) {
      setStatus(error.message || 'Unable to refresh current state.');
    }
  }

  async function login() {
    setLoading(true);
    try {
      const result = await api.login(email, password);
      await AsyncStorage.setItem(SESSION_KEY, result.accessToken);
      setToken(result.accessToken);
      setScreen('home');
      setStatus('Signed in. Review child status and assignment state below.');
    } catch (error: any) {
      setStatus(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function createChild() {
    if (!token) return;
    setLoading(true);
    try {
      await api.createChild(token, childDraft);
      setChildDraft({
        name: '',
        institutionId: institutions[0]?.id || '',
        pickupAddress: '',
        pickupLat: 12.97,
        pickupLng: 77.59,
        dropAddress: '',
        dropLat: 12.98,
        dropLng: 77.61,
        emergencyPhone: '',
      });
      await refreshHome();
      setStatus('Child saved. You can now look for a matching verified driver.');
    } catch (error: any) {
      setStatus(error.message || 'Could not save child.');
    } finally {
      setLoading(false);
    }
  }

  async function searchDrivers() {
    if (!children.length) {
      setStatus('Add a child first so the app can search with a real pickup context.');
      return;
    }
    setLoading(true);
    try {
      const primaryChild = children[0];
      const params = new URLSearchParams({
        lat: String(primaryChild.pickupLat),
        lng: String(primaryChild.pickupLng),
        radius: '10000',
        institutionId: primaryChild.institutionId,
      });
      const result = await api.searchDrivers(params);
      setDrivers(result);
      setScreen('drivers');
      setStatus('Search ranked verified drivers by service fit and proximity.');
    } catch (error: any) {
      setStatus(error.message || 'Driver search failed.');
    } finally {
      setLoading(false);
    }
  }

  async function inspectDriver(driverId: string) {
    setLoading(true);
    try {
      const summary = await api.driverSummary(driverId);
      setSelectedDriver(summary);
      setStatus('Review trust indicators before requesting a seat.');
    } catch (error: any) {
      setStatus(error.message || 'Could not load driver summary.');
    } finally {
      setLoading(false);
    }
  }

  async function requestAssignment() {
    if (!token || !selectedDriver || !children.length) return;
    setLoading(true);
    try {
      await api.requestAssignment(token, {
        childId: children[0].id,
        driverId: selectedDriver.id,
        startDate: new Date().toISOString(),
      });
      await refreshHome();
      setScreen('home');
      setStatus('Seat request sent. Watch trust state and trip readiness from home.');
    } catch (error: any) {
      setStatus(error.message || 'Could not request assignment.');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setToken('');
    setScreen('auth');
    setAssignmentState(null);
    setTripState(null);
    setChildren([]);
    setDrivers([]);
    setEvents([]);
  }

  const childStatus = useMemo(() => {
    if (!children.length) return 'No child profile yet';
    if (trip?.status === 'ACTIVE') return 'Trip live';
    if (assignment?.status === 'ACCEPTED') return 'Driver assigned';
    return 'Needs assignment';
  }, [assignment?.status, children.length, trip?.status]);

  if (screen === 'auth') {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Ashwa Parent</Text>
          <Text style={styles.titleLight}>See what matters now.</Text>
          <Text style={styles.bodyLight}>
            Child state, driver trust, and trip readiness stay visible without hunting through menus.
          </Text>
        </View>
        <View style={styles.card}>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" style={styles.input} autoCapitalize="none" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" style={styles.input} secureTextEntry />
          <Button title={loading ? 'Signing in...' : 'Sign in'} onPress={login} disabled={loading} />
          <Text style={styles.status}>{status}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'children') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Child profile</Text>
          <Text style={styles.bodyDark}>Capture the operational basics once so matching and tracking stay reliable.</Text>
          <View style={styles.cardInline}>
            <TextInput value={childDraft.name} onChangeText={(value) => setChildDraft({ ...childDraft, name: value })} placeholder="Child name" style={styles.input} />
            <TextInput value={childDraft.institutionId} onChangeText={(value) => setChildDraft({ ...childDraft, institutionId: value })} placeholder={institutions[0]?.id || 'Institution id'} style={styles.input} />
            <TextInput value={childDraft.pickupAddress} onChangeText={(value) => setChildDraft({ ...childDraft, pickupAddress: value })} placeholder="Pickup address" style={styles.input} />
            <TextInput value={childDraft.dropAddress} onChangeText={(value) => setChildDraft({ ...childDraft, dropAddress: value })} placeholder="Drop address" style={styles.input} />
            <TextInput value={childDraft.emergencyPhone} onChangeText={(value) => setChildDraft({ ...childDraft, emergencyPhone: value })} placeholder="Emergency phone" style={styles.input} />
            <Button title="Save child" onPress={createChild} />
          </View>
          <Button title="Back home" onPress={() => setScreen('home')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'drivers') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Verified driver matches</Text>
          <Text style={styles.bodyDark}>Trust markers and service fit lead this view; copy comes second.</Text>
          {loading ? <ActivityIndicator color={colors.accent} /> : null}
          {selectedDriver ? (
            <View style={styles.cardInline}>
              <Text style={styles.cardTitle}>{selectedDriver.name}</Text>
              <Text style={styles.metric}>Verification: {selectedDriver.verificationStatus}</Text>
              <Text style={styles.metric}>Readiness: {selectedDriver.trust.isServiceReady ? 'Ready for parent requests' : 'Needs review'}</Text>
              <Text style={styles.metric}>Vehicle: {selectedDriver.vehicle?.makeModel || 'Not added yet'}</Text>
              <Text style={styles.metric}>Seats: {selectedDriver.vehicle?.seatsCapacity || 'Unknown'}</Text>
              <Text style={styles.metric}>Missing: {selectedDriver.trust.missingItems.join(', ') || 'None'}</Text>
              <Button title="Request seat" onPress={requestAssignment} />
            </View>
          ) : null}
          <FlatList
            data={drivers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.metric}>
                    {item.verificationStatus} | {item.trust.isServiceReady ? 'Ready' : 'Needs review'} | {item.vehicle?.makeModel || 'Vehicle pending'}
                  </Text>
                </View>
                <Button title="Inspect" onPress={() => inspectDriver(item.id)} />
              </View>
            )}
          />
          <Button title="Back home" onPress={() => setScreen('home')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'track') {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.stack}>
          <Text style={styles.titleDark}>Trip tracking</Text>
          <Text style={styles.bodyDark}>{trip ? `Current trip: ${trip.tripType} | ${trip.status}` : 'No active trip yet'}</Text>
          <Text style={styles.metric}>Next stop: {tripState?.nextStop?.address || 'No next stop'}</Text>
        </View>
        <MapView style={styles.map} initialRegion={{ ...driverLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 }} region={{ ...driverLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
          <Marker coordinate={driverLoc} title="Driver" />
        </MapView>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent timeline</Text>
          {events.slice(-4).map((event) => (
            <Text key={event.id} style={styles.metric}>{event.eventType.replaceAll('_', ' ')}</Text>
          ))}
        </View>
        <Button title="Back home" onPress={() => setScreen('home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.stack}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Child status now</Text>
          <Text style={styles.titleDark}>{childStatus}</Text>
          <Text style={styles.bodyDark}>{status}</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Assigned driver</Text>
          <Text style={styles.metric}>{assignment?.driver?.name || 'No accepted driver yet'}</Text>
          <Text style={styles.metric}>Trust state: {assignment?.driver?.verificationStatus || 'Unknown'}</Text>
          <Text style={styles.metric}>Service readiness: {assignment?.driver?.trust?.isServiceReady ? 'Ready' : 'Not ready'}</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Trip readiness</Text>
          <Text style={styles.metric}>{trip ? `${trip.tripType} trip is ${trip.status}` : 'No active trip'}</Text>
          <Text style={styles.metric}>Next stop: {tripState?.nextStop?.address || 'No next stop'}</Text>
          <Text style={styles.metric}>{children.length} child profile(s) on file</Text>
        </View>
        <View style={styles.actions}>
          <Button title="Manage children" onPress={() => setScreen('children')} />
          <Button title="Find driver" onPress={searchDrivers} />
          <Button title="Open tracking" onPress={() => setScreen('track')} />
          <Button title="Refresh state" onPress={refreshHome} />
          <Button title="Sign out" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  stack: { padding: 20, gap: 16 },
  hero: { padding: 20, backgroundColor: colors.ink, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 10 },
  heroCard: { padding: 20, backgroundColor: '#e5efe9', borderRadius: 24, gap: 10 },
  kicker: { color: colors.accent, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  titleLight: { color: colors.panel, fontSize: 28, fontWeight: '700' },
  titleDark: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  bodyLight: { color: '#dde4ea', fontSize: 15, lineHeight: 22 },
  bodyDark: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: colors.panel, marginHorizontal: 20, marginTop: 16, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.line, gap: 10 },
  cardInline: { backgroundColor: colors.panel, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.line, gap: 10 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  metric: { color: colors.muted, fontSize: 14 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fbfaf7' },
  status: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  listRow: { padding: 16, backgroundColor: colors.panel, borderRadius: 16, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  actions: { gap: 10, paddingBottom: 24 },
  map: { flex: 1, margin: 20, borderRadius: 18 },
});
