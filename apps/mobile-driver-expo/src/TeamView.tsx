import React, { useState } from ''react'';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal } from ''react-native'';
import { colors } from ''./theme'';

interface TeamMember {
  id: string;
  name: string;
  route: { school: string; time: string };
  monthlyPay: number;
  earningsThisMonth: number;
  status: string;
  phone?: string;
}

interface TeamViewProps {
  team: TeamMember[];
  visible: boolean;
  onClose: () => void;
}

export function TeamView({ team, visible, onClose }: TeamViewProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MY TEAM</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>X</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {team.length > 0 ? (
            <FlatList
              data={team}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.teamCard}
                  onPress={() => setSelectedMember(item)}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.driverName}>{item.name}</Text>
                      <Text style={styles.driverRoute}>
                        {item.route.school} - {item.route.time}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: item.status === ''ACTIVE'' ? ''#22c55e'' : ''#f59e0b'' },
                      ]}
                    >
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.label}>Monthly Pay</Text>
                      <Text style={styles.value}>₹{item.monthlyPay.toLocaleString(''en-IN'')}</Text>
                    </View>
                    <View>
                      <Text style={styles.label}>Earned This Month</Text>
                      <Text style={styles.value}>₹{item.earningsThisMonth.toLocaleString(''en-IN'')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No team members yet</Text>
              <Text style={styles.emptyStateBody}>Post a job and hire drivers to build your team</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: ''row'', justifyContent: ''space-between'', alignItems: ''center'', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  headerTitle: { color: colors.ink, fontSize: 24, fontWeight: ''700'' },
  closeButton: { color: colors.muted, fontSize: 24, fontWeight: ''700'' },
  listContainer: { flex: 1, padding: 16 },
  teamCard: { backgroundColor: colors.panel, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.line, gap: 12 },
  cardHeader: { flexDirection: ''row'', justifyContent: ''space-between'', alignItems: ''flex-start'' },
  driverName: { color: colors.ink, fontSize: 16, fontWeight: ''700'' },
  driverRoute: { color: colors.muted, fontSize: 13, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  statusText: { color: colors.panel, fontSize: 11, fontWeight: ''700'', textTransform: ''uppercase'' },
  cardFooter: { flexDirection: ''row'', justifyContent: ''space-between'', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  label: { color: colors.muted, fontSize: 11, textTransform: ''uppercase'', letterSpacing: 0.5 },
  value: { color: colors.ink, fontSize: 14, fontWeight: ''700'', marginTop: 4 },
  emptyState: { flex: 1, justifyContent: ''center'', alignItems: ''center'', paddingHorizontal: 20 },
  emptyStateTitle: { color: colors.ink, fontSize: 18, fontWeight: ''700'', textAlign: ''center'' },
  emptyStateBody: { color: colors.muted, fontSize: 14, textAlign: ''center'', marginTop: 8 },
});
