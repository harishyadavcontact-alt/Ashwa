import React, { useEffect, useState } from 'react';
import { Button, FlatList, SafeAreaView, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Notifications from 'expo-notifications';
import { io } from 'socket.io-client';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function App() {
  const [screen, setScreen] = useState<'Auth'|'Home'|'AddChild'|'Search'|'Profile'|'Track'>('Auth');
  const [token, setToken] = useState('');
  const [children, setChildren] = useState<any[]>([]);
  const [driverLoc, setDriverLoc] = useState({ latitude: 12.97, longitude: 77.59 });

  useEffect(() => { Notifications.requestPermissionsAsync(); }, []);
  useEffect(() => {
    if (screen === 'Track') {
      const s = io(API + '/ws');
      s.emit('subscribe', { driverId: 'demo' });
      s.on('location', (p: any) => setDriverLoc({ latitude: p.lat, longitude: p.lng }));
      return () => s.close();
    }
  }, [screen]);

  const login = async () => {
    const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'parent@ashwa.app', password: 'Password123' }) });
    const j = await r.json();
    setToken(j.accessToken); setScreen('Home');
  };

  const loadChildren = async () => {
    const r = await fetch(`${API}/children`, { headers: { authorization: `Bearer ${token}` } });
    setChildren(await r.json());
  };

  if (screen === 'Auth') return <SafeAreaView><Text>Parent Auth</Text><Button title='Login Demo' onPress={login} /></SafeAreaView>;
  if (screen === 'AddChild') return <SafeAreaView><Text>Add/Edit Child</Text><Button title='Back' onPress={() => setScreen('Home')} /></SafeAreaView>;
  if (screen === 'Search') return <SafeAreaView><Text>Driver Search</Text><Button title='Driver Profile' onPress={() => setScreen('Profile')} /></SafeAreaView>;
  if (screen === 'Profile') return <SafeAreaView><Text>Driver Profile + Request Seat</Text><Button title='Track' onPress={() => setScreen('Track')} /></SafeAreaView>;
  if (screen === 'Track') return <SafeAreaView style={{flex:1}}><Text>Track: Live map + timeline</Text><MapView style={{flex:1}} initialRegion={{...driverLoc, latitudeDelta:0.05, longitudeDelta:0.05}}><Marker coordinate={driverLoc} title='Driver' /></MapView><Button title='Back' onPress={() => setScreen('Home')} /></SafeAreaView>;

  return <SafeAreaView>
    <Text>Parent Home</Text>
    <Button title='Load Children' onPress={loadChildren} />
    <FlatList data={children} keyExtractor={(i)=>i.id} renderItem={({item}) => <Text>{item.name}</Text>} />
    <Button title='Add Child' onPress={() => setScreen('AddChild')} />
    <Button title='Search Drivers' onPress={() => setScreen('Search')} />
    <TextInput placeholder='Notifications permission prompt included' />
  </SafeAreaView>;
}
