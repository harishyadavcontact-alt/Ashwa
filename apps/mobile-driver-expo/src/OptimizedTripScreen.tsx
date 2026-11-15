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

  const mapHeight = screenHeight * 0.6;
  const statusHeight = screenHeight * 0.4;
  const totalFamiliesServed = Math.floor(todayEarnings / 240);
  const ownerEligible = totalFamiliesServed >= 50;

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={[styles.mapSection, { height: mapHeight }]}>
          <MapPlaceholder pickupLocations={pickupLocations} driverLocation={driverLocation} currentRoute={`${schoolName} Route`} />
        </View>

        <View style={[styles.statusSection, { height: statusHeight }]}>
          <ScrollView contentContainerStyle={styles.statusContent} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
            {ownerEligible && (
              <TouchableOpacity style={styles.ownerBadge} onPress={() => setShowOwnerEligibility(true)}>
                <Text style={styles.ownerBadgeText}>💰 Eligible for Owner Loan</Text>
              </TouchableOpacity>
            )}
            {tripActive && (
              <TripStatusCard schoolName={schoolName} address={address} pickupTime={pickupTime} familiesOnBoard={familiesOnBoard} totalCapacity={totalCapacity} onArrivedPress={onArrivedAt} />
            )}
            <View style={styles.familiesCard}>
              <Text style={styles.cardLabel}>FAMILIES ON BOARD</Text>
              <Text style={styles.familiesCount}>{familiesOnBoard}/{totalCapacity} seats filled</Text>
              <View style={styles.seatBar}>
                <View style={[styles.seatFilled, { width: `${(familiesOnBoard / totalCapacity) * 100}%` }]} />
              </View>
            </View>
            <EarningsTracker todayEarnings={todayEarnings} weekEarnings={weekEarnings} monthEarnings={monthEarnings} earningsBreakdown={earningsBreakdown} />
            {routeStops.length > 0 && <RouteStatusCard stops={routeStops} />}
            {tripActive && (
              <TouchableOpacity style={styles.unavailableButton} onPress={onMarkUnavailable}>
                <Text style={styles.unavailableButtonText}>⚠ MARK UNAVAILABLE</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <BottomActionBar tripActive={tripActive} onStartTrip={onStartTrip} onPauseTrip={onPauseTrip} onArrivedAt={onArrivedAt} onCallParent={onCallParent} onEarningsPress={() => {}} onTeamPress={() => setShowTeamView(true)} onMorePress={() => {}} currentEarnings={todayEarnings} />
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
  mapSection: { overflow: ''hidden'', borderBottomWidth: 2, borderBottomColor: colors.line },
  statusSection: { backgroundColor: colors.surface, overflow: ''hidden'' },
  statusContent: { padding: 16, gap: 12 },
  cardLabel: { color: colors.accent, fontSize: 11, fontWeight: ''700'', textTransform: ''uppercase'', letterSpacing: 0.8 },
  ownerBadge: { backgroundColor: ''#fef3c7'', borderWidth: 1, borderColor: ''#f59e0b'', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 4 },
  ownerBadgeText: { color: ''#92400e'', fontSize: 14, fontWeight: ''700'', textAlign: ''center'' },
  familiesCard: { backgroundColor: colors.panel, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 10 },
  familiesCount: { color: colors.ink, fontSize: 18, fontWeight: ''700'' },
  seatBar: { height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: ''hidden'' },
  seatFilled: { height: ''100%'', backgroundColor: colors.accent, borderRadius: 4 },
  unavailableButton: { backgroundColor: ''#fee2e2'', borderWidth: 1, borderColor: ''#fecaca'', borderRadius: 10, paddingVertical: 12, marginTop: 8 },
  unavailableButtonText: { color: ''#991b1b'', fontSize: 13, fontWeight: ''700'', textAlign: ''center'', textTransform: ''uppercase'', letterSpacing: 0.5 },
  ownerModalOverlay: { position: ''absolute'', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: ''rgba(0, 0, 0, 0.6)'', justifyContent: ''center'', alignItems: ''center'' },
  ownerModal: { backgroundColor: colors.panel, borderRadius: 20, width: ''85%'', maxHeight: ''85%'', paddingHorizontal: 20, paddingVertical: 24, gap: 16 },
  ownerModalClose: { alignSelf: ''flex-end'', width: 32, height: 32, justifyContent: ''center'', alignItems: ''center'' },
  ownerModalCloseText: { fontSize: 20, fontWeight: ''700'', color: colors.muted },
  ownerModalContent: { gap: 14 },
  ownerModalTitle: { color: colors.ink, fontSize: 20, fontWeight: ''700'', textAlign: ''center'' },
  ownerModalSubtitle: { color: colors.accent, fontSize: 14, fontWeight: ''600'', textAlign: ''center'' },
  ownerStats: { flexDirection: ''row'', gap: 12 },
  ownerStat: { flex: 1, backgroundColor: ''#f0fdf4'', borderRadius: 10, paddingVertical: 12, alignItems: ''center'', gap: 4 },
  ownerStatValue: { color: ''#22c55e'', fontSize: 18, fontWeight: ''700'' },
  ownerStatLabel: { color: colors.muted, fontSize: 11, textAlign: ''center'' },
  ownerDescription: { color: colors.ink, fontSize: 13, lineHeight: 20, textAlign: ''center'' },
  ownerBenefits: { gap: 10 },
  benefit: { flexDirection: ''row'', gap: 10, alignItems: ''center'' },
  benefitIcon: { color: ''#22c55e'', fontSize: 16, fontWeight: ''700'' },
  benefitText: { color: colors.ink, fontSize: 13, flex: 1 },
  applyButton: { backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 10, marginVertical: 8 },
  applyButtonText: { color: colors.panel, fontSize: 13, fontWeight: ''700'', textAlign: ''center'', textTransform: ''uppercase'', letterSpacing: 0.5 },
  ownerModalDismiss: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  ownerModalDismissText: { color: colors.muted, fontSize: 12, fontWeight: ''700'', textAlign: ''center'', textTransform: ''uppercase'' },
});
