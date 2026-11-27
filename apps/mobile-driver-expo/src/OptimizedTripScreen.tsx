import React, { useState } from ''react'';
import { View, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Text, Dimensions } from ''react-native'';
import { colors } from ''./theme'';
import { MapPlaceholder } from ''./MapPlaceholder'';
import { TripStatusCard } from ''./TripStatusCard'';
import { EarningsTracker } from ''./EarningsTracker'';
import { RouteStatusCard } from ''./RouteStatusCard'';
import { BottomActionBar } from ''./BottomActionBar'';
import { TeamView } from ''./TeamView'';

interface OptimizedTripScreenProps {
  tripActive: boolean;
  schoolName: string;
  address: string;
  pickupTime: string;
  familiesOnBoard: number;
  totalCapacity: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  earningsBreakdown: Array<{ name: string; earnings: number }>;
  routeStops: Array<{ time: string; label: string; location?: string }>;
  team: any[];
  pickupLocations: Array<{ name: string; lat: number; lng: number }>;
  driverLocation?: { lat: number; lng: number };
  onStartTrip: () => void;
  onPauseTrip: () => void;
  onArrivedAt: () => void;
  onCallParent: () => void;
  onMarkUnavailable: () => void;
}

const { height: screenHeight } = Dimensions.get(''window'');

