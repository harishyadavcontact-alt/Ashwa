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
import * as Location from 'expo-location';
import { api } from './api';
import { colors } from './theme';

type Screen = 'auth' | 'onboarding' | 'inbox' | 'trip';

const SESSION_KEY = 'ashwa.driver.session';

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('driver@ashwa.app');
  const [password, setPassword] = useState('Password123');
  const [incoming, setIncoming] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [trip, setTrip] = useState<any | null>(null);
  const [profile, setProfile] = useState({ name: 'Ashwa Driver', serviceArea: 'South Bengaluru', baseLat: 12.97, baseLng: 77.59 });
  const [serviceInfo, setServiceInfo] = useState({ institutionIds: '', makeModel: 'Toyota HiAce', seatsCapacity: '12', plateNumber: 'KA-01-0001' });
  const [selectedChildId, setSelectedChildId] = useState('');
  const [status, setStatus] = useState('Sign in to see the next operational action.');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((value) => {
      if (!value) return;
      setToken(value);
      setScreen('trip');
    });
    Location.requestForegroundPermissionsAsync().then((result) => {
      setStatus(result.granted ? 'Location ready. You can publish active trip progress.' : 'Location access is off. Trip tracking cannot be trusted until enabled.');
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token]);

  async function refresh() {
    try {
      const [incomingAssignments, activeAssignments, currentTrip] = await Promise.all([
        api.incomingAssignments(token),
        api.currentAssignments(token),
        api.currentTrip(token),
      ]);
      setIncoming(incomingAssignments);
      setAccepted(Array.isArray(activeAssignments) ? activeAssignments : []);
      setTrip(currentTrip);
      const firstChildStop = currentTrip?.stops?.find((stop: any) => !!stop.childId);
      setSelectedChildId(firstChildStop?.childId || '');
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
      await api.saveProfile(token, profile);
      await api.saveServiceInfo(token, {
        institutionIds: serviceInfo.institutionIds.split(',').map((value) => value.trim()).filter(Boolean),
        serviceArea: profile.serviceArea,
        baseLat: profile.baseLat,
        baseLng: profile.baseLng,
        vehicle: {
          makeModel: serviceInfo.makeModel,
          seatsCapacity: Number(serviceInfo.seatsCapacity),
          plateNumber: serviceInfo.plateNumber,
        },
      });
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

  async function startTrip() {
    if (!token) return;
    setLoading(true);
    try {
      const current = await api.startTrip(token, 'MORNING');
      setTrip(current);
      const firstChildStop = current?.stops?.find((stop: any) => !!stop.childId);
      setSelectedChildId(firstChildStop?.childId || '');
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

  async function pingLocation() {
    if (!token || !trip?.id) return;
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      await api.ping(token, trip.id, loc.coords.latitude, loc.coords.longitude);
      setStatus('Location ping sent for the active trip.');
    } catch (error: any) {
      setStatus(error.message || 'Could not send location ping.');
    } finally {
      setLoading(false);
    }
  }

  async function emitEvent(eventType: string) {
    if (!token || !trip?.id || !selectedChildId) {
      setStatus('Select a child stop first so event sequencing stays real.');
      return;
    }
    setLoading(true);
    try {
      await api.emitEvent(token, trip.id, selectedChildId, eventType);
      setStatus(`Event emitted: ${eventType}`);
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
    setTrip(null);
    setIncoming([]);
    setAccepted([]);
  }

  const nextAction = useMemo(() => {
    if (trip?.status === 'ACTIVE') return 'Continue current trip';
    if (incoming.length) return 'Review incoming seat requests';
    if (accepted.length) return 'Start the next assigned trip';
    return 'Complete onboarding and wait for assignments';
  }, [accepted.length, incoming.length, trip?.status]);

  if (screen === 'auth') {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Ashwa Driver</Text>
          <Text style={styles.titleLight}>Operate, don’t improvise.</Text>
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
          <FlatList
            data={incoming}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.child?.name || 'Unknown child'}</Text>
                  <Text style={styles.metric}>{item.child?.pickupAddress || 'Pickup missing'}</Text>
                </View>
                <Button title="Accept" onPress={() => handleAssignment('accept', item.id)} />
                <Button title="Reject" onPress={() => handleAssignment('reject', item.id)} />
              </View>
            )}
          />
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
          <Text style={styles.metric}>{trip ? `${trip.tripType} • ${trip.status}` : 'No active trip'}</Text>
          <Text style={styles.metric}>Accepted families: {accepted.length}</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Manifest and stop focus</Text>
          {(trip?.stops || []).filter((stop: any) => !!stop.childId).map((stop: any) => (
            <Button key={stop.id} title={`Focus ${stop.address}`} onPress={() => setSelectedChildId(stop.childId)} />
          ))}
          <Text style={styles.metric}>Selected child stop: {selectedChildId || 'None selected'}</Text>
        </View>
        <View style={styles.actions}>
          <Button title="Refresh" onPress={refresh} />
          <Button title="Start morning trip" onPress={startTrip} />
          <Button title="Ping location" onPress={pingLocation} />
          <Button title="At pickup" onPress={() => emitEvent('DRIVER_AT_PICKUP')} />
          <Button title="Child boarded" onPress={() => emitEvent('CHILD_BOARDED')} />
          <Button title="At school" onPress={() => emitEvent('DRIVER_AT_SCHOOL')} />
          <Button title="At drop" onPress={() => emitEvent('DRIVER_AT_DROP')} />
          <Button title="Child dropped" onPress={() => emitEvent('CHILD_DROPPED')} />
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
  hero: { padding: 20, backgroundColor: colors.ink, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 10 },
  heroCard: { padding: 20, backgroundColor: '#dcebf0', borderRadius: 24, gap: 10 },
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
  status: { color: colors.muted, fontSize: 13 },
  row: { backgroundColor: colors.panel, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  actions: { gap: 10, paddingBottom: 24 },
});
