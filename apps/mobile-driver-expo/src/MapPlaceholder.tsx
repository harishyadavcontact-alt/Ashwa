import React from ''react'';
import { View, Text, StyleSheet } from ''react-native'';
import { colors } from ''./theme'';

interface MapPlaceholderProps {
  pickupLocations: Array<{ name: string; lat: number; lng: number }>;
  driverLocation?: { lat: number; lng: number };
  currentRoute?: string;
}

export function MapPlaceholder({
  pickupLocations,
  driverLocation,
  currentRoute,
}: MapPlaceholderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mapBackground}>
        <Text style={styles.mapText}>Route Map</Text>
        <Text style={styles.mapSubtext}>MapLibre Integration Ready</Text>
        {currentRoute && (
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Current Route:</Text>
            <Text style={styles.routeName}>{currentRoute}</Text>
          </View>
        )}
        <View style={styles.locationsInfo}>
          {pickupLocations.length > 0 && (
            <>
              <Text style={styles.locationsLabel}>{pickupLocations.length} Pickup Locations</Text>
              {pickupLocations.map((location, idx) => (
                <View key={idx} style={styles.locationItem}>
                  <Text style={styles.locationDot}>● </Text>
                  <Text style={styles.locationName}>{location.name}</Text>
                </View>
              ))}
            </>
          )}
        </View>
        {driverLocation && (
          <View style={styles.driverInfo}>
            <Text style={styles.driverMarker}>▲ Van Position</Text>
            <Text style={styles.driverCoords}>{driverLocation.lat.toFixed(3)}, {driverLocation.lng.toFixed(3)}</Text>
          </View>
        )}
        <View style={styles.updateInfo}>
          <Text style={styles.updateText}>Live updates every 10 seconds</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  mapBackground: { flex: 1, backgroundColor: ''#e8f1f5'', justifyContent: ''center'', alignItems: ''center'', paddingHorizontal: 20, gap: 16 },
  mapText: { fontSize: 28, fontWeight: ''700'', color: colors.ink },
  mapSubtext: { fontSize: 14, color: colors.muted },
  routeInfo: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, gap: 4, width: ''100%'', marginTop: 8 },
  routeLabel: { fontSize: 11, color: colors.panel, fontWeight: ''600'', textTransform: ''uppercase'' },
  routeName: { fontSize: 16, color: colors.panel, fontWeight: ''700'' },
  locationsInfo: { backgroundColor: colors.panel, padding: 14, borderRadius: 10, width: ''100%'', borderWidth: 1, borderColor: colors.line, gap: 8 },
  locationsLabel: { fontSize: 13, fontWeight: ''700'', color: colors.ink },
  locationItem: { flexDirection: ''row'', alignItems: ''center'', paddingLeft: 8 },
  locationDot: { fontSize: 10, color: colors.accent, fontWeight: ''700'' },
  locationName: { fontSize: 12, color: colors.muted },
  driverInfo: { backgroundColor: ''#fef3c7'', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, width: ''100%'', gap: 4 },
  driverMarker: { fontSize: 12, fontWeight: ''700'', color: ''#92400e'' },
  driverCoords: { fontSize: 11, color: ''#b45309'' },
  updateInfo: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: ''#dbeafe'', borderRadius: 8 },
  updateText: { fontSize: 11, color: ''#0c4a6e'', fontWeight: ''500'' },
});
