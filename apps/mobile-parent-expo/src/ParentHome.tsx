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

  // Get ETA - simple demo value
  const getETA = (): string => {
    if (!trip || trip.status !== 'ACTIVE') return '—';
    return '8 min';
  };

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
        {trip?.status === 'ACTIVE' ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: driverLoc.latitude,
              longitude: driverLoc.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={{
                latitude: driverLoc.latitude,
                longitude: driverLoc.longitude,
              }}
              title="Driver"
              pinColor={isVerified ? colors.accent : '#ff9800'}
            />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.placeholderText}>Map activates on trip start</Text>
            <Text style={styles.placeholderSubText}>Tap the 📍 below to open full tracking</Text>
          </View>
        )}

        {/* Bottom-Left: Driver Name + Verified Badge */}
        {assignment?.driver && (
          <View style={styles.overlayBottomLeft}>
            <View style={styles.driverBadge}>
              <Text style={styles.driverName}>{driverName}</Text>
              {isVerified && <Text style={styles.verifiedBadge}>✓ VERIFIED</Text>}
            </View>
          </View>
        )}

        {/* Bottom-Center: Child Status */}
        {primaryChild && (
          <View style={styles.overlayBottomCenter}>
            <View style={styles.childStatusBadge}>
              <Text style={styles.childName}>{primaryChild.name}</Text>
              <Text style={styles.childStatus}>{getChildStatus()}</Text>
            </View>
          </View>
        )}

        {/* Bottom-Right: ETA */}
        {trip?.status === 'ACTIVE' && (
          <View style={styles.overlayBottomRight}>
            <View style={styles.etaBadge}>
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaTime}>{getETA()}</Text>
            </View>
          </View>
        )}

        {/* Top-Left: Child Selector (if 2+ kids) */}
        {children.length > 1 && (
          <View style={styles.overlayTopLeft}>
            <TouchableOpacity style={styles.childSelector}>
              <Text style={styles.childSelectorText}>
                {primaryChild?.name || 'Select child'} ▼
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top-Right: Info Button + SOS Button */}
        <View style={styles.topRightButtons}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowInfoTip(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.infoButtonText}>ⓘ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sosButton} onPress={onEmergency} activeOpacity={0.8}>
            <Text style={styles.sosButtonText}>🚨 SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Tracking Button */}
        {trip?.status === 'ACTIVE' && (
          <TouchableOpacity style={styles.trackingButton} onPress={onTrackingOpen}>
            <Text style={styles.trackingButtonText}>📍 TRACK</Text>
          </TouchableOpacity>
        )}

        {/* Location Update Indicator */}
        {trip?.status === 'ACTIVE' && (
          <View style={styles.updateIndicator}>
            <Text style={styles.updateText}>
              Updated {Math.round((Date.now() - locationLastUpdated.getTime()) / 1000)}s ago
            </Text>
          </View>
        )}
      </View>

      {/* Attendance Counter (Live Update) */}
      {monthlyAttendance && (
        <View style={styles.attendanceBar}>
          <View style={styles.attendanceContent}>
            <Text style={styles.attendanceLabel}>ATTENDANCE</Text>
            <View style={styles.attendanceMetric}>
              <Text style={styles.attendanceNumber}>{attendedDays}</Text>
              <Text style={styles.attendanceTotal}>/{totalDays}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(attendancePercentage, 100)}%` },
                ]}
              />
            </View>
          </View>

          {referralEarnings > 0 && (
            <View style={styles.earningsQuick}>
              <Text style={styles.earningsLabel}>₹{referralEarnings}</Text>
              <Text style={styles.earningsText}>earned</Text>
            </View>
          )}
        </View>
      )}

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
    backgroundColor: colors.surface,
  },
  mapContainer: {
    height: mapHeight,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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

  sosButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
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
});
