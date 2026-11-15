import type { CurrentAssignmentState, CurrentTripState, DriverServiceSummary, DriverVerification, EventType, Job, TeamMember, PayrollRecord, Route, Service, ServiceType, SubstituteReason, SubstituteAssignment, DriverAvailability, CallRecordData } from '@ashwa/shared';
import { sendWhatsAppAlert, sendSubstituteNotification, sendBackupBonusNotification, sendRefundNotification, initiateCall, endCall, getActiveCall } from '@ashwa/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from './api';
import { LeaderboardScreen } from './LeaderboardScreen';
import { SuccessStoriesScreen } from './SuccessStoriesScreen';
import { AnalyticsScreen } from './AnalyticsScreen';
import { VerificationBadge } from './VerificationBadge';
import { VerificationForm } from './VerificationForm';
import { colors } from './theme';

type Screen = 'auth' | 'onboarding' | 'inbox' | 'trip' | 'jobs' | 'apply-jobs' | 'team' | 'payroll' | 'post-job' | 'success-stories' | 'leaderboard' | 'services' | 'create-service' | 'verification' | 'analytics' | 'trip-history';

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

  // Multi-Service Routing state
  const [services, setServices] = useState<Service[]>([]);
  const [serviceDraft, setServiceDraft] = useState({
    name: '',
    type: 'SCHOOL' as ServiceType,
    startTime: '07:00',
    endTime: '09:00',
    lat: 12.97,
    lng: 77.59,
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    capacity: 12,
    pricePerMonth: 3000,
  });

  // Driver Verification state
  const [verification, setVerification] = useState<DriverVerification | null>(null);

  // Substitute Driver Assignment state
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState<SubstituteReason>('SICK');
  const [substitutes, setSubstitutes] = useState<SubstituteAssignment[]>([]);
  const [availableBackups, setAvailableBackups] = useState<DriverAvailability[]>([]);
  const [currentSubstitute, setCurrentSubstitute] = useState<SubstituteAssignment | null>(null);
  const [findingBackup, setFindingBackup] = useState(false);

  // Trip History state
  const [tripHistory, setTripHistory] = useState<Array<{ tripId: string; tripType: string; date: string; children: Array<{ childId: string; childName: string; boarded?: string; dropped?: string }> }>>([]);

  // Voice Calling state
  const [activeCall, setActiveCall] = useState<CallRecordData | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callModalVisible, setCallModalVisible] = useState(false);

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
    initializeDemoServices();
    initializeDemoVerifications();
  }, []);

  async function initializeDemoServices() {
    try {
      const existingServices = await AsyncStorage.getItem('ashwa.services');
      if (!existingServices) {
        // Initialize demo services
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
        setServices(demoServices);
      } else {
        const loaded = JSON.parse(existingServices);
        setServices(loaded);
      }
    } catch (error: any) {
      console.error('Failed to initialize services:', error);
    }
  }

  async function initializeDemoVerifications() {
    try {
      const existingVerifications = await AsyncStorage.getItem('ashwa.verifications');
      if (!existingVerifications) {
        // Load current driver verification from demo data
        const demoVerification: DriverVerification = {
          id: 'demo-verification',
          driverId: 'demo-driver',
          licenseNumber: 'DL-1234567890',
          licenseExpiry: '2026-12-31',
          insuranceDocUrl: 'https://demo.supabase.co/insurance.pdf',
          policyNumber: 'POL-9876543210',
          insuranceExpiry: '2027-06-30',
          policeCheckDone: true,
          status: 'APPROVED',
          approvedAt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
          approvedBy: 'admin-1',
        };
        await AsyncStorage.setItem('ashwa.verifications', JSON.stringify(demoVerification));
        setVerification(demoVerification);
      } else {
        const loaded = JSON.parse(existingVerifications);
        setVerification(loaded);
      }
    } catch (error: any) {
      console.error('Failed to initialize verifications:', error);
    }
  }

  async function loadServices() {
    try {
      const stored = await AsyncStorage.getItem('ashwa.services');
      const serviceList: Service[] = stored ? JSON.parse(stored) : [];
      setServices(serviceList);
    } catch (error: any) {
      setStatus(error.message || 'Could not load services.');
    }
  }

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

  async function loadTripHistory() {
    try {
      const history = await api.getTripHistory(token, 30);
      setTripHistory(history);
    } catch (error: any) {
      setStatus(error.message || 'Could not load trip history.');
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

  async function loadVerification() {
    try {
      const stored = await AsyncStorage.getItem('ashwa.verifications');
      if (stored) {
        const loaded = JSON.parse(stored);
        setVerification(loaded);
      } else {
        setVerification(null);
      }
    } catch (error: any) {
      setStatus(error.message || 'Could not load verification status.');
    }
  }

  async function submitVerification(data: {
    licenseNumber: string;
    licenseExpiry: string;
    policyNumber: string;
    insuranceExpiry: string;
    policeCheckDone: boolean;
  }) {
    if (!token) return;
    setLoading(true);
    try {
      const newVerification: DriverVerification = {
        id: Math.random().toString(36).substr(2, 9),
        driverId: token,
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry,
        insuranceDocUrl: 'https://demo.supabase.co/insurance.pdf',
        policyNumber: data.policyNumber,
        insuranceExpiry: data.insuranceExpiry,
        policeCheckDone: data.policeCheckDone,
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      };

      // Save to localStorage (demo)
      await AsyncStorage.setItem('ashwa.verifications', JSON.stringify(newVerification));
      setVerification(newVerification);

      // Analytics tracking
      console.log('[Analytics] track("verification_submitted", {documents: 2})');

      setStatus('Verification submitted! Your documents are under admin review.');
      setScreen('trip');
    } catch (error: any) {
      setStatus(error.message || 'Could not submit verification.');
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

  // Substitute Driver Assignment functions
  async function markUnavailable() {
    if (!token || !trip?.id) {
      setStatus('No active trip. Cannot mark unavailable.');
      return;
    }
    setFindingBackup(true);
    setStatus('Finding backup driver...');
    try {
      // In demo mode, store the unavailability
      const availability: DriverAvailability = {
        id: Math.random().toString(36).substr(2, 9),
        driverId: token,
        date: new Date(),
        available: false,
        reason: unavailableReason,
        routesCoveringCount: 0,
      };

      // Store in localStorage for demo
      const storedAvailability = await AsyncStorage.getItem('ashwa.availability');
      const availabilityList: DriverAvailability[] = storedAvailability ? JSON.parse(storedAvailability) : [];
      availabilityList.push(availability);
      await AsyncStorage.setItem('ashwa.availability', JSON.stringify(availabilityList));

      // Find backup driver (demo logic)
      const backup = await findBackupDriverForService();

      if (backup) {
        // Create substitute assignment
        const assignment: SubstituteAssignment = {
          id: Math.random().toString(36).substr(2, 9),
          originalDriverId: token,
          backupDriverId: backup.driverId,
          serviceId: trip.id,
          date: new Date(),
          reason: unavailableReason,
          backupFee: 200,
          status: 'PENDING',
        };
        setCurrentSubstitute(assignment);

        // Store assignment
        const stored = await AsyncStorage.getItem('ashwa.substitutes');
        const list: SubstituteAssignment[] = stored ? JSON.parse(stored) : [];
        list.push(assignment);
        await AsyncStorage.setItem('ashwa.substitutes', JSON.stringify(list));
        setSubstitutes(list);

        // Send notifications
        await sendSubstituteNotification({
          parentPhoneNumber: '+919876543210',
          backupDriverName: 'Priya',
          backupDriverVerified: true,
          childName: 'Student',
          schoolName: 'School A',
        });

        await sendBackupBonusNotification({
          backupPhoneNumber: '+919876543211',
          backupDriverName: 'Priya',
          schoolName: 'School A',
          bonusAmount: 200,
        });

        setStatus('✓ Backup assigned: Priya for School A today');
      } else {
        // No backup found - issue refund
        await sendRefundNotification({
          parentPhoneNumber: '+919876543210',
          childName: 'Student',
          refundAmount: 50,
          schoolName: 'School A',
        });
        setStatus('No backup available. Parent has been notified and refunded ₹50.');
      }

      setShowUnavailableModal(false);
    } catch (error: any) {
      setStatus(error.message || 'Could not mark unavailable.');
    } finally {
      setFindingBackup(false);
    }
  }

  async function findBackupDriverForService(): Promise<DriverAvailability | null> {
    try {
      // Demo logic: randomly find a backup (50% chance)
      const hasBackup = Math.random() > 0.5;
      if (hasBackup) {
        const backup: DriverAvailability = {
          id: 'backup-1',
          driverId: 'backup-driver-priya',
          date: new Date(),
          available: true,
          routesCoveringCount: 1,
        };
        return backup;
      }
      return null;
    } catch (error: any) {
      console.error('Error finding backup:', error);
      return null;
    }
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

  async function createService() {
    if (!serviceDraft.name || !serviceDraft.startTime || !serviceDraft.endTime) {
      setStatus('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('ashwa.services');
      const serviceList: Service[] = stored ? JSON.parse(stored) : [];

      const newService: Service = {
        id: Math.random().toString(36).substr(2, 9),
        driverId: token || 'demo-driver',
        name: serviceDraft.name,
        type: serviceDraft.type,
        startTime: serviceDraft.startTime,
        endTime: serviceDraft.endTime,
        location: { lat: serviceDraft.lat, lng: serviceDraft.lng },
        daysOfWeek: serviceDraft.daysOfWeek,
        capacity: serviceDraft.capacity,
        pricePerMonth: serviceDraft.pricePerMonth,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      serviceList.push(newService);
      await AsyncStorage.setItem('ashwa.services', JSON.stringify(serviceList));

      // Track analytics
      track('service_created', {
        type: serviceDraft.type,
        daysOfWeek: serviceDraft.daysOfWeek.length,
      });

      setServices(serviceList);
      setServiceDraft({
        name: '',
        type: 'SCHOOL',
        startTime: '07:00',
        endTime: '09:00',
        lat: 12.97,
        lng: 77.59,
        daysOfWeek: [1, 2, 3, 4, 5],
        capacity: 12,
        pricePerMonth: 3000,
      });
      setScreen('services');
      setStatus('Service created successfully!');
    } catch (error: any) {
      setStatus(error.message || 'Could not create service.');
    } finally {
      setLoading(false);
    }
  }

  function track(event: string, properties: Record<string, any>) {
    // Analytics tracking function - logs to console in demo mode
    console.log(`[Analytics] ${event}:`, properties);
  }

  function getDayName(dayNum: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || '';
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

  // Route Analytics Screen
  if (screen === 'analytics') {
    return (
      <AnalyticsScreen
        token={token}
        onNavigate={(nextScreen) => setScreen(nextScreen as Screen)}
      />
    );
  }

  // Driver Verification Screen
  if (screen === 'verification') {
    return (
      <VerificationForm
        token={token}
        driverId={driverSummary?.id || 'demo-driver'}
        currentVerification={verification}
        onSubmit={submitVerification}
        onBack={() => setScreen('trip')}
      />
    );
  }

  // My Services Screen
  if (screen === 'services') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>My Services</Text>
          <Text style={styles.bodyDark}>Create multiple routes to increase revenue: morning school, afternoon tuition, evening dance.</Text>
          {loading ? <ActivityIndicator color={colors.accent} /> : null}
          {services.length > 0 ? (
            <FlatList
              data={services}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.metric}>
                      {item.startTime} - {item.endTime} | {item.daysOfWeek.map((d) => getDayName(d).substring(0, 3)).join(', ')}
                    </Text>
                    <Text style={styles.metric}>₹{item.pricePerMonth}/month | {item.capacity} seats</Text>
                  </View>
                </View>
              )}
            />
          ) : (
            <EmptyState title="No services yet" body="Create your first service to start offering multiple routes." />
          )}
          <View style={styles.actions}>
            <Button title="+ New Service" onPress={() => setScreen('create-service')} color={colors.accent} />
            <Button title="Trip dashboard" onPress={() => setScreen('trip')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Create Service Screen
  if (screen === 'create-service') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Text style={styles.titleDark}>Create Service</Text>
          <Text style={styles.bodyDark}>Add a new route to your van for same-day multi-service operations.</Text>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Service name</Text>
            <TextInput
              value={serviceDraft.name}
              onChangeText={(value) => setServiceDraft({ ...serviceDraft, name: value })}
              placeholder="e.g., St. Xavier School"
              style={styles.input}
            />
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Service type</Text>
            {(['SCHOOL', 'TUITION', 'DANCE', 'SPORTS', 'OTHER'] as ServiceType[]).map((type) => (
              <Button
                key={type}
                title={type}
                onPress={() => setServiceDraft({ ...serviceDraft, type })}
                color={serviceDraft.type === type ? colors.accent : undefined}
              />
            ))}
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Start time</Text>
            <TextInput
              value={serviceDraft.startTime}
              onChangeText={(value) => setServiceDraft({ ...serviceDraft, startTime: value })}
              placeholder="HH:MM"
              style={styles.input}
            />
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>End time</Text>
            <TextInput
              value={serviceDraft.endTime}
              onChangeText={(value) => setServiceDraft({ ...serviceDraft, endTime: value })}
              placeholder="HH:MM"
              style={styles.input}
            />
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Days of week</Text>
            {[1, 2, 3, 4, 5, 6].map((day) => (
              <Button
                key={day}
                title={getDayName(day).substring(0, 3)}
                onPress={() => {
                  const updated = serviceDraft.daysOfWeek.includes(day)
                    ? serviceDraft.daysOfWeek.filter((d) => d !== day)
                    : [...serviceDraft.daysOfWeek, day];
                  setServiceDraft({ ...serviceDraft, daysOfWeek: updated });
                }}
                color={serviceDraft.daysOfWeek.includes(day) ? colors.accent : undefined}
              />
            ))}
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Capacity (seats)</Text>
            <TextInput
              value={String(serviceDraft.capacity)}
              onChangeText={(value) => setServiceDraft({ ...serviceDraft, capacity: Number(value) || 0 })}
              placeholder="12"
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Price per month (₹)</Text>
            <TextInput
              value={String(serviceDraft.pricePerMonth)}
              onChangeText={(value) => setServiceDraft({ ...serviceDraft, pricePerMonth: Number(value) || 0 })}
              placeholder="3000"
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.cardInline}>
            <Text style={styles.cardTitle}>Estimated earnings</Text>
            <Text style={styles.metric}>₹{serviceDraft.pricePerMonth}/month</Text>
          </View>
          <View style={styles.actions}>
            <Button title={loading ? 'Creating...' : 'Create service'} onPress={createService} disabled={loading} />
            <Button title="Back" onPress={() => setScreen('services')} />
          </View>
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

        <VerificationBadge verification={verification} />

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
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Substitute Assignments</Text>
          {currentSubstitute ? (
            <>
              <Text style={styles.metric}>Status: {currentSubstitute.status}</Text>
              <Text style={styles.metric}>Backup Fee: ₹{currentSubstitute.backupFee}</Text>
            </>
          ) : (
            <Text style={styles.metric}>No active substitute assignment</Text>
          )}
          {trip && (
            <Button
              title={findingBackup ? 'Finding backup...' : 'Mark myself unavailable'}
              onPress={() => setShowUnavailableModal(true)}
              disabled={findingBackup}
              color="#d32f2f"
            />
          )}
        </View>
        <View style={styles.actions}>
          <Button title="Refresh" onPress={refresh} />
          <Button title="Start morning trip" onPress={() => startTrip('MORNING')} />
          <Button title="Start afternoon trip" onPress={() => startTrip('AFTERNOON')} />
          <Button title="Ping location now" onPress={() => pingLocation('Location ping sent for the active trip.')} />
          <Button title="End trip" onPress={endTrip} />
          <Button title="Inbox" onPress={() => setScreen('inbox')} />
          <Button title="Driver Verification" onPress={() => { loadVerification(); setScreen('verification'); }} color={colors.accent} />
          <Button title="My Services" onPress={() => { loadServices(); setScreen('services'); }} color={colors.accent} />
          <Button title="Success Stories" onPress={() => setScreen('success-stories')} color={colors.accent} />
          <Button title="Leaderboard" onPress={() => setScreen('leaderboard')} color={colors.accent} />
          <Button title="Route Analytics" onPress={() => setScreen('analytics')} color={colors.accent} />
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
