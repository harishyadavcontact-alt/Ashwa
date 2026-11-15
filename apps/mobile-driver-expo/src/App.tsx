import type { CurrentAssignmentState, CurrentTripState, DriverServiceSummary, EventType, Job, TeamMember, PayrollRecord, Route } from '@ashwa/shared';
import { sendWhatsAppAlert } from '@ashwa/shared';
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
import { LeaderboardScreen } from './LeaderboardScreen';
import { SuccessStoriesScreen } from './SuccessStoriesScreen';
import { colors } from './theme';

type Screen = 'auth' | 'onboarding' | 'inbox' | 'trip' | 'jobs' | 'apply-jobs' | 'team' | 'payroll' | 'post-job' | 'success-stories' | 'leaderboard';

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

  // Hiring system state
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myTeam, setMyTeam] = useState<TeamMember[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [newJobRoute, setNewJobRoute] = useState('');
  const [newJobPay, setNewJobPay] = useState('12000');
  const [routes] = useState<Route[]>([
    { id: '1', school: 'School A', direction: 'Morning North', time: '07:00 AM' },
    { id: '2', school: 'School B', direction: 'Morning South', time: '07:30 AM' },
    { id: '3', school: 'School A', direction: 'Afternoon North', time: '01:00 PM' },
    { id: '4', school: 'School C', direction: 'Evening East', time: '04:00 PM' },
  ]);

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

      // Send WhatsApp alert to parent
      const focusedChild = tripState?.manifest?.find((child) => child.id === focusedChildId);
      if (focusedChild) {
        // Note: In demo mode, phone number is logged to console/localStorage
        // In production, this would be fetched from the parent record
        await sendWhatsAppAlert({
          parentPhoneNumber: '+1234567890', // Demo phone - would come from parent record in production
          childName: focusedChild.name,
          eventType,
        });
      }

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

  // Hiring system functions
  async function postJobMock() {
    if (!newJobRoute || !newJobPay) {
      setStatus('Please select a route and enter pay amount.');
      return;
    }
    setLoading(true);
    try {
      const route = routes.find((r) => r.id === newJobRoute);
      if (!route) {
        setStatus('Invalid route selected.');
        return;
      }

      // Store in localStorage for demo
      const jobs = await AsyncStorage.getItem('ashwa.jobs');
      const jobList: Job[] = jobs ? JSON.parse(jobs) : [];
      const newJob: Job = {
        id: Math.random().toString(36).substr(2, 9),
        ownerId: token || 'demo-owner',
        ownerName: profile.name,
        route,
        payPerMonth: Number(newJobPay),
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        appliedCount: 0,
      };
      jobList.push(newJob);
      await AsyncStorage.setItem('ashwa.jobs', JSON.stringify(jobList));
      await loadJobs();
      setNewJobRoute('');
      setNewJobPay('12000');
      setScreen('jobs');
      setStatus('Job posted successfully!');
    } catch (error: any) {
      setStatus(error.message || 'Could not post job.');
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs() {
    try {
      const jobs = await AsyncStorage.getItem('ashwa.jobs');
      const jobList: Job[] = jobs ? JSON.parse(jobs) : [];
      const myOwnerJobs = jobList.filter((j) => j.ownerId === token);
      const otherJobs = jobList.filter((j) => j.ownerId !== token && j.status === 'OPEN');
      setMyJobs(myOwnerJobs);
      setAvailableJobs(otherJobs);
    } catch (error: any) {
      setStatus(error.message || 'Could not load jobs.');
    }
  }

  async function applyForJobMock(jobId: string) {
    if (!token) return;
    setLoading(true);
    try {
      const job = availableJobs.find((j) => j.id === jobId);
      if (!job) {
        setStatus('Job not found.');
        return;
      }

      // Store application
      const apps = await AsyncStorage.getItem('ashwa.job_applications');
      const appList: any[] = apps ? JSON.parse(apps) : [];
      appList.push({
        jobId,
        driverId: token,
        driverName: profile.name,
        driverPhone: '+919876543210',
        appliedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem('ashwa.job_applications', JSON.stringify(appList));

      // Send WhatsApp to owner
      const ownerPhone = '+919876543200'; // Demo phone
      const message = `Hi ${job.ownerName}, I'm interested in your ₹${job.payPerMonth} ${job.route.school} ${job.route.time} job. - ${profile.name}`;
      setStatus(`Applied! WhatsApp message queued to owner: "${message}"`);
      await loadJobs();
    } catch (error: any) {
      setStatus(error.message || 'Could not apply for job.');
    } finally {
      setLoading(false);
    }
  }

  async function hireDriverMock(jobId: string, driverId: string) {
    setLoading(true);
    try {
      const jobs = await AsyncStorage.getItem('ashwa.jobs');
      const jobList: Job[] = jobs ? JSON.parse(jobs) : [];
      const job = jobList.find((j) => j.id === jobId);
      if (!job) {
        setStatus('Job not found.');
        return;
      }

      // Update job status
      job.status = 'HIRED';
      job.hiredDriverId = driverId;
      job.hiredDriverName = profile.name; // This would come from driver lookup

      await AsyncStorage.setItem('ashwa.jobs', JSON.stringify(jobList));

      // Create team member record
      const teamData = await AsyncStorage.getItem('ashwa.team');
      const team: TeamMember[] = teamData ? JSON.parse(teamData) : [];
      const newMember: TeamMember = {
        id: driverId,
        name: profile.name,
        route: job.route,
        monthlyPay: job.payPerMonth,
        earningsThisMonth: 0,
        status: 'ACTIVE',
        phone: '+919876543210',
      };
      team.push(newMember);
      await AsyncStorage.setItem('ashwa.team', JSON.stringify(team));

      setStatus('Driver hired! Team member added.');
      await loadTeam();
      await loadJobs();
    } catch (error: any) {
      setStatus(error.message || 'Could not hire driver.');
    } finally {
      setLoading(false);
    }
  }

  async function loadTeam() {
    try {
      const teamData = await AsyncStorage.getItem('ashwa.team');
      const team: TeamMember[] = teamData ? JSON.parse(teamData) : [];
      setMyTeam(team);
    } catch (error: any) {
      setStatus(error.message || 'Could not load team.');
    }
  }

  async function loadPayroll() {
    try {
      const payrollData = await AsyncStorage.getItem('ashwa.payroll');
      const payroll: PayrollRecord[] = payrollData ? JSON.parse(payrollData) : [];
      setPayrollHistory(payroll);
    } catch (error: any) {
      setStatus(error.message || 'Could not load payroll.');
    }
  }

  async function processMonthlyPayroll() {
    setLoading(true);
    try {
      const payrollData = await AsyncStorage.getItem('ashwa.payroll');
      const payroll: PayrollRecord[] = payrollData ? JSON.parse(payrollData) : [];

      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      myTeam.forEach((member) => {
        const existing = payroll.find((p) => p.driverId === member.id && p.month === currentMonth);
        if (!existing) {
          payroll.push({
            id: Math.random().toString(36).substr(2, 9),
            driverId: member.id,
            driverName: member.name,
            month: currentMonth,
            amount: member.monthlyPay,
            status: 'PENDING',
          });
        }
      });

      await AsyncStorage.setItem('ashwa.payroll', JSON.stringify(payroll));
      await loadPayroll();
      setStatus('Payroll calculated for this month!');
    } catch (error: any) {
      setStatus(error.message || 'Could not process payroll.');
    } finally {
      setLoading(false);
    }
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

  // Post Job Screen
  if (screen === 'post-job') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Post a Job</Text>
          <Text style={styles.bodyDark}>Hire another driver for one of your routes.</Text>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Select Route</Text>
            {routes.map((route) => (
              <View key={route.id} style={[styles.row, { marginBottom: 8, paddingVertical: 8 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{route.school}</Text>
                  <Text style={styles.metric}>{route.direction} | {route.time}</Text>
                </View>
                <Button
                  title={newJobRoute === route.id ? 'Selected' : 'Select'}
                  onPress={() => setNewJobRoute(route.id)}
                />
              </View>
            ))}
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Monthly Pay (₹)</Text>
            <TextInput
              value={newJobPay}
              onChangeText={setNewJobPay}
              placeholder="12000"
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Preview</Text>
            {newJobRoute && (
              <>
                <Text style={styles.metric}>Route: {routes.find((r) => r.id === newJobRoute)?.school}</Text>
                <Text style={styles.metric}>Pay: ₹{newJobPay}</Text>
              </>
            )}
          </View>
          <View style={styles.actions}>
            <Button title={loading ? 'Posting...' : 'Post Job'} onPress={postJobMock} disabled={loading} />
            <Button title="Back to jobs" onPress={() => setScreen('jobs')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // My Jobs Screen (for hiring)
  if (screen === 'jobs') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>My Jobs</Text>
          <Text style={styles.bodyDark}>Post jobs and manage your team.</Text>
          {myJobs.length > 0 && (
            <View style={styles.cardInline}>
              <Text style={styles.cardTitle}>Posted Jobs ({myJobs.length})</Text>
              {myJobs.map((job) => (
                <View key={job.id} style={[styles.row, { marginBottom: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{job.route.school}</Text>
                    <Text style={styles.metric}>{job.route.direction} | {job.route.time}</Text>
                    <Text style={styles.metric}>₹{job.payPerMonth}/month | {job.status}</Text>
                    <Text style={styles.metric}>Applied: {job.appliedCount}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={styles.actions}>
            <Button title="Post New Job" onPress={() => setScreen('post-job')} />
            <Button title="Browse Available Jobs" onPress={() => { loadJobs(); setScreen('apply-jobs'); }} />
            <Button title="My Team" onPress={() => { loadTeam(); setScreen('team'); }} />
            <Button title="Payroll" onPress={() => { loadPayroll(); setScreen('payroll'); }} />
            <Button title="Trip Dashboard" onPress={() => setScreen('trip')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Browse Jobs Screen
  if (screen === 'apply-jobs') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Available Jobs</Text>
          <Text style={styles.bodyDark}>Find driver jobs to apply for.</Text>
          {availableJobs.length > 0 ? (
            <FlatList
              data={availableJobs}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }]}>
                  <View style={{ width: '100%', marginBottom: 8 }}>
                    <Text style={styles.cardTitle}>{item.route.school}</Text>
                    <Text style={styles.metric}>Posted by: {item.ownerName}</Text>
                    <Text style={styles.metric}>{item.route.direction} | {item.route.time}</Text>
                    <Text style={styles.metric}>₹{item.payPerMonth}/month</Text>
                  </View>
                  <Button title="Apply Now" onPress={() => applyForJobMock(item.id)} />
                </View>
              )}
            />
          ) : (
            <EmptyState title="No jobs available" body="Check back later for new opportunities." />
          )}
          <Button title="Back to my jobs" onPress={() => setScreen('jobs')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // My Team Screen
  if (screen === 'team') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>My Team</Text>
          <Text style={styles.bodyDark}>View and manage hired drivers.</Text>
          {myTeam.length > 0 ? (
            <FlatList
              data={myTeam}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.cardInline}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.metric}>Route: {item.route.school} - {item.route.time}</Text>
                  <Text style={styles.metric}>Monthly Pay: ₹{item.monthlyPay}</Text>
                  <Text style={styles.metric}>Earned this month: ₹{item.earningsThisMonth}</Text>
                  <Text style={styles.metric}>Status: {item.status}</Text>
                  {item.phone && <Text style={styles.metric}>Phone: {item.phone}</Text>}
                </View>
              )}
            />
          ) : (
            <EmptyState title="No team members" body="Post a job and hire drivers to build your team." />
          )}
          <Button title="Post a job" onPress={() => setScreen('post-job')} />
          <Button title="Back to jobs" onPress={() => setScreen('jobs')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Payroll Screen
  if (screen === 'payroll') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Payroll History</Text>
          <Text style={styles.bodyDark}>Track salary payments to your drivers.</Text>
          <View style={styles.cardInline}>
            <Button title="Process Monthly Payroll" onPress={processMonthlyPayroll} disabled={loading} />
          </View>
          {payrollHistory.length > 0 ? (
            <FlatList
              data={payrollHistory}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.cardInline}>
                  <Text style={styles.cardTitle}>{item.driverName}</Text>
                  <Text style={styles.metric}>Month: {item.month}</Text>
                  <Text style={styles.metric}>Amount: ₹{item.amount}</Text>
                  <Text style={styles.metric}>Status: {item.status}</Text>
                  {item.paidAt && <Text style={styles.metric}>Paid: {new Date(item.paidAt).toLocaleDateString()}</Text>}
                </View>
              )}
            />
          ) : (
            <EmptyState title="No payroll records" body="Process monthly payroll to see payment history." />
          )}
          <Button title="Back to jobs" onPress={() => setScreen('jobs')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Success Stories Screen
  if (screen === 'success-stories') {
    return (
      <SuccessStoriesScreen
        token={token}
        onNavigate={(nextScreen) => setScreen(nextScreen as Screen)}
      />
    );
  }

  // Leaderboard Screen
  if (screen === 'leaderboard') {
    return (
      <LeaderboardScreen
        driverId={driverSummary?.id}
        token={token}
        onNavigate={(nextScreen) => setScreen(nextScreen as Screen)}
      />
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
          <Button title="Success Stories" onPress={() => setScreen('success-stories')} color={colors.accent} />
          <Button title="Leaderboard" onPress={() => setScreen('leaderboard')} color={colors.accent} />
          <Button title="Hiring System" onPress={() => { loadJobs(); setScreen('jobs'); }} />
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
