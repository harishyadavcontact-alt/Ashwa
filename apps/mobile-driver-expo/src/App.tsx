import type { CurrentAssignmentState, CurrentTripState, DriverServiceSummary, EventType } from '@ashwa/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
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
import { api } from './api';
import { colors } from './theme';

type Screen = 'auth' | 'onboarding' | 'inbox' | 'trip';

const SESSION_KEY = 'ashwa.driver.session';

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
  const [email, setEmail] = useState('driver@ashwa.app');
  const [password, setPassword] = useState('Password123');
  const [incomingState, setIncomingState] = useState<CurrentAssignmentState | null>(null);
  const [assignmentState, setAssignmentState] = useState<CurrentAssignmentState | null>(null);
  const [tripState, setTripState] = useState<CurrentTripState | null>(null);
  const [driverSummary, setDriverSummary] = useState<DriverServiceSummary | null>(null);
  const [profile, setProfile] = useState({
    name: 'Ashwa Driver',
    serviceArea: 'South Bengaluru',
    baseLat: 12.97,
    baseLng: 77.59,
  });
  const [serviceInfo, setServiceInfo] = useState({
    institutionIds: '',
    makeModel: 'Toyota HiAce',
    seatsCapacity: '12',
    plateNumber: 'KA-01-0001',
  });
  const [locationMode, setLocationMode] = useState({
    foregroundReady: false,
    backgroundReady: false,
  });
  const [status, setStatus] = useState('Sign in to see the next operational action.');
  const [loading, setLoading] = useState(false);

  const incoming = incomingState?.items || [];
  const accepted = assignmentState?.items || [];
  const trip = tripState?.trip || null;
  const focusedChildId = tripState?.nextAction?.childId || tripState?.manifest[0]?.id || '';

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((value) => {
      if (!value) return;
      setToken(value);
      setScreen('trip');
    });
    bootstrapLocationMode();
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token]);

  useEffect(() => {
    if (!token || !trip?.id || !locationMode.foregroundReady) return;
    const timer = setInterval(() => {
      pingLocation('Foreground sync is active while this dashboard stays open.');
    }, 20000);
    return () => clearInterval(timer);
  }, [locationMode.foregroundReady, token, trip?.id]);

  async function bootstrapLocationMode() {
    try {
      const foreground = await Location.requestForegroundPermissionsAsync();
      const background = await Location.requestBackgroundPermissionsAsync();
      setLocationMode({
        foregroundReady: foreground.granted,
        backgroundReady: background.granted,
      });
      setStatus(
        foreground.granted
          ? background.granted
            ? 'Foreground and background location are ready for pilot operations.'
            : 'Foreground location is ready. Background mode still needs device approval.'
          : 'Location access is off. Trip tracking cannot be trusted until enabled.',
      );
    } catch {
      setStatus('Location permission flow is unavailable on this device profile.');
    }
  }

  async function refresh() {
    try {
      const [nextIncomingState, nextAssignmentState, nextTripState, summary] = await Promise.all([
        api.incomingAssignments(token),
        api.currentAssignments(token),
        api.currentTrip(token),
        api.meSummary(token),
      ]);
      setIncomingState(nextIncomingState);
      setAssignmentState(nextAssignmentState);
      setTripState(nextTripState);
      setDriverSummary(summary);
    } catch (error: any) {
      setStatus(error.message || 'Could not refresh driver state.');
    }
  }

  async function login() {
    setLoading(true);
    try {
      const result = await api.login(email, password);
      await AsyncStorage.setItem(SESSION_KEY, result.accessToken);
      setToken(result.accessToken);
      setScreen('onboarding');
      setStatus('Signed in. Complete service details and then move into the inbox.');
    } catch (error: any) {
      setStatus(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function saveOnboarding() {
    if (!token) return;
    setLoading(true);
    try {
      await api.onboard(token, {
        licenseDocUrl: '/local/license.png',
        vehicleRegDocUrl: '/local/vehicle-registration.png',
        idProofUrl: '/local/id-proof.png',
        vehiclePhotoUrl: '/local/vehicle-photo.png',
      });
      await api.saveProfile(token, profile);
      await api.saveServiceInfo(token, {
        institutionIds: serviceInfo.institutionIds
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        serviceArea: profile.serviceArea,
        baseLat: profile.baseLat,
        baseLng: profile.baseLng,
        vehicle: {
          makeModel: serviceInfo.makeModel,
          seatsCapacity: Number(serviceInfo.seatsCapacity),
          plateNumber: serviceInfo.plateNumber,
        },
      });
      await refresh();
      setScreen('inbox');
      setStatus('Service profile saved. Review incoming requests next.');
    } catch (error: any) {
      setStatus(error.message || 'Could not save onboarding state.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignment(action: 'accept' | 'reject', id: string) {
    if (!token) return;
    setLoading(true);
    try {
      if (action === 'accept') await api.acceptAssignment(token, id);
      else await api.rejectAssignment(token, id);
      await refresh();
      setStatus(`Assignment ${action}ed.`);
    } catch (error: any) {
      setStatus(error.message || `Could not ${action} assignment.`);
    } finally {
      setLoading(false);
    }
  }

  async function startTrip(tripType: 'MORNING' | 'AFTERNOON') {
    if (!token) return;
    setLoading(true);
    try {
      const current = await api.startTrip(token, tripType);
      setTripState(current);
      setScreen('trip');
      setStatus('Trip started. Next action is visible below.');
    } catch (error: any) {
      setStatus(error.message || 'Could not start trip.');
    } finally {
      setLoading(false);
    }
  }

  async function endTrip() {
    if (!token || !trip?.id) return;
    setLoading(true);
    try {
      await api.endTrip(token, trip.id);
      await refresh();
      setStatus('Trip ended.');
    } catch (error: any) {
      setStatus(error.message || 'Could not end trip.');
    } finally {
      setLoading(false);
    }
  }

  async function pingLocation(successMessage?: string) {
    if (!token || !trip?.id) return;
    try {
      const loc = await Location.getCurrentPositionAsync({});
      await api.ping(token, trip.id, loc.coords.latitude, loc.coords.longitude);
      if (successMessage) setStatus(successMessage);
      await refresh();
    } catch (error: any) {
      setStatus(error.message || 'Could not send location ping.');
    }
  }

  async function emitEvent(eventType: EventType) {
    if (!token || !trip?.id || !focusedChildId) {
      setStatus('The current stop has no valid child anchor yet.');
      return;
    }
    setLoading(true);
    try {
      await api.emitEvent(token, trip.id, focusedChildId, eventType);
      setStatus(`Event emitted: ${eventType.replaceAll('_', ' ')}`);
      await refresh();
    } catch (error: any) {
      setStatus(error.message || 'Could not emit trip event.');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setToken('');
    setScreen('auth');
    setIncomingState(null);
    setAssignmentState(null);
    setTripState(null);
    setDriverSummary(null);
  }

  const nextAction = useMemo(() => {
    if (tripState?.nextAction?.label) return tripState.nextAction.label;
    if (incoming.length) return 'Review incoming seat requests';
    if (accepted.length) return 'Start the next assigned trip';
    return 'Complete onboarding and wait for assignments';
  }, [accepted.length, incoming.length, tripState?.nextAction?.label]);

  if (screen === 'auth') {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Ashwa Driver</Text>
          <Text style={styles.titleLight}>Operate, do not improvise.</Text>
          <Text style={styles.bodyLight}>The screen should always tell the driver the next correct action.</Text>
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

  if (screen === 'onboarding') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Service setup</Text>
          <Text style={styles.bodyDark}>Complete the operational profile once so trust state and matching remain explicit.</Text>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Verification status</Text>
            <Text style={styles.metric}>{driverSummary?.verificationStatus || 'PENDING'}</Text>
            <Text style={styles.metric}>Readiness: {driverSummary?.trust?.isServiceReady ? 'Ready for trips' : 'Needs action'}</Text>
            <Text style={styles.metric}>Missing: {(driverSummary?.trust?.missingItems || []).join(', ') || 'None'}</Text>
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Location mode</Text>
            <Text style={styles.metric}>Foreground: {locationMode.foregroundReady ? 'Ready' : 'Missing permission'}</Text>
            <Text style={styles.metric}>Background: {locationMode.backgroundReady ? 'Ready' : 'Missing permission'}</Text>
            <Button title="Recheck permissions" onPress={bootstrapLocationMode} />
          </View>
          <View style={styles.cardInline}>
            <TextInput value={profile.name} onChangeText={(value) => setProfile({ ...profile, name: value })} placeholder="Driver name" style={styles.input} />
            <TextInput value={profile.serviceArea} onChangeText={(value) => setProfile({ ...profile, serviceArea: value })} placeholder="Service area" style={styles.input} />
            <TextInput value={serviceInfo.institutionIds} onChangeText={(value) => setServiceInfo({ ...serviceInfo, institutionIds: value })} placeholder="Institution ids (comma-separated)" style={styles.input} />
            <TextInput value={serviceInfo.makeModel} onChangeText={(value) => setServiceInfo({ ...serviceInfo, makeModel: value })} placeholder="Vehicle" style={styles.input} />
            <TextInput value={serviceInfo.seatsCapacity} onChangeText={(value) => setServiceInfo({ ...serviceInfo, seatsCapacity: value })} placeholder="Seats" style={styles.input} keyboardType="number-pad" />
            <TextInput value={serviceInfo.plateNumber} onChangeText={(value) => setServiceInfo({ ...serviceInfo, plateNumber: value })} placeholder="Plate number" style={styles.input} />
            <Button title="Save onboarding" onPress={saveOnboarding} />
          </View>
          <Button title="Skip to inbox" onPress={() => setScreen('inbox')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'inbox') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Incoming requests</Text>
          <Text style={styles.bodyDark}>Accept only when seat capacity, institution fit, and route reality line up.</Text>
          {loading ? <ActivityIndicator color={colors.accent} /> : null}
          {incoming.length ? (
            <FlatList
              data={incoming}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.child?.name || 'Unknown child'}</Text>
                    <Text style={styles.metric}>{item.child?.pickupAddress || 'Pickup missing'}</Text>
                    <Text style={styles.metric}>{item.child?.institutionName || 'Institution pending'}</Text>
                  </View>
                  <Button title="Accept" onPress={() => handleAssignment('accept', item.id)} />
                  <Button title="Reject" onPress={() => handleAssignment('reject', item.id)} />
                </View>
              )}
            />
          ) : (
            <EmptyState title="Inbox is clear" body="No pending seat requests need a decision right now." />
          )}
          <Button title="Trip dashboard" onPress={() => setScreen('trip')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.stack}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Next action</Text>
          <Text style={styles.titleDark}>{nextAction}</Text>
          <Text style={styles.bodyDark}>{status}</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Current trip</Text>
          <Text style={styles.metric}>{trip ? `${trip.tripType} | ${trip.status}` : 'No active trip'}</Text>
          <Text style={styles.metric}>Current stop: {tripState?.nextStop?.address || 'No active stop'}</Text>
          <Text style={styles.metric}>Accepted families: {accepted.length}</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Trust and readiness</Text>
          <Text style={styles.metric}>Verification: {driverSummary?.verificationStatus || 'Unknown'}</Text>
          <Text style={styles.metric}>Service readiness: {driverSummary?.trust?.isServiceReady ? 'Ready' : 'Not ready'}</Text>
          <Text style={styles.metric}>Next admin action: {driverSummary?.trust?.nextAdminAction || 'Review profile'}</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Manifest</Text>
          {tripState?.manifest.length ? (
            tripState.manifest.map((child) => (
              <Text key={child.id} style={styles.metric}>
                {child.name} | {child.pickupAddress}
              </Text>
            ))
          ) : (
            <Text style={styles.metric}>No active manifest yet.</Text>
          )}
          <Text style={styles.metric}>Event anchor child: {focusedChildId || 'None'}</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Trip controls</Text>
          {tripState?.nextAction?.allowedEvents.length ? (
            tripState.nextAction.allowedEvents.map((eventType) => (
              <Button key={eventType} title={eventType.replaceAll('_', ' ')} onPress={() => emitEvent(eventType)} />
            ))
          ) : (
            <EmptyState title="No manual event needed" body="Start a trip or finish the current stop to unlock the next control." />
          )}
        </View>
        <View style={styles.actions}>
          <Button title="Refresh" onPress={refresh} />
          <Button title="Start morning trip" onPress={() => startTrip('MORNING')} />
          <Button title="Start afternoon trip" onPress={() => startTrip('AFTERNOON')} />
          <Button title="Ping location now" onPress={() => pingLocation('Location ping sent for the active trip.')} />
          <Button title="End trip" onPress={endTrip} />
          <Button title="Inbox" onPress={() => setScreen('inbox')} />
          <Button title="Sign out" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  stack: { padding: 20, gap: 16 },
  hero: {
    padding: 20,
    backgroundColor: colors.ink,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 10,
  },
  heroCard: { padding: 20, backgroundColor: '#dcebf0', borderRadius: 24, gap: 10 },
  kicker: { color: colors.accent, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  titleLight: { color: colors.panel, fontSize: 28, fontWeight: '700' },
  titleDark: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  bodyLight: { color: '#dde4ea', fontSize: 15, lineHeight: 22 },
  bodyDark: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: colors.panel,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  cardInline: {
    backgroundColor: colors.panel,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  emptyCard: { backgroundColor: '#eef3f5', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#c3d3d8', gap: 10 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  metric: { color: colors.muted, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fbfaf7',
  },
  status: { color: colors.muted, fontSize: 13 },
  row: {
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actions: { gap: 10, paddingBottom: 24 },
});
