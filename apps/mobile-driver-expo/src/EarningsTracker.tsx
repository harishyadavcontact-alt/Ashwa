import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { colors } from './theme';

interface EarningsBreakdownProps {
  routes: Array<{ name: string; earnings: number }>;
}

interface EarningsTrackerProps {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  earningsBreakdown: EarningsBreakdownProps['routes'];
  onBreakdownPress?: () => void;
}

export function EarningsTracker({
  todayEarnings,
  weekEarnings,
  monthEarnings,
  earningsBreakdown,
  onBreakdownPress,
}: EarningsTrackerProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleBreakdownPress = () => {
    setShowBreakdown(true);
    onBreakdownPress?.();
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.mainCard}
          onPress={handleBreakdownPress}
          activeOpacity={0.7}
        >
          <Text style={styles.mainLabel}>TODAY'\''S EARNINGS</Text>
          <Text style={styles.mainAmount}>₹{todayEarnings.toLocaleString(''en-IN'')}</Text>
          <Text style={styles.mainSubtext}>Tap for breakdown</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>THIS WEEK</Text>
            <Text style={styles.statAmount}>₹{weekEarnings.toLocaleString(''en-IN'')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>THIS MONTH</Text>
            <Text style={styles.statAmount}>₹{monthEarnings.toLocaleString(''en-IN'')}</Text>
          </View>
        </View>
      </View>

      <Modal visible={showBreakdown} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EARNINGS BREAKDOWN</Text>
              <TouchableOpacity onPress={() => setShowBreakdown(false)}>
                <Text style={styles.closeButton}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {earningsBreakdown.length > 0 ? (
                earningsBreakdown.map((route, idx) => (
                  <View key={idx} style={styles.breakdownItem}>
                    <Text style={styles.routeName}>{route.name}</Text>
                    <Text style={styles.routeEarnings}>
                      ₹{route.earnings.toLocaleString(''en-IN'')}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noData}>No earnings data available</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowBreakdown(false)}
            >
              <Text style={styles.closeModalButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  mainCard: {
    backgroundColor: ''#22c55e'',
    borderRadius: 16,
    padding: 20,
    justifyContent: ''center'',
    alignItems: ''center'',
    gap: 8,
  },
  mainLabel: {
    color: ''#f0fdf4'',
    fontSize: 12,
    fontWeight: ''700'',
    textTransform: ''uppercase'',
    letterSpacing: 1,
  },
  mainAmount: {
    color: colors.panel,
    fontSize: 36,
    fontWeight: ''800'',
  },
  mainSubtext: {
    color: ''#dcfce7'',
    fontSize: 12,
    fontStyle: ''italic'',
  },
  statsRow: {
    flexDirection: ''row'',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: ''center'',
    alignItems: ''center'',
    gap: 6,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: ''600'',
    textTransform: ''uppercase'',
    letterSpacing: 0.5,
  },
  statAmount: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: ''700'',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: ''rgba(0, 0, 0, 0.7)'',
    justifyContent: ''center'',
    alignItems: ''center'',
  },
  modal: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    width: ''85%'',
    maxHeight: ''70%'',
    overflow: ''hidden'',
    gap: 16,
  },
  modalHeader: {
    flexDirection: ''row'',
    justifyContent: ''space-between'',
    alignItems: ''center'',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: ''700'',
    textTransform: ''uppercase'',
    letterSpacing: 0.5,
  },
  closeButton: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: ''700'',
  },
  modalContent: {
    paddingHorizontal: 20,
    gap: 12,
    maxHeight: 300,
  },
  breakdownItem: {
    flexDirection: ''row'',
    justifyContent: ''space-between'',
    alignItems: ''center'',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  routeName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: ''600'',
  },
  routeEarnings: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: ''700'',
  },
  noData: {
    color: colors.muted,
    fontSize: 14,
    textAlign: ''center'',
    paddingVertical: 20,
  },
  closeModalButton: {
    backgroundColor: colors.accent,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: ''center'',
    alignItems: ''center'',
  },
  closeModalButtonText: {
    color: colors.panel,
    fontSize: 14,
    fontWeight: ''700'',
    textTransform: ''uppercase'',
    letterSpacing: 0.5,
  },
});
