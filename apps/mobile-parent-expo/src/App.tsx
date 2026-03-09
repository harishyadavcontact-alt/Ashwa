import type {
  ChildUpsertInput,
  CurrentAssignmentState,
  CurrentTripState,
  DriverServiceSummary,
  TimelineEventSummary,
} from '@ashwa/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { io } from 'socket.io-client';
import { api } from './api';
import { API_BASE_URL } from './config';
import { colors } from './theme';

type Screen = 'auth' | 'home' | 'children' | 'drivers' | 'track';

type ChildRecord = ChildUpsertInput & { id: string };
type InstitutionRecord = { id: string; name: string; address: string; type: string };

const SESSION_KEY = 'ashwa.parent.session';

const emptyChildDraft = (institutionId = ''): ChildUpsertInput => ({
  name: '',
  institutionId,
  pickupAddress: '',
  pickupLat: 12.97,
  pickupLng: 77.59,
  dropAddress: '',
  dropLat: 12.98,
  dropLng: 77.61,
  emergencyPhone: '',
});

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.metric}>{body}</Text>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('parent@ashwa.app');
  const [password, setPassword] = useState('Password123');
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverServiceSummary[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverServiceSummary | null>(null);
  const [assignmentState, setAssignmentState] = useState<CurrentAssignmentState | null>(null);
  const [tripState, setTripState] = useState<CurrentTripState | null>(null);
  const [events, setEvents] = useState<TimelineEventSummary[]>([]);
  const [driverLoc, setDriverLoc] = useState({ latitude: 12.97, longitude: 77.59 });
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childDraft, setChildDraft] = useState<ChildUpsertInput>(emptyChildDraft());
  const [status, setStatus] = useState('Sign in to see child status, driver trust, and trip readiness.');
  const [loading, setLoading] = useState(false);

  const assignment = assignmentState?.primary || null;
  const trip = tripState?.trip || null;
  const primaryChild = children[0] || null;

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((value) => {
      if (!value) return;
      setToken(value);
      setScreen('home');
    });
    api
      .listInstitutions()
      .then((items) => {
        setInstitutions(items);
        setChildDraft((current) => ({
          ...current,
          institutionId: current.institutionId || items[0]?.id || '',
        }));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshHome();
    registerDeviceToken(token);
  }, [token]);

  useEffect(() => {
    if (!token || !trip?.id) return;
    api
      .tripTimeline(token, trip.id)
      .then((result) => setEvents(result.timeline))
      .catch(() => undefined);
    const socket = io(`${API_BASE_URL}/ws`, { auth: { token } });
    socket.emit('subscribe', { tripId: trip.id, driverId: assignment?.driver?.id });
    socket.on('location', (payload: { lat: number; lng: number }) => {
      setDriverLoc({ latitude: payload.lat, longitude: payload.lng });
    });
    return () => socket.close();
  }, [assignment?.driver?.id, token, trip?.id]);

  async function registerDeviceToken(sessionToken: string) {
    try {
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus('Notifications are off. Tracking still works, but proactive alerts are muted.');
        return;
      }
      const pushToken = await Notifications.getDevicePushTokenAsync();
      await api.saveDeviceToken(sessionToken, String(pushToken.data), Platform.OS);
      setStatus('Notifications and live trip alerts are ready.');
    } catch {
      setStatus('Signed in. Device token registration will complete on supported hardware.');
    }
  }

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

  function beginNewChild() {
    setEditingChildId(null);
    setChildDraft(emptyChildDraft(institutions[0]?.id || ''));
  }

  function editChild(child: ChildRecord) {
    setEditingChildId(child.id);
    setChildDraft({
      name: child.name,
      institutionId: child.institutionId,
      pickupAddress: child.pickupAddress,
      pickupLat: child.pickupLat,
      pickupLng: child.pickupLng,
      dropAddress: child.dropAddress,
      dropLat: child.dropLat,
      dropLng: child.dropLng,
      emergencyPhone: child.emergencyPhone,
    });
  }

  async function saveChild() {
    if (!token) return;
    setLoading(true);
    try {
      if (editingChildId) {
        await api.updateChild(token, editingChildId, childDraft);
        setStatus('Child profile updated. Matching and tracking now reflect the latest route details.');
      } else {
        await api.createChild(token, childDraft);
        setStatus('Child saved. You can now look for a matching verified driver.');
      }
      beginNewChild();
      await refreshHome();
    } catch (error: any) {
      setStatus(error.message || 'Could not save child.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteChild(id: string) {
    if (!token) return;
    setLoading(true);
    try {
      await api.deleteChild(token, id);
      if (editingChildId === id) beginNewChild();
      await refreshHome();
      setStatus('Child removed.');
    } catch (error: any) {
      setStatus(error.message || 'Could not delete child.');
    } finally {
      setLoading(false);
    }
  }

  async function searchDrivers() {
    if (!primaryChild) {
      setStatus('Add a child first so the app can search with a real pickup context.');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(primaryChild.pickupLat),
        lng: String(primaryChild.pickupLng),
        radius: '10000',
        institutionId: primaryChild.institutionId,
      });
      const result = await api.searchDrivers(params);
      setDrivers(result);
      setSelectedDriver(null);
      setScreen('drivers');
      setStatus(result.length ? 'Search ranked verified drivers by service fit and proximity.' : 'No verified drivers matched this child yet.');
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
    if (!token || !selectedDriver || !primaryChild) return;
    setLoading(true);
    try {
      await api.requestAssignment(token, {
        childId: primaryChild.id,
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

  async function cancelAssignment() {
    if (!token || !assignment) return;
    setLoading(true);
    try {
      await api.cancelAssignment(token, assignment.id);
      await refreshHome();
      setStatus('Assignment cancelled.');
    } catch (error: any) {
      setStatus(error.message || 'Could not cancel assignment.');
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
    setSelectedDriver(null);
    setEditingChildId(null);
    beginNewChild();
  }

  const childStatus = useMemo(() => {
    if (!children.length) return 'No child profile yet';
    if (trip?.status === 'ACTIVE') return 'Trip live';
    if (assignment?.status === 'ACCEPTED') return 'Driver assigned';
    if (assignment?.status === 'REQUESTED') return 'Awaiting driver response';
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
          <Text style={styles.bodyDark}>Keep the route facts explicit so matching, trust, and tracking stay reliable.</Text>
          {loading ? <ActivityIndicator color={colors.accent} /> : null}
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>{editingChildId ? 'Edit child' : 'Add child'}</Text>
            <TextInput value={childDraft.name} onChangeText={(value) => setChildDraft({ ...childDraft, name: value })} placeholder="Child name" style={styles.input} />
            <View style={styles.chips}>
              {institutions.map((institution) => (
                <Button
                  key={institution.id}
                  title={institution.name}
                  onPress={() => setChildDraft({ ...childDraft, institutionId: institution.id })}
                  color={childDraft.institutionId === institution.id ? colors.accent : undefined}
                />
              ))}
            </View>
            <Text style={styles.metric}>Institution: {institutions.find((institution) => institution.id === childDraft.institutionId)?.name || 'Select one'}</Text>
            <TextInput value={childDraft.pickupAddress} onChangeText={(value) => setChildDraft({ ...childDraft, pickupAddress: value })} placeholder="Pickup address" style={styles.input} />
            <TextInput value={childDraft.dropAddress} onChangeText={(value) => setChildDraft({ ...childDraft, dropAddress: value })} placeholder="Drop address" style={styles.input} />
            <TextInput value={childDraft.emergencyPhone} onChangeText={(value) => setChildDraft({ ...childDraft, emergencyPhone: value })} placeholder="Emergency phone" style={styles.input} />
            <Button title={editingChildId ? 'Save changes' : 'Save child'} onPress={saveChild} />
            {editingChildId ? <Button title="Start new child" onPress={beginNewChild} /> : null}
          </View>
          {children.length ? (
            children.map((child) => (
              <View key={child.id} style={styles.cardInline}>
                <Text style={styles.cardTitle}>{child.name}</Text>
                <Text style={styles.metric}>{institutions.find((institution) => institution.id === child.institutionId)?.name || 'Institution pending'}</Text>
                <Text style={styles.metric}>Pickup: {child.pickupAddress}</Text>
                <Text style={styles.metric}>Drop: {child.dropAddress}</Text>
                <View style={styles.actions}>
                  <Button title="Edit" onPress={() => editChild(child)} />
                  <Button title="Delete" onPress={() => deleteChild(child.id)} />
                </View>
              </View>
            ))
          ) : (
            <EmptyState title="No child profile yet" body="Create the first child record before searching for drivers." />
          )}
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
              <Text style={styles.metric}>Institution fit: {selectedDriver.institutions.map((institution) => institution.name).join(', ') || 'Not configured'}</Text>
              <Text style={styles.metric}>Missing: {selectedDriver.trust.missingItems.join(', ') || 'None'}</Text>
              <Button title="Request seat" onPress={requestAssignment} />
            </View>
          ) : null}
          {drivers.length ? (
            <FlatList
              data={drivers}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.metric}>
                      {item.verificationStatus} | {item.trust.isServiceReady ? 'Ready' : 'Needs review'} | {item.vehicle?.makeModel || 'Vehicle pending'}
                    </Text>
                    <Text style={styles.metric}>{item.serviceArea || 'Service area not set'}</Text>
                  </View>
                  <Button title="Inspect" onPress={() => inspectDriver(item.id)} />
                </View>
              )}
            />
          ) : (
            <EmptyState title="No drivers found" body="Expand the pilot pool or adjust the child profile before trying again." />
          )}
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
          <Text style={styles.metric}>{tripState?.nextAction?.label || 'Waiting for the next operational transition'}</Text>
        </View>
        {trip ? (
          <MapView
            style={styles.map}
            initialRegion={{ ...driverLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            region={{ ...driverLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          >
            <Marker coordinate={driverLoc} title="Driver" />
          </MapView>
        ) : (
          <EmptyState title="Tracking is idle" body="The map activates only after the assigned driver starts a trip." />
        )}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent timeline</Text>
          {events.length ? (
            events.slice(-4).map((event) => (
              <Text key={event.id} style={styles.metric}>
                {event.eventType.replaceAll('_', ' ')} | {event.childName}
              </Text>
            ))
          ) : (
            <Text style={styles.metric}>No trip events yet.</Text>
          )}
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
          <Text style={styles.metric}>{assignment?.driver?.name || 'No active assignment yet'}</Text>
          <Text style={styles.metric}>Trust state: {assignment?.driver?.verificationStatus || 'Unknown'}</Text>
          <Text style={styles.metric}>Service readiness: {assignment?.driver?.trust?.isServiceReady ? 'Ready' : 'Not ready'}</Text>
          {assignment ? <Button title="Cancel assignment" onPress={cancelAssignment} /> : null}
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Trip readiness</Text>
          <Text style={styles.metric}>{trip ? `${trip.tripType} trip is ${trip.status}` : 'No active trip'}</Text>
          <Text style={styles.metric}>Next stop: {tripState?.nextStop?.address || 'No next stop'}</Text>
          <Text style={styles.metric}>{tripState?.nextAction?.label || 'Waiting for driver action'}</Text>
          <Text style={styles.metric}>{children.length} child profile(s) on file</Text>
        </View>
        {!children.length ? (
          <EmptyState title="Start with the child record" body="Without that, driver discovery and route matching are still guesses." />
        ) : null}
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
  emptyCard: { backgroundColor: '#f6efe4', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#ddcfb5', gap: 10 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  metric: { color: colors.muted, fontSize: 14 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fbfaf7' },
  status: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  listRow: { padding: 16, backgroundColor: colors.panel, borderRadius: 16, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  actions: { gap: 10, paddingBottom: 24 },
  chips: { gap: 10 },
  map: { flex: 1, margin: 20, borderRadius: 18 },
});
