import React from ''react'';
import { View, Text, StyleSheet } from ''react-native'';
import { colors } from ''./theme'';

interface RouteStop {
  time: string;
  label: string;
  location?: string;
}

interface RouteStatusCardProps {
  stops: RouteStop[];
}

export function RouteStatusCard({ stops }: RouteStatusCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ROUTE STATUS</Text>
      <View style={styles.timeline}>
        {stops.map((stop, index) => (
          <View key={index} style={styles.stopItem}>
            <View style={styles.timelineMarker}>
              <View style={styles.dot} />
              {index !== stops.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopTime}>{stop.time}</Text>
              <Text style={styles.stopLabel}>{stop.label}</Text>
              {stop.location && <Text style={styles.stopLocation}>{stop.location}</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.panel, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 16 },
  title: { color: colors.accent, fontSize: 12, fontWeight: ''700'', textTransform: ''uppercase'', letterSpacing: 1 },
  timeline: { gap: 8 },
  stopItem: { flexDirection: ''row'', gap: 12 },
  timelineMarker: { alignItems: ''center'', width: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  line: { position: ''absolute'', width: 2, height: 50, top: 20, backgroundColor: colors.line },
  stopContent: { flex: 1, paddingTop: 2 },
  stopTime: { color: colors.accent, fontSize: 13, fontWeight: ''700'' },
  stopLabel: { color: colors.ink, fontSize: 14, fontWeight: ''600'', marginTop: 2 },
  stopLocation: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
