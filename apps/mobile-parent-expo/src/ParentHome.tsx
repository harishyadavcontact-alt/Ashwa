import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import MapView, { Marker, AnimatedRegion } from 'react-native-maps';
import { ActionBar } from './ActionBar';
import { ReferralCard } from './ReferralCard';
import { InfoTip } from './InfoTip';
import { NotificationBanner } from './NotificationBanner';
import { colors } from './theme';
import type {
  DriverServiceSummary,
  CurrentAssignmentState,
  CurrentTripState,
  AttendanceRecord,
  MonthlyAttendanceSummary,
  CallRecordData,
} from '@ashwa/shared';

const MAP_UPDATE_INTERVAL = 10000; // 10 seconds

interface ParentHomeProps {
  token: string;
  children: any[];
  assignment: any;
  trip: any;
  driverLoc: { latitude: number; longitude: number };
  referralEarnings: number;
  referralCode: string;
  monthlyAttendance: MonthlyAttendanceSummary | null;
  attendanceRecords: AttendanceRecord[];
  activeCall: CallRecordData | null;
  callDuration: number;
  onCallDriver: () => void;
  onAttendanceHistory: () => void;
  onReferrals: () => void;
  onSettings: () => void;
  onMore: () => void;
  onLogout: () => void;
  onTrackingOpen: () => void;
  onEmergency: () => void;
  isLoading?: boolean;
}

