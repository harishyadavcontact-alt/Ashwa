import React, { useState } from ''react'';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from ''react-native'';
import { colors } from ''./theme'';

interface BottomActionBarProps {
  tripActive: boolean;
  onStartTrip: () => void;
  onPauseTrip: () => void;
  onArrivedAt: () => void;
  onCallParent: () => void;
  onEarningsPress: (earnings: number) => void;
  onTeamPress: () => void;
  onMorePress: () => void;
  currentEarnings: number;
}

export function BottomActionBar({
  tripActive,
  onStartTrip,
  onPauseTrip,
  onArrivedAt,
  onCallParent,
  onEarningsPress,
  onTeamPress,
  onMorePress,
  currentEarnings,
}: BottomActionBarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {!tripActive && (
            <TouchableOpacity style={[styles.button, styles.startButton]} onPress={onStartTrip}>
              <Text style={styles.buttonText}>▶ START TRIP</Text>
            </TouchableOpacity>
          )}
          {tripActive && (
            <TouchableOpacity style={[styles.button, styles.pauseButton]} onPress={onPauseTrip}>
              <Text style={styles.buttonText}>⏸ PAUSE</Text>
            </TouchableOpacity>
          )}
          {tripActive && (
            <TouchableOpacity style={[styles.button, styles.arrivedButton]} onPress={onArrivedAt}>
              <Text style={styles.buttonText}>✓ ARRIVED</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, styles.callButton]} onPress={onCallParent}>
            <Text style={styles.buttonText}>📞 CALL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.earningsButton]} onPress={() => onEarningsPress(currentEarnings)}>
            <Text style={styles.buttonText}>₹ {currentEarnings}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.teamButton]} onPress={onTeamPress}>
            <Text style={styles.buttonText}>👥 TEAM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.moreButton]} onPress={() => setShowMoreMenu(true)}>
            <Text style={styles.buttonText}>⋮ MORE</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal visible={showMoreMenu} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.moreMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>MORE OPTIONS</Text>
              <TouchableOpacity onPress={() => setShowMoreMenu(false)}>
                <Text style={styles.closeButton}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { onMorePress(); setShowMoreMenu(false); }}>
                <Text style={styles.menuItemText}>⚙️ Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>? Help & Support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>📋 Trip History</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>📊 Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>🎖️ Leaderboard</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeMenuButton} onPress={() => setShowMoreMenu(false)}>
              <Text style={styles.closeMenuButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.panel, borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 12, paddingHorizontal: 12 },
  scrollContent: { gap: 10, paddingHorizontal: 8 },
  button: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, justifyContent: ''center'', alignItems: ''center'', minWidth: 90 },
  buttonText: { color: colors.panel, fontSize: 12, fontWeight: ''700'', textTransform: ''uppercase'', letterSpacing: 0.5 },
  startButton: { backgroundColor: ''#22c55e'' },
  pauseButton: { backgroundColor: ''#6b7280'' },
  arrivedButton: { backgroundColor: colors.accent },
  callButton: { backgroundColor: ''#f59e0b'' },
  earningsButton: { backgroundColor: ''#10b981'' },
  teamButton: { backgroundColor: ''#8b5cf6'' },
  moreButton: { backgroundColor: colors.muted },
  modalOverlay: { flex: 1, backgroundColor: ''rgba(0, 0, 0, 0.5)'', justifyContent: ''flex-end'' },
  moreMenu: { backgroundColor: colors.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 16 },
  menuHeader: { flexDirection: ''row'', justifyContent: ''space-between'', alignItems: ''center'', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  menuTitle: { color: colors.ink, fontSize: 16, fontWeight: ''700'', textTransform: ''uppercase'', letterSpacing: 0.5 },
  closeButton: { color: colors.muted, fontSize: 20, fontWeight: ''700'' },
  menuItems: { gap: 10 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: ''#f3f4f6'', borderRadius: 10 },
  menuItemText: { color: colors.ink, fontSize: 14, fontWeight: ''600'' },
  closeMenuButton: { backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 10, justifyContent: ''center'', alignItems: ''center'', marginTop: 8 },
  closeMenuButtonText: { color: colors.panel, fontSize: 14, fontWeight: ''700'', textTransform: ''uppercase'', letterSpacing: 0.5 },
});
