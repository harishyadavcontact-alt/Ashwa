import type {
  ChildUpsertInput,
  CurrentAssignmentState,
  CurrentTripState,
  DriverServiceSummary,
  TimelineEventSummary,
  AttendanceRecord,
  Invoice,
  MonthlyAttendanceSummary,
  CallRecordData,
  Service,
  ServiceEnrollment,
} from '@ashwa/shared';
import { sendEmergencyAlert, initiateCall, endCall, getActiveCall, getSubstituteNotifications } from '@ashwa/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { io } from 'socket.io-client';
import { api } from './api';
import { API_BASE_URL } from './config';
import { colors } from './theme';

type Screen = 'auth' | 'home' | 'children' | 'drivers' | 'track' | 'referrals' | 'attendance' | 'invoice';

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
  const [referralCode, setReferralCode] = useState('');
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendanceSummary | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [emergencyTimestamp, setEmergencyTimestamp] = useState('');
  const [emergencySending, setEmergencySending] = useState(false);
  const [activeCall, setActiveCall] = useState<CallRecordData | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callModalVisible, setCallModalVisible] = useState(false);

  // Multi-Service Routing state
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [enrolledServices, setEnrolledServices] = useState<ServiceEnrollment[]>([]);

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
    initializeDemoServices();
  }, []);

  async function initializeDemoServices() {
    try {
      const stored = await AsyncStorage.getItem('ashwa.services');
      if (!stored) {
        // Initialize demo services (same as driver app)
        const demoServices: Service[] = [
          {
            id: 'demo-1',
            driverId: 'demo-driver',
            name: 'St. Xavier School',
            type: 'SCHOOL',
            startTime: '07:00',
            endTime: '09:00',
            location: { lat: 12.97, lng: 77.59 },
            daysOfWeek: [1, 2, 3, 4, 5],
            capacity: 12,
            pricePerMonth: 3000,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            driverId: 'demo-driver',
            name: 'Math Tuition',
            type: 'TUITION',
            startTime: '15:00',
            endTime: '17:00',
            location: { lat: 12.98, lng: 77.60 },
            daysOfWeek: [1, 3, 5],
            capacity: 8,
            pricePerMonth: 2000,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-3',
            driverId: 'demo-driver',
            name: 'Dance Academy',
            type: 'DANCE',
            startTime: '17:30',
            endTime: '19:00',
            location: { lat: 12.96, lng: 77.58 },
            daysOfWeek: [2, 4, 6],
            capacity: 10,
            pricePerMonth: 1500,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          },
        ];
        await AsyncStorage.setItem('ashwa.services', JSON.stringify(demoServices));
        setAvailableServices(demoServices);
      } else {
        setAvailableServices(JSON.parse(stored));
      }
    } catch (error: any) {
      console.error('Failed to initialize services:', error);
    }
  }

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

  // Track active call duration
  useEffect(() => {
    const checkActiveCall = () => {
      const call = getActiveCall();
      if (call && call.status === 'CONNECTED') {
        setActiveCall(call);
        setCallDuration(call.durationSeconds);
      } else if (call && call.status === 'INITIATED') {
        setActiveCall(call);
        setCallDuration(0);
      } else if (activeCall && call?.status === 'ENDED') {
        // Call has ended, show summary
        setActiveCall(call);
        setCallDuration(call.durationSeconds);
      } else if (!call) {
        setActiveCall(null);
        setCallDuration(0);
      }
    };

    const interval = setInterval(checkActiveCall, 500);
    return () => clearInterval(interval);
  }, [activeCall]);

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
      const [childrenData, assignmentData, nextTripState, refCode, earnings] = await Promise.all([
        api.listChildren(token),
        api.currentAssignment(token),
        api.currentTrip(token),
        api.getReferralCode(token).then((r) => r.referralCode).catch(() => ''),
        api.getMyReferralEarnings(token).then((r) => r.totalEarnings).catch(() => 0),
      ]);
      setChildren(childrenData);
      setAssignmentState(assignmentData);
      setTripState(nextTripState);
      setEvents(nextTripState.timeline || []);
      setReferralCode(refCode);
      setReferralEarnings(earnings);
      if (nextTripState.latestLocation) {
        setDriverLoc({
          latitude: nextTripState.latestLocation.lat,
          longitude: nextTripState.latestLocation.lng,
        });
      }
      // Load attendance data
      await loadAttendanceData();
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

  function generateDemoAttendance() {
    const childId = primaryChild?.id || 'demo-child-1';
    const parentId = token || 'demo-parent-1';
    const serviceId = 'demo-service-1';

    const records: AttendanceRecord[] = [];
    const attendedDates = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 22, 23, 25, 26, 27];
    const absentDates = [7, 14];

    // Generate November attendance records
    attendedDates.forEach(day => {
      records.push({
        id: `attendance-${day}`,
        childId,
        parentId,
        serviceId,
        date: `2024-11-${String(day).padStart(2, '0')}`,
        boardedTime: `2024-11-${String(day).padStart(2, '0')}T07:45:00Z`,
        droppedTime: `2024-11-${String(day).padStart(2, '0')}T09:15:00Z`,
        status: 'ATTENDED',
      });
    });

    absentDates.forEach(day => {
      records.push({
        id: `attendance-${day}`,
        childId,
        parentId,
        serviceId,
        date: `2024-11-${String(day).padStart(2, '0')}`,
        status: 'ABSENT',
      });
    });

    return records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async function loadAttendanceData() {
    try {
      const stored = await AsyncStorage.getItem('ashwa.attendance');
      if (stored) {
        const data = JSON.parse(stored);
        setAttendanceRecords(data.records || []);
        setMonthlyAttendance(data.summary || null);
        setInvoice(data.invoice || null);
        return;
      }

      // Generate demo data on first load
      const records = generateDemoAttendance();
      const attended = records.filter(r => r.status === 'ATTENDED').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;

      const summary: MonthlyAttendanceSummary = {
        month: 11,
        year: 2024,
        attendedDays: attended,
        absentDays: absent,
        excusedDays: 0,
        totalDays: attended + absent,
        pricePerDay: 10,
        totalAmount: attended * 10,
      };

      const invoiceData: Invoice = {
        id: 'invoice-2024-nov-001',
        parentId: primaryChild?.id || 'demo-parent-1',
        serviceId: 'demo-service-1',
        month: 11,
        year: 2024,
        attendanceDays: attended,
        pricePerDay: 10,
        totalAmount: attended * 10,
        status: 'PENDING',
        issuedAt: new Date().toISOString(),
        dueDate: '2024-11-30',
      };

      setAttendanceRecords(records);
      setMonthlyAttendance(summary);
      setInvoice(invoiceData);

      // Save to localStorage
      await AsyncStorage.setItem('ashwa.attendance', JSON.stringify({
        records,
        summary,
        invoice: invoiceData,
      }));
    } catch (error) {
      setStatus('Could not load attendance data.');
    }
  }

  async function markAttendanceExcused(childId: string, date: string) {
    const updated = attendanceRecords.map(r =>
      r.date === date && r.childId === childId
        ? { ...r, status: 'EXCUSED' as const }
        : r
    );
    setAttendanceRecords(updated);

    // Update localStorage
    await AsyncStorage.setItem('ashwa.attendance', JSON.stringify({
      records: updated,
      summary: monthlyAttendance,
      invoice,
    }));

    setStatus('Attendance marked as excused.');
  }

  async function payInvoiceLocal() {
    if (!invoice) return;
    const updated: Invoice = { ...invoice, status: 'PAID', paidAt: new Date().toISOString() };
    setInvoice(updated);

    await AsyncStorage.setItem('ashwa.attendance', JSON.stringify({
      records: attendanceRecords,
      summary: monthlyAttendance,
      invoice: updated,
    }));

    setStatus('Invoice marked as paid.');
  }

  async function triggerEmergencyAlert() {
    if (!assignment?.driver || !primaryChild) {
      setStatus('Cannot send emergency: no driver assigned or child profile missing.');
      return;
    }

    setEmergencySending(true);
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Send emergency alert to driver
      await sendEmergencyAlert({
        parentPhone: '+919999999999', // Demo phone - would be from user profile in production
        driverPhone: assignment.driver.email.replace('@', '+919'), // Demo - would be real phone in production
        childName: primaryChild.name,
        latitude,
        longitude,
      });

      // Track analytics
      track('emergency_reported', {
        childId: primaryChild.id,
        location: { latitude, longitude },
      });

      // Show confirmation
      const formattedTime = new Date().toLocaleTimeString();
      setEmergencyTimestamp(formattedTime);
      setStatus(`Emergency sent at ${formattedTime}. Driver is being notified.`);

      // Close modal after confirmation
      setTimeout(() => {
        setEmergencyModalVisible(false);
      }, 2000);
    } catch (error: any) {
      setStatus(`Emergency alert failed: ${error.message}`);
      console.error('Emergency alert error:', error);
    } finally {
      setEmergencySending(false);
    }
  }

  function track(event: string, data: any = {}) {
    // Simple analytics tracking - in production would send to analytics service
    const analyticsEntry = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    console.log('[Analytics]', analyticsEntry);
  }

  async function callDriver() {
    if (!token || !assignment?.driver || !primaryChild) {
      setStatus('Cannot call: no driver assigned or child profile missing.');
      return;
    }

    try {
      // Get the current user's ID (from token decoded or stored)
      const userId = 'parent_demo_id'; // In production, would be decoded from token

      const call = await initiateCall({
        callerId: userId,
        callerName: 'Parent',
        receiverId: assignment.driver.id,
        receiverName: assignment.driver.name,
        direction: 'PARENT_TO_DRIVER',
        childName: primaryChild.name,
      });

      setActiveCall(call);
      setCallModalVisible(true);

      // Track analytics
      track('call_initiated', {
        direction: 'PARENT_TO_DRIVER',
        driverId: assignment.driver.id,
        childId: primaryChild.id,
      });

      setStatus(`Calling ${assignment.driver.name}...`);
    } catch (error: any) {
      setStatus(`Call failed: ${error.message}`);
      console.error('Call error:', error);
    }
  }

  function endCurrentCall() {
    if (activeCall) {
      endCall(activeCall.id);
      track('call_ended', {
        direction: activeCall.direction,
        duration: callDuration,
      });
      setStatus(`Call ended. Duration: ${Math.floor(callDuration / 60)}:${String(callDuration % 60).padStart(2, '0')}`);
      setTimeout(() => {
        setCallModalVisible(false);
        setActiveCall(null);
        setCallDuration(0);
      }, 1000);
    }
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
              <View style={styles.badgeRow}>
                {selectedDriver.verificationStatus === 'VERIFIED' ? (
                  <View style={[styles.badge, styles.verifiedBadge]}>
                    <Text style={styles.badgeText}>✓ VERIFIED</Text>
                  </View>
                ) : selectedDriver.verificationStatus === 'PENDING' ? (
                  <View style={[styles.badge, styles.pendingBadge]}>
                    <Text style={styles.badgeText}>⏳ PENDING</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.unverifiedBadge]}>
                    <Text style={styles.badgeText}>✗ NOT VERIFIED</Text>
                  </View>
                )}
              </View>
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

  if (screen === 'attendance') {
    const sortedRecords = attendanceRecords.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Attendance Calendar</Text>
          <Text style={styles.bodyDark}>View all attended and absent days for this month.</Text>

          {monthlyAttendance ? (
            <View style={styles.cardInline}>
              <Text style={styles.cardTitle}>November 2024 Summary</Text>
              <Text style={styles.metric}>Attended: {monthlyAttendance.attendedDays} days</Text>
              <Text style={styles.metric}>Absent: {monthlyAttendance.absentDays} days</Text>
              <Text style={styles.metric}>Excused: {monthlyAttendance.excusedDays} days</Text>
              <Text style={styles.kicker}>Invoice: ₹{monthlyAttendance.totalAmount}</Text>
            </View>
          ) : null}

          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Attendance Details</Text>
            {sortedRecords.length ? (
              sortedRecords.map((record) => (
                <View key={record.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {record.status === 'ATTENDED' ? '✓' : '✗'} {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    {record.status === 'ATTENDED' && record.boardedTime ? (
                      <Text style={styles.metric}>
                        {new Date(record.boardedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {record.droppedTime ? new Date(record.droppedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '?'}
                      </Text>
                    ) : null}
                    <Text style={styles.metric}>{record.status}</Text>
                  </View>
                  {record.status === 'ABSENT' ? (
                    <Button title="Excuse" onPress={() => markAttendanceExcused(record.childId, record.date)} />
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.metric}>No attendance records yet.</Text>
            )}
          </View>

          <Button title="Back home" onPress={() => setScreen('home')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'invoice') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Monthly Invoice</Text>
          <Text style={styles.bodyDark}>View your monthly invoice and payment status.</Text>

          {invoice ? (
            <View style={styles.cardInline}>
              <Text style={styles.cardTitle}>Invoice #{invoice.id}</Text>
              <Text style={styles.metric}>Month: November {invoice.year}</Text>
              <Text style={styles.metric}>Issued: {new Date(invoice.issuedAt).toLocaleDateString()}</Text>
              <Text style={styles.metric}>Due: {new Date(invoice.dueDate).toLocaleDateString()}</Text>

              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.line }}>
                <Text style={styles.cardTitle}>Service Details</Text>
                <Text style={styles.metric}>Service: School Transportation</Text>
                <Text style={styles.metric}>Attendance: {invoice.attendanceDays} days</Text>
                <Text style={styles.metric}>Price per day: ₹{invoice.pricePerDay}</Text>
              </View>

              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: colors.accent }}>
                <Text style={styles.kicker}>Total Amount Due</Text>
                <Text style={[styles.kicker, { fontSize: 24 }]}>₹{invoice.totalAmount}</Text>
              </View>

              <View style={{ marginTop: 16 }}>
                <Text style={styles.metric}>Status: {invoice.status}</Text>
                {invoice.status === 'PAID' && invoice.paidAt ? (
                  <Text style={styles.metric}>Paid on: {new Date(invoice.paidAt).toLocaleDateString()}</Text>
                ) : null}
              </View>

              {invoice.status !== 'PAID' ? (
                <Button title="Pay Invoice" onPress={payInvoiceLocal} />
              ) : null}
            </View>
          ) : null}

          <Button title="Back home" onPress={() => setScreen('home')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'referrals') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Referral earnings</Text>
          <Text style={styles.bodyDark}>Earn ₹200 each time a referred parent pays for 3 months of service.</Text>
          {loading ? <ActivityIndicator color={colors.accent} /> : null}

          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Your referral code</Text>
            <Text style={styles.metric}>{referralCode || 'Loading...'}</Text>
            <Button title="Copy code" onPress={() => {
              if (referralCode) {
                // In a real app, use Clipboard API
                setStatus('Referral code copied!');
              }
            }} />
          </View>

          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Total earnings</Text>
            <Text style={styles.kicker}>₹{referralEarnings}</Text>
            <Text style={styles.metric}>From {referralStats?.totalReferrals || 0} referrals</Text>
            <Text style={styles.metric}>Potential: ₹{referralStats?.potentialEarnings || 0}</Text>
          </View>

          {referralStats?.referrals && referralStats.referrals.length > 0 ? (
            <View style={styles.cardInline}>
              <Text style={styles.cardTitle}>Your referrals</Text>
              {referralStats.referrals.map((ref: any) => (
                <View key={ref.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{ref.referredParentName}</Text>
                    <Text style={styles.metric}>Status: {ref.status}</Text>
                    <Text style={styles.metric}>Referred: {new Date(ref.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState title="No referrals yet" body="Share your referral code with other parents to start earning." />
          )}

          <Button title="Back home" onPress={() => setScreen('home')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'track') {
    return (
      <SafeAreaView style={styles.page}>
        {/* Emergency Confirmation Modal */}
        <Modal
          visible={emergencyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEmergencyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Emergency Alert</Text>
              <Text style={styles.modalBody}>
                This will immediately alert the driver and send your location. Are you sure?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEmergencyModalVisible(false)}
                  disabled={emergencySending}
                >
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={triggerEmergencyAlert}
                  disabled={emergencySending}
                >
                  <Text style={styles.confirmButtonText}>
                    {emergencySending ? 'SENDING...' : 'CONFIRM'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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

        {/* SOS Button - Always visible on track screen */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => setEmergencyModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.sosButtonText}>🚨</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      {/* Call Status Modal */}
      <Modal
        visible={callModalVisible && activeCall}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (activeCall?.status !== 'CONNECTED') {
            setCallModalVisible(false);
          }
        }}
      >
        <View style={styles.callModalOverlay}>
          <View style={styles.callModalContent}>
            <Text style={styles.callModalTitle}>
              {activeCall?.status === 'INITIATED' ? 'Calling...' : 'Connected'}
            </Text>
            <Text style={styles.callModalSubtitle}>
              {activeCall?.receiverName || 'Driver'}
            </Text>
            {activeCall?.childName && (
              <Text style={styles.callModalChild}>{activeCall.childName}</Text>
            )}

            <Text style={styles.callTimer}>
              {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
            </Text>

            <Text style={styles.callStatus}>
              {activeCall?.status === 'INITIATED' ? '[Calling...]' : '[Connected]'}
            </Text>

            {activeCall?.status === 'CONNECTED' && (
              <TouchableOpacity
                style={styles.endCallButton}
                onPress={endCurrentCall}
              >
                <Text style={styles.endCallButtonText}>End Call</Text>
              </TouchableOpacity>
            )}

            {activeCall?.status === 'ENDED' && (
              <View style={styles.callEndedInfo}>
                <Text style={styles.callEndedText}>
                  Call ended
                </Text>
                <Text style={styles.callDurationText}>
                  Duration: {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={styles.closeCallButton}
                  onPress={() => {
                    setCallModalVisible(false);
                    setActiveCall(null);
                    setCallDuration(0);
                  }}
                >
                  <Text style={styles.closeCallButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Emergency Confirmation Modal */}
      <Modal
        visible={emergencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmergencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Emergency Alert</Text>
            <Text style={styles.modalBody}>
              This will immediately alert the driver and send your location. Are you sure?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEmergencyModalVisible(false)}
                disabled={emergencySending}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={triggerEmergencyAlert}
                disabled={emergencySending}
              >
                <Text style={styles.confirmButtonText}>
                  {emergencySending ? 'SENDING...' : 'CONFIRM'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.stack}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Child status now</Text>
          <Text style={styles.titleDark}>{childStatus}</Text>
          <Text style={styles.bodyDark}>{status}</Text>
        </View>

        {monthlyAttendance ? (
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Attendance This Month</Text>
            <Text style={styles.kicker}>Attended: {monthlyAttendance.attendedDays} days</Text>
            <Text style={styles.metric}>Invoice: ₹{monthlyAttendance.totalAmount} ({monthlyAttendance.attendedDays} × ₹{monthlyAttendance.pricePerDay}/day)</Text>
            <Text style={styles.metric}>Status: {invoice?.status === 'PAID' ? '✓ Paid' : '⏳ Pending'}</Text>
            <View style={styles.actions}>
              <Button title="View calendar" onPress={() => setScreen('attendance')} />
              <Button title="View invoice" onPress={() => setScreen('invoice')} />
            </View>
          </View>
        ) : null}

        {referralEarnings > 0 || referralCode ? (
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Referral earnings</Text>
            <Text style={styles.kicker}>₹{referralEarnings}</Text>
            <Text style={styles.metric}>Total earned from referrals</Text>
            <Button title="View details" onPress={() => setScreen('referrals')} />
          </View>
        ) : null}

        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Assigned driver</Text>
          <Text style={styles.metric}>{assignment?.driver?.name || 'No active assignment yet'}</Text>
          <Text style={styles.metric}>Trust state: {assignment?.driver?.verificationStatus || 'Unknown'}</Text>
          <Text style={styles.metric}>Service readiness: {assignment?.driver?.trust?.isServiceReady ? 'Ready' : 'Not ready'}</Text>
          {assignment ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.callDriverButton}
                onPress={callDriver}
              >
                <Text style={styles.callDriverButtonText}>📞 CALL DRIVER</Text>
              </TouchableOpacity>
              <Button title="Cancel assignment" onPress={cancelAssignment} />
            </View>
          ) : null}
        </View>
        {enrolledServices.length > 0 && (
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Your services</Text>
            <Text style={styles.metric}>
              {enrolledServices.map((s) => {
                const service = availableServices.find((svc) => svc.id === s.serviceId);
                return service?.name;
              }).join(' + ')}
            </Text>
            <Text style={styles.kicker}>
              ₹{enrolledServices.reduce((sum, e) => {
                const service = availableServices.find((s) => s.id === e.serviceId);
                return sum + (service?.pricePerMonth || 0);
              }, 0)}/month
            </Text>
          </View>
        )}

        {availableServices.length > 0 && !enrolledServices.length && (
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Available services</Text>
            <Text style={styles.metric}>Select from {availableServices.length} options to get started</Text>
            {availableServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                onPress={() => {
                  const isSelected = selectedServices.some((s) => s.id === service.id);
                  if (isSelected) {
                    setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
                  } else {
                    setSelectedServices([...selectedServices, service]);
                  }
                }}
                style={[styles.serviceOption, selectedServices.some((s) => s.id === service.id) && styles.serviceOptionSelected]}
              >
                <Text style={styles.metric}>{service.name} ({service.type})</Text>
                <Text style={styles.metric}>{service.startTime} - {service.endTime}</Text>
                <Text style={styles.cardTitle}>₹{service.pricePerMonth}/month</Text>
              </TouchableOpacity>
            ))}
            {selectedServices.length > 0 && (
              <View style={styles.actions}>
                <Text style={styles.metric}>Total: ₹{selectedServices.reduce((sum, s) => sum + s.pricePerMonth, 0)}/month</Text>
                <Button title="Enroll in services" onPress={() => setStatus('Service enrollment features coming soon')} />
              </View>
            )}
          </View>
        )}

        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Trip readiness</Text>
          <Text style={styles.metric}>{trip ? `${trip.tripType} trip is ${trip.status}` : 'No active trip'}</Text>
          <Text style={styles.metric}>Next stop: {tripState?.nextStop?.address || 'No next stop'}</Text>
          <Text style={styles.metric}>{tripState?.nextAction?.label || 'Waiting for driver action'}</Text>
          <Text style={styles.metric}>{children.length} child profile(s) on file</Text>
        </View>

        {(() => {
          const substituteNotifications = getSubstituteNotifications();
          const parentNotifications = substituteNotifications.filter(n =>
            n.type === 'PARENT_SUBSTITUTE_NOTIFICATION' || n.type === 'REFUND_NOTIFICATION'
          );

          if (parentNotifications.length > 0) {
            return (
              <View style={styles.cardInline}>
                <Text style={styles.cardTitle}>Driver Update</Text>
                {parentNotifications.map((notif, idx) => (
                  <View key={idx} style={{ marginBottom: 12 }}>
                    <Text style={styles.metric}>{notif.message}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                ))}
              </View>
            );
          }
          return null;
        })()}

        {!children.length ? (
          <EmptyState title="Start with the child record" body="Without that, driver discovery and route matching are still guesses." />
        ) : null}
        <View style={styles.actions}>
          <Button title="Manage children" onPress={() => setScreen('children')} />
          <Button title="Find driver" onPress={searchDrivers} />
          <Button title="Open tracking" onPress={() => setScreen('track')} />
          <Button title="Earnings" onPress={() => setScreen('referrals')} />
          <Button title="Refresh state" onPress={refreshHome} />
          <Button title="Sign out" onPress={signOut} />
        </View>
      </ScrollView>

      {/* SOS Button - Always visible on home screen */}
      <TouchableOpacity
        style={styles.sosButton}
        onPress={() => setEmergencyModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.sosButtonText}>🚨</Text>
      </TouchableOpacity>
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
  serviceOption: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  serviceOptionSelected: {
    backgroundColor: '#e5f3ff',
    borderColor: colors.accent,
  },
  sosButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sosButtonText: {
    fontSize: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  modalBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelButtonText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  confirmButtonText: {
    color: colors.panel,
    fontSize: 14,
    fontWeight: '600',
  },
  callDriverButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  callDriverButtonText: {
    color: colors.panel,
    fontSize: 14,
    fontWeight: '700',
  },
  callModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  callModalContent: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    paddingBottom: 48,
    gap: 16,
    alignItems: 'center',
  },
  callModalTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  callModalSubtitle: {
    color: colors.muted,
    fontSize: 16,
  },
  callModalChild: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  callTimer: {
    color: colors.ink,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginVertical: 16,
  },
  callStatus: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  endCallButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    minWidth: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButtonText: {
    color: colors.panel,
    fontSize: 16,
    fontWeight: '700',
  },
  callEndedInfo: {
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  callEndedText: {
    color: colors.muted,
    fontSize: 16,
  },
  callDurationText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  closeCallButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 12,
    minWidth: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCallButtonText: {
    color: colors.panel,
    fontSize: 14,
    fontWeight: '700',
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  verifiedBadge: { backgroundColor: '#d4edda', borderWidth: 1, borderColor: '#28a745' },
  pendingBadge: { backgroundColor: '#fff3cd', borderWidth: 1, borderColor: '#ffc107' },
  unverifiedBadge: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ccc' },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.ink },
});