export function ParentHome({
  token,
  children,
  assignment,
  trip,
  driverLoc,
  referralEarnings,
  referralCode,
  monthlyAttendance,
  attendanceRecords,
  activeCall,
  callDuration,
  onCallDriver,
  onAttendanceHistory,
  onReferrals,
  onSettings,
  onMore,
  onLogout,
  onTrackingOpen,
  onEmergency,
  isLoading = false,
}: ParentHomeProps) {
  const [showCallModal, setShowCallModal] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStartTime, setDemoStartTime] = useState<number | null>(null);
  const [demoDemoLoc, setDemoDemoLoc] = useState({ latitude: 12.97, longitude: 77.59 });
  const [demoStatus, setDemoStatus] = useState('');
  const [showInfoTip, setShowInfoTip] = useState(false);
  const [demoHasRun, setDemoHasRun] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'trip-start' | 'arrived' | 'boarded' | 'school-arrival' | 'trip-complete';
    driverName: string;
    childName: string;
    schoolName?: string;
    eta?: number;
    arrivalTime?: string;
    duration?: string;
    distance?: string;
  } | null>(null);
  const [locationLastUpdated, setLocationLastUpdated] = useState(new Date());
  const mapRef = useRef<MapView>(null);
  const animatedRegion = useRef(
    new AnimatedRegion({
      latitude: driverLoc.latitude,
      longitude: driverLoc.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    })
  ).current;

  const primaryChild = children[0];
  const driverName = assignment?.driver?.name || 'Driver pending';
  const isVerified = assignment?.driver?.verificationStatus === 'VERIFIED';

  // Get child status for display
  const getChildStatus = (): string => {
    if (!primaryChild) return 'No child profile';
    if (trip?.status === 'ACTIVE') {
      const events = attendanceRecords.filter(r => r.status === 'ATTENDED');
      const lastEvent = events[events.length - 1];
      if (lastEvent?.droppedTime) {
        const time = new Date(lastEvent.droppedTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `Dropped ${time}`;
      }
      return 'On way home';
    }
    if (assignment?.status === 'ACCEPTED') return 'Driver assigned';
    if (assignment?.status === 'REQUESTED') return 'Awaiting response';
    return 'Needs assignment';
  };

  // Get ETA - fetch from backend
  const [eta, setEta] = useState<string>('—');
  const [etaLastUpdated, setEtaLastUpdated] = useState<Date | null>(null);

  const getETA = (): string => eta;

  // Fetch real ETA from backend
  useEffect(() => {
    if (!trip || trip.status !== 'ACTIVE') {
      setEta('—');
      return;
    }

    const fetchETA = async () => {
      try {
        // TODO: Replace with actual API endpoint using trip.id
        const tripId = trip.id || 'demo-trip';
        const response = await fetch(`http://localhost:3000/api/trips/eta/${tripId}`);
        const data = await response.json();

        if (data.eta) {
          setEta(`${data.eta} min`);
        } else if (data.status === 'En route') {
          setEta('En route');
        } else {
          setEta(data.status || '—');
        }
        setEtaLastUpdated(new Date());
      } catch (error) {
        // Fallback to "En route" if API is unavailable
        setEta('En route');
      }
    };

    fetchETA();
    const etaInterval = setInterval(fetchETA, MAP_UPDATE_INTERVAL);
    return () => clearInterval(etaInterval);
  }, [trip?.id, trip?.status]);

  // Update map animation
  useEffect(() => {
    if (mapRef.current && trip?.status === 'ACTIVE') {
      mapRef.current.animateToRegion({
        latitude: driverLoc.latitude,
        longitude: driverLoc.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
    setLocationLastUpdated(new Date());
  }, [driverLoc]);

  // Auto-update location every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (trip?.status === 'ACTIVE' && !demoMode) {
        setLocationLastUpdated(new Date());
      }
    }, MAP_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [trip?.status, demoMode]);

  // Demo ride animation
  useEffect(() => {
    if (!demoMode || !demoStartTime) return;

    const demoInterval = setInterval(() => {
      const elapsed = (Date.now() - demoStartTime) / 1000; // seconds
      const progress = Math.min(elapsed / 120, 1); // 2-minute demo

      if (progress < 0.25) {
        // 0-30s: Van moves toward school
        setDemoDemoLoc({
          latitude: 12.97 + (12.99 - 12.97) * (progress / 0.25),
          longitude: 77.59 + (77.61 - 77.59) * (progress / 0.25),
        });
        setDemoStatus('Van on the way...');
      } else if (progress < 0.5) {
        // 30-60s: Van arrives at school, child boards
        setDemoDemoLoc({ latitude: 12.99, longitude: 77.61 });
        const seconds = Math.floor(progress * 120);
        setDemoStatus(`Boarded ${7 + Math.floor(seconds / 60)}:${String(45 + (seconds % 60)).padStart(2, '0')}`);
      } else if (progress < 0.75) {
        // 60-90s: Van returns home
        const subProgress = (progress - 0.5) / 0.25;
        setDemoDemoLoc({
          latitude: 12.99 - (12.99 - 12.98) * subProgress,
          longitude: 77.61 - (77.61 - 77.60) * subProgress,
        });
        setDemoStatus('At school');
      } else if (progress < 1) {
        // 90-120s: Arriving home, celebration
        const subProgress = (progress - 0.75) / 0.25;
        setDemoDemoLoc({
          latitude: 12.98 - (12.98 - 12.97) * subProgress,
          longitude: 77.60 - (77.60 - 77.59) * subProgress,
        });
        setDemoStatus(`Dropped ${3}:${15 + Math.floor(subProgress * 45)}`);
      } else {
        // Demo complete
        setDemoMode(false);
        setDemoHasRun(true);
        setDemoStatus('');
      }
    }, 500);

    return () => clearInterval(demoInterval);
  }, [demoMode, demoStartTime]);

  // Show active call modal
  useEffect(() => {
    if (activeCall) {
      setShowCallModal(true);
    }
  }, [activeCall]);

  const attendedDays = monthlyAttendance?.attendedDays || 0;
  const totalDays = monthlyAttendance?.totalDays || 0;
  const attendancePercentage = totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 0;

  // Success story should show after day 21
  const showSuccessStory = attendedDays >= 21;

  return (
    <SafeAreaView style={styles.page}>
      {/* Premium Notifications */}
      {notification && (
        <NotificationBanner
          type={notification.type}
          driverName={notification.driverName}
          childName={notification.childName}
          schoolName={notification.schoolName}
          eta={notification.eta}
          arrivalTime={notification.arrivalTime}
          duration={notification.duration}
          distance={notification.distance}
          onDismiss={() => setNotification(null)}
          onAction={() => {
            if (notification.type === 'arrived' || notification.type === 'boarded') {
              onCallDriver?.();
            } else if (notification.type === 'school-arrival') {
              // Rate driver action
            }
          }}
        />
      )}

      {/* Premium Header with Branding & Trust Signals */}
      <View style={styles.premiumHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.brandName}>Ashwa Safe Rides</Text>
          <View style={styles.trustSignals}>
            <Text style={styles.trustText}>✓ Verified Driver</Text>
            <Text style={styles.trustDot}>•</Text>
            <Text style={styles.trustText}>⭐ {attendancePercentage}% Safe</Text>
            <Text style={styles.trustDot}>•</Text>
            <Text style={styles.trustText}>500+ families</Text>
          </View>
        </View>
      </View>

      {/* Info Tip */}
      <InfoTip
        tip="Live location updates every 10s"
        visible={showInfoTip}
      />

      {/* Call Status Modal */}
      {activeCall && (
        <Modal
          visible={showCallModal && activeCall.status !== 'ENDED'}
          transparent
          animationType="slide"
        >
          <View style={styles.callModalOverlay}>
            <View style={styles.callModalContent}>
              <Text style={styles.callModalTitle}>
                {activeCall.status === 'INITIATED' ? 'Calling...' : 'Connected'}
              </Text>
              <Text style={styles.callModalSubtitle}>
                {activeCall.receiverName || 'Driver'}
              </Text>
              {activeCall.childName && (
                <Text style={styles.callModalChild}>{activeCall.childName}</Text>
              )}
              <Text style={styles.callTimer}>
                {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
              </Text>
              <Text style={styles.callStatus}>
                {activeCall.status === 'INITIATED' ? '[Calling...]' : '[Connected]'}
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Story Modal - Auto shows after day 21 */}
      {showSuccessStory && (
        <Modal visible transparent animationType="fade">
          <View style={styles.successOverlay}>
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>⭐</Text>
              <Text style={styles.successTitle}>21 Days Attended!</Text>
              <Text style={styles.successText}>
                Your child has been on {attendedDays} trips. The driver is reliable, your child is safe.
              </Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => {
                  // Dismiss modal
                }}
              >
                <Text style={styles.successButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Main Map (80% of screen) */}
      <View style={styles.mapContainer}>
        {trip?.status === 'ACTIVE' || demoMode ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: demoMode ? demoDemoLoc.latitude : driverLoc.latitude,
              longitude: demoMode ? demoDemoLoc.longitude : driverLoc.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={{
                latitude: demoMode ? demoDemoLoc.latitude : driverLoc.latitude,
                longitude: demoMode ? demoDemoLoc.longitude : driverLoc.longitude,
              }}
              title={demoMode ? "Demo Van" : "Driver"}
              pinColor={demoMode ? '#3b82f6' : (isVerified ? '#10b981' : '#ff9800')}
            />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.placeholderText}>Waiting for trip to start</Text>
          </View>
        )}

        {/* Premium Bottom Sheet (Swiggy-style) */}
        {trip?.status === 'ACTIVE' && (
          <View style={styles.swiggyBottomSheet}>
            {/* Driver Card (Premium) */}
            <View style={styles.driverCardPremium}>
              {/* Driver Avatar + Info */}
              <View style={styles.driverHeaderRow}>
                <View style={styles.driverAvatarContainer}>
                  <Text style={styles.driverAvatar}>🚗</Text>
                </View>
                <View style={styles.driverInfoColumn}>
                  <Text style={styles.driverNameBold}>{driverName}</Text>
                  <View style={styles.ratingRow}>
                    {isVerified && <Text style={styles.verifiedCheckmark}>✓</Text>}
                    <Text style={styles.ratingText}>⭐ 4.9 | Verified</Text>
                  </View>
                </View>
                {/* Earnings Badge */}
                <View style={styles.earningsBadge}>
                  <Text style={styles.earningsBadgeText}>₹{referralEarnings}</Text>
                  <Text style={styles.earningsBadgeLabel}>earned</Text>
                </View>
              </View>

              {/* Trip Status (Celebratory) */}
              <View style={styles.tripStatusRow}>
                <Text style={styles.tripStatusIcon}>📍</Text>
                <View>
                  <Text style={styles.tripStatusMain}>
                    {demoMode ? demoStatus : getChildStatus()}
                  </Text>
                  <Text style={styles.tripStatusSub}>
                    {primaryChild?.name} · {getETA()}
                  </Text>
                </View>
              </View>

              {/* Action Buttons (Premium) */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.actionButtonCall} onPress={onCallDriver}>
                  <Text style={styles.actionButtonIcon}>📞</Text>
                  <Text style={styles.actionButtonLabel}>CALL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonMore}>
                  <Text style={styles.actionButtonIcon}>⋮</Text>
                  <Text style={styles.actionButtonLabel}>MORE</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Referral Card (Prominent) */}
            {referralEarnings < 2000 && (
              <View style={styles.referralCardProminent}>
                <Text style={styles.referralEmoji}>💰</Text>
                <Text style={styles.referralText}>Earn ₹200 per friend who joins</Text>
                <TouchableOpacity
                  style={styles.referralShareButton}
                  onPress={onReferrals}
                >
                  <Text style={styles.referralShareButtonText}>Share Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* SOS Button (Red, Always Visible, Top-Right) */}
        <TouchableOpacity
          style={styles.sosButtonPremium}
          onPress={onEmergency}
          activeOpacity={0.8}
        >
          <Text style={styles.sosButtonTextPremium}>🆘</Text>
        </TouchableOpacity>

        {/* Demo Ride Button */}
        {!demoHasRun && !trip?.status && (
          <TouchableOpacity
            style={styles.demoButtonPremium}
            onPress={() => {
              setDemoMode(true);
              setDemoStartTime(Date.now());
              setDemoDemoLoc({ latitude: 12.97, longitude: 77.59 });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.demoButtonTextPremium}>DEMO RIDE</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Bar (20% of screen) */}
      <ActionBar
        onCallDriver={onCallDriver}
        onAttendanceHistory={onAttendanceHistory}
        onReferrals={onReferrals}
        onMorePress={onMore}
        onSettings={onSettings}
        onLogout={onLogout}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}

const screenHeight = Dimensions.get('window').height;
const mapHeight = screenHeight * 0.8; // 80% for map

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#1e3a8a', // Dark blue premium background
  },

  // Premium Header with Branding
  premiumHeader: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
  },
  headerContent: {
    gap: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  trustSignals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24', // Gold accents
  },
  trustDot: {
    fontSize: 10,
    color: '#fbbf24',
  },

  mapContainer: {
    height: Dimensions.get('window').height * 0.65, // 65% for map (golden ratio)
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e5efe9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderSubText: {
    color: colors.muted,
    fontSize: 13,
  },

  // Overlays on map
  overlayBottomLeft: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 10,
  },
  driverBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  driverName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  verifiedBadge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },

  overlayBottomCenter: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -75 }],
    zIndex: 10,
  },
  childStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    width: 150,
  },
  childName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  childStatus: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },

  overlayBottomRight: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 10,
  },
  etaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  etaLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  etaTime: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },

  overlayTopLeft: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
  },
  childSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  childSelectorText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },

  topRightButtons: {
    position: 'absolute',
    top: 12,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  infoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  infoButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  sosButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sosButtonText: {
    color: colors.panel,
    fontSize: 12,
    fontWeight: '700',
  },

  trackingButton: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 10,
  },
  trackingButtonText: {
    color: colors.panel,
    fontSize: 12,
    fontWeight: '700',
  },

  demoButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 10,
  },
  demoButtonText: {
    color: colors.panel,
    fontSize: 12,
    fontWeight: '700',
  },

  updateIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  updateText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  // Attendance Bar
  attendanceBar: {
    backgroundColor: colors.panel,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  attendanceContent: {
    flex: 1,
    gap: 6,
  },
  attendanceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendanceMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  attendanceNumber: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  attendanceTotal: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },

  earningsQuick: {
    alignItems: 'flex-end',
    gap: 2,
  },
  earningsLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  earningsText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },

  // Call Modal
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
    marginVertical: 16,
  },
  callStatus: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },

  // Success Story
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 32,
    width: '80%',
    alignItems: 'center',
    gap: 16,
  },
  successEmoji: {
    fontSize: 48,
  },
  successTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  successText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  successButtonText: {
    color: colors.panel,
    fontSize: 14,
    fontWeight: '700',
  },

  // Premium Swiggy-style Bottom Sheet (Dark blue + gold)
  swiggyBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 16,
  },

  driverCardPremium: {
    backgroundColor: '#1e3a8a',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },

  driverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  driverAvatarContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#fbbf24',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  driverAvatar: {
    fontSize: 28,
  },

  driverInfoColumn: {
    flex: 1,
    gap: 4,
  },

  driverNameBold: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  verifiedCheckmark: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
  },

  ratingText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },

  earningsBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },

  earningsBadgeText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '800',
  },

  earningsBadgeLabel: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '600',
  },

  tripStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },

  tripStatusIcon: {
    fontSize: 20,
  },

  tripStatusMain: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },

  tripStatusSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },

  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  actionButtonCall: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },

  actionButtonMore: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },

  actionButtonIcon: {
    fontSize: 18,
  },

  actionButtonLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },

  referralCardProminent: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },

  referralEmoji: {
    fontSize: 24,
  },

  referralText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  referralShareButton: {
    backgroundColor: '#92400e',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },

  referralShareButtonText: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '800',
  },

  sosButtonPremium: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 56,
    height: 56,
    backgroundColor: '#dc2626',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },

  sosButtonTextPremium: {
    fontSize: 24,
  },

  demoButtonPremium: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },

  demoButtonTextPremium: {
    color: colors.panel,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