export function OptimizedTripScreen({
  tripActive,
  schoolName,
  address,
  pickupTime,
  familiesOnBoard,
  totalCapacity,
  todayEarnings,
  weekEarnings,
  monthEarnings,
  earningsBreakdown,
  routeStops,
  team,
  pickupLocations,
  driverLocation,
  onStartTrip,
  onPauseTrip,
  onArrivedAt,
  onCallParent,
  onMarkUnavailable,
}: OptimizedTripScreenProps) {
  const [showTeamView, setShowTeamView] = useState(false);
  const [showOwnerEligibility, setShowOwnerEligibility] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(false);

  const mapHeight = screenHeight * 0.6;
  const statusHeight = screenHeight * 0.4;
  const totalFamiliesServed = Math.floor(todayEarnings / 240);
  const ownerEligible = totalFamiliesServed >= 50;

  // Trip completion celebration
  if (tripCompleted) {
    return (
      <SafeAreaView style={styles.celebrationContainer}>
        <View style={styles.celebrationContent}>
          <Text style={styles.celebrationCheckmark}>✓</Text>
          <Text style={styles.celebrationTitle}>Trip Complete!</Text>
          <Text style={styles.celebrationSubtitle}>Earned ₹{todayEarnings}</Text>
          <View style={styles.celebrationStats}>
            <View><Text style={styles.celebrationStat}>10</Text><Text style={styles.celebrationLabel}>Families</Text></View>
            <View><Text style={styles.celebrationStat}>3</Text><Text style={styles.celebrationLabel}>Schools</Text></View>
            <View><Text style={styles.celebrationStat}>2h</Text><Text style={styles.celebrationLabel}>Time</Text></View>
          </View>
          <TouchableOpacity style={styles.celebrationButton} onPress={() => setTripCompleted(false)}>
            <Text style={styles.celebrationButtonText}>View Trip Details</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Earnings badge (top-right, always visible) */}
        <View style={styles.earningsBadge}>
          <Text style={styles.earningsValue}>₹{todayEarnings}</Text>
          <Text style={styles.earningsLabel}>Today</Text>
        </View>

        {/* Map section with next-stop overlay */}
        <View style={[styles.mapSection, { height: mapHeight }]}>
          <MapPlaceholder pickupLocations={pickupLocations} driverLocation={driverLocation} currentRoute={`${schoolName} Route`} />

          {/* Next-stop card overlay (Swiggy-style) */}
          {tripActive && (
            <View style={styles.nextStopOverlay}>
              <View style={styles.nextStopCard}>
                <View style={styles.nextStopHeader}>
                  <Text style={styles.nextStopEmoji}>📍</Text>
                  <Text style={styles.nextStopSchool}>{schoolName}</Text>
                </View>
                <Text style={styles.nextStopAddress}>{address}</Text>
                <Text style={styles.nextStopDistance}>2.3 km away</Text>

                <View style={styles.nextStopFamily}>
                  <Text style={styles.nextStopFamilyText}>Pickup: Priya (Arjun) → School drop</Text>
                </View>

                <View style={styles.nextStopActions}>
                  <TouchableOpacity style={styles.nextStopButton} onPress={onStartTrip}>
                    <Text style={styles.nextStopButtonText}>▶ START</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.nextStopButton, { flex: 0.3 }]} onPress={onCallParent}>
                    <Text style={styles.nextStopButtonText}>📞</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Status section - simplified and scannable */}
        <View style={[styles.statusSection, { height: statusHeight }]}>
          <ScrollView contentContainerStyle={styles.statusContent} showsVerticalScrollIndicator={false}>
            {/* Trip progress card */}
            <View style={styles.progressCard}>
              <Text style={styles.progressLabel}>✓ Trip Progress</Text>
              <Text style={styles.progressValue}>{familiesOnBoard}/10 families picked up</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(familiesOnBoard / 10) * 100}%` }]} />
              </View>
            </View>

            {/* Earnings tracking */}
            <View style={styles.earningsCard}>
              <Text style={styles.earningsCardLabel}>💰 Earnings</Text>
              <Text style={styles.earningsCardValue}>₹{todayEarnings}</Text>
              <Text style={styles.earningsCardTrend}>↑ +₹50 since start</Text>
            </View>

            {/* Time remaining */}
            <View style={styles.timeCard}>
              <Text style={styles.timeLabel}>⏱️ Time Remaining</Text>
              <Text style={styles.timeValue}>45 min</Text>
            </View>

            {showOwnerEligibility && (
              <TouchableOpacity style={styles.ownerBadge} onPress={() => setShowOwnerEligibility(false)}>
                <Text style={styles.ownerBadgeText}>💰 Ready for Owner? Tap here</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Clean 5-button bottom action bar */}
      <View style={styles.cleanBottomBar}>
        <TouchableOpacity style={[styles.bottomButton, { flex: 2, backgroundColor: colors.accent }]} onPress={onStartTrip}>
          <Text style={[styles.bottomButtonText, { fontWeight: 'bold', fontSize: 16 }]}>▶ START</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButton} onPress={onArrivedAt}>
          <Text style={styles.bottomButtonText}>✓ ARRIVED</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButton} onPress={onCallParent}>
          <Text style={styles.bottomButtonText}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButton} onPress={() => {}}>
          <Text style={styles.bottomButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <TeamView visible={showTeamView} team={team} onClose={() => setShowTeamView(false)} />

      {showOwnerEligibility && (
        <View style={styles.ownerModalOverlay}>
          <View style={styles.ownerModal}>
            <TouchableOpacity style={styles.ownerModalClose} onPress={() => setShowOwnerEligibility(false)}>
              <Text style={styles.ownerModalCloseText}>X</Text>
            </TouchableOpacity>
            <View style={styles.ownerModalContent}>
              <Text style={styles.ownerModalTitle}>Ready for Next Level</Text>
              <Text style={styles.ownerModalSubtitle}>Congratulations!</Text>
              <View style={styles.ownerStats}>
                <View style={styles.ownerStat}>
                  <Text style={styles.ownerStatValue}>{totalFamiliesServed}</Text>
                  <Text style={styles.ownerStatLabel}>Families Served</Text>
                </View>
                <View style={styles.ownerStat}>
                  <Text style={styles.ownerStatValue}>₹{(todayEarnings * 30).toLocaleString(''en-IN'')}</Text>
                  <Text style={styles.ownerStatLabel}>Est. Monthly</Text>
                </View>
              </View>
              <Text style={styles.ownerDescription}>You''ve successfully built a reliable service with {totalFamiliesServed} families. You''re now eligible to:</Text>
              <View style={styles.ownerBenefits}>
                <View style={styles.benefit}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>Apply for van loan (₹5L)</Text>
                </View>
                <View style={styles.benefit}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>Hire drivers for routes</Text>
                </View>
                <View style={styles.benefit}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>Scale to multiple services</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.applyButton}>
                <Text style={styles.applyButtonText}>APPLY FOR LOAN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ownerModalDismiss} onPress={() => setShowOwnerEligibility(false)}>
                <Text style={styles.ownerModalDismissText}>DISMISS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  mapSection: { overflow: ''hidden'', borderBottomWidth: 2, borderBottomColor: colors.line, position: ''relative'' },
  statusSection: { backgroundColor: colors.surface, overflow: ''hidden'', flex: 1 },
  statusContent: { padding: 16, gap: 12 },

  // Celebration screen
  celebrationContainer: { flex: 1, backgroundColor: ''#fff'', justifyContent: ''center'', alignItems: ''center'' },
  celebrationContent: { alignItems: ''center'', gap: 16 },
  celebrationCheckmark: { fontSize: 80, color: colors.accent, fontWeight: ''bold'' },
  celebrationTitle: { fontSize: 32, fontWeight: ''bold'', color: colors.ink },
  celebrationSubtitle: { fontSize: 20, color: colors.accent, fontWeight: ''700'' },
  celebrationStats: { flexDirection: ''row'', gap: 24, marginVertical: 24 },
  celebrationStat: { fontSize: 24, fontWeight: ''bold'', color: colors.ink, textAlign: ''center'' },
  celebrationLabel: { fontSize: 12, color: colors.muted, marginTop: 4 },
  celebrationButton: { backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, marginTop: 24 },
  celebrationButtonText: { color: ''#fff'', fontSize: 14, fontWeight: ''700'', textAlign: ''center'' },

  // Earnings badge (top-right)
  earningsBadge: { position: ''absolute'', top: 12, right: 12, backgroundColor: ''#fff'', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, zIndex: 10, boxShadow: ''0 2px 8px rgba(0,0,0,0.1)'' },
  earningsValue: { fontSize: 18, fontWeight: ''bold'', color: colors.accent },
  earningsLabel: { fontSize: 11, color: colors.muted, textAlign: ''center'' },

  // Next-stop overlay
  nextStopOverlay: { position: ''absolute'', bottom: 16, left: 16, right: 16 },
  nextStopCard: { backgroundColor: ''#fff'', borderRadius: 12, padding: 16, gap: 12, boxShadow: ''0 4px 12px rgba(0,0,0,0.15)'' },
  nextStopHeader: { flexDirection: ''row'', alignItems: ''center'', gap: 8 },
  nextStopEmoji: { fontSize: 24 },
  nextStopSchool: { fontSize: 18, fontWeight: ''bold'', color: colors.ink, flex: 1 },
  nextStopAddress: { fontSize: 14, color: colors.ink, fontWeight: ''600'' },
  nextStopDistance: { fontSize: 13, color: colors.muted },
  nextStopFamily: { backgroundColor: ''#f3f4f6'', borderRadius: 8, padding: 10 },
  nextStopFamilyText: { fontSize: 13, color: colors.ink, fontWeight: ''500'' },
  nextStopActions: { flexDirection: ''row'', gap: 8 },
  nextStopButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: ''center'' },
  nextStopButtonText: { color: ''#fff'', fontWeight: ''bold'', fontSize: 14 },

  // Status cards (simplified)
  progressCard: { backgroundColor: colors.panel, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.line },
  progressLabel: { fontSize: 13, fontWeight: ''700'', color: colors.muted },
  progressValue: { fontSize: 16, fontWeight: ''bold'', color: colors.ink },
  progressBar: { height: 6, backgroundColor: colors.line, borderRadius: 3, overflow: ''hidden'' },
  progressFill: { height: ''100%'', backgroundColor: colors.accent, borderRadius: 3 },

  earningsCard: { backgroundColor: ''#fffbea'', borderRadius: 12, padding: 14, gap: 4, borderWidth: 1, borderColor: ''#ffc72c'' },
  earningsCardLabel: { fontSize: 13, fontWeight: ''700'', color: colors.muted },
  earningsCardValue: { fontSize: 20, fontWeight: ''bold'', color: colors.accent },
  earningsCardTrend: { fontSize: 12, color: ''#f59e0b'' },

  timeCard: { backgroundColor: colors.panel, borderRadius: 12, padding: 14, gap: 4, borderWidth: 1, borderColor: colors.line },
  timeLabel: { fontSize: 13, fontWeight: ''700'', color: colors.muted },
  timeValue: { fontSize: 18, fontWeight: ''bold'', color: colors.ink },

  // Clean bottom bar (5 buttons)
  cleanBottomBar: { flexDirection: ''row'', backgroundColor: ''#fff'', borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 12, paddingHorizontal: 8, gap: 8, alignItems: ''center'' },
  bottomButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: ''#f3f4f6'', justifyContent: ''center'', alignItems: ''center'' },
  bottomButtonText: { fontSize: 12, fontWeight: ''600'', color: colors.ink },

  cardLabel: { color: colors.accent, fontSize: 11, fontWeight: ''700'', textTransform: ''uppercase'', letterSpacing: 0.8 },
  ownerBadge: { backgroundColor: ''#fef3c7'', borderWidth: 1, borderColor: ''#f59e0b'', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 4 },
  ownerBadgeText: { color: ''#92400e'', fontSize: 14, fontWeight: ''700'', textAlign: ''center'' },
});
