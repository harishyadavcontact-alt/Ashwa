import React, { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import * as Location from 'expo-location';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function App() {
  const [screen, setScreen] = useState<'Auth'|'Onboarding'|'Service'|'Inbox'|'Trip'>('Auth');
  const [token, setToken] = useState('');
  const [tripId, setTripId] = useState('');

  useEffect(() => { Location.requestForegroundPermissionsAsync(); }, []);

  const login = async () => {
    const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'driver@ashwa.app', password: 'Password123' }) });
    const j = await r.json();
    setToken(j.accessToken); setScreen('Onboarding');
  };

  const startTrip = async () => {
    const r = await fetch(`${API}/trips/start`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ tripType: 'MORNING' })});
    const j = await r.json(); setTripId(j.id);
  };

  const ping = async () => {
    const loc = await Location.getCurrentPositionAsync({});
    await fetch(`${API}/tracking/ping`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ tripId, lat: loc.coords.latitude, lng: loc.coords.longitude }) });
  };

  const mark = async (eventType: string) => fetch(`${API}/trips/${tripId}/event`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ childId: 'child-1', eventType }) });

  if (screen === 'Auth') return <SafeAreaView><Text>Driver Auth</Text><Button title='Login Demo' onPress={login} /></SafeAreaView>;
  if (screen === 'Onboarding') return <SafeAreaView><Text>Onboarding Upload Docs</Text><Button title='Next Service Setup' onPress={() => setScreen('Service')} /></SafeAreaView>;
  if (screen === 'Service') return <SafeAreaView><Text>Service Setup seats + institutions</Text><Button title='Requests Inbox' onPress={() => setScreen('Inbox')} /></SafeAreaView>;
  if (screen === 'Inbox') return <SafeAreaView><Text>Requests Inbox accept/reject</Text><Button title='Trip Dashboard' onPress={() => setScreen('Trip')} /></SafeAreaView>;

  return <SafeAreaView>
    <Text>Trip Dashboard</Text>
    <Button title='Start MORNING Trip' onPress={startTrip} />
    <Button title='Ping Location (5s in prod loop)' onPress={ping} />
    <Button title='Arrived pickup' onPress={() => mark('DRIVER_AT_PICKUP')} />
    <Button title='Child boarded' onPress={() => mark('CHILD_BOARDED')} />
    <Button title='Arrived school' onPress={() => mark('DRIVER_AT_SCHOOL')} />
    <Button title='Left school' onPress={() => mark('DRIVER_LEFT_SCHOOL')} />
    <Button title='Arrived drop' onPress={() => mark('DRIVER_AT_DROP')} />
    <Button title='Child dropped' onPress={() => mark('CHILD_DROPPED')} />
  </SafeAreaView>;
}
