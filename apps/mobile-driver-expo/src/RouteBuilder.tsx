import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';

interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'drop' | 'school';
  order: number;
}

export function RouteBuilder({ onSave }: { onSave: (stops: RouteStop[]) => void }) {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [addingStop, setAddingStop] = useState(false);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<'pickup' | 'drop' | 'school'>('pickup');

  const addStop = (lat: number, lng: number) => {
    const newStop: RouteStop = {
      id: Date.now().toString(),
      name: `Stop ${stops.length + 1}`,
      lat,
      lng,
      type: 'pickup',
      order: stops.length,
    };
    setStops([...stops, newStop]);
    setEditingStopId(newStop.id);
    setEditingName(newStop.name);
  };

  const updateStop = (id: string, name: string, type: 'pickup' | 'drop' | 'school') => {
    setStops(stops.map((s) => (s.id === id ? { ...s, name, type } : s)));
    setEditingStopId(null);
  };

  const removeStop = (id: string) => {
    setStops(stops.filter((s) => s.id !== id));
  };

  const moveStop = (id: string, direction: 'up' | 'down') => {
    const index = stops.findIndex((s) => s.id === id);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < stops.length - 1)) {
      const newStops = [...stops];
      const moveIndex = direction === 'up' ? index - 1 : index + 1;
      [newStops[index], newStops[moveIndex]] = [newStops[moveIndex], newStops[index]];
      setStops(newStops.map((s, i) => ({ ...s, order: i })));
    }
  };

  const getStopColor = (type: 'pickup' | 'drop' | 'school') => {
    switch (type) {
      case 'pickup':
        return '#4CAF50'; // Green
      case 'drop':
        return '#F44336'; // Red
      case 'school':
        return '#FFC107'; // Yellow
    }
  };

  const getStopEmoji = (type: 'pickup' | 'drop' | 'school') => {
    switch (type) {
      case 'pickup':
        return '🟢';
      case 'drop':
        return '🔴';
      case 'school':
        return '🟡';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map area */}
      <View style={styles.mapArea}>
        <Text style={styles.mapPlaceholder}>📍 Map</Text>
        <Text style={styles.mapHint}>Tap to add stops (not implemented in demo)</Text>
        {stops.length > 0 && (
          <View style={styles.routePreview}>
            <Text style={styles.previewTitle}>Route Preview:</Text>
            {stops.map((stop, i) => (
              <Text key={stop.id} style={styles.previewStop}>
                {i + 1}. {getStopEmoji(stop.type)} {stop.name}
              </Text>
            ))}
            <Text style={styles.previewStats}>
              {stops.length} stops · ~{Math.round(stops.length * 2)} km
            </Text>
          </View>
        )}
      </View>

      {/* Bottom sheet: Route builder */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Build Your Route</Text>

        {/* Add stop button */}
        <TouchableOpacity
          style={styles.addStopButton}
          onPress={() => addStop(13.0356 + Math.random() * 0.05, 77.5984 + Math.random() * 0.05)}
        >
          <Text style={styles.addStopButtonText}>+ Add Stop on Map</Text>
        </TouchableOpacity>

        {/* Stop list */}
        {stops.length > 0 ? (
          <ScrollView style={styles.stopsList}>
            {stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopCard}>
                {/* Stop number and drag */}
                <View style={styles.stopHeader}>
                  <View style={[styles.stopNumber, { backgroundColor: getStopColor(stop.type) }]}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{stop.name}</Text>
                    <Text style={styles.stopCoords}>
                      {stop.lat.toFixed(3)}, {stop.lng.toFixed(3)}
                    </Text>
                  </View>

                  {/* Type badge */}
                  <View style={[styles.typeBadge, { backgroundColor: getStopColor(stop.type) }]}>
                    <Text style={styles.typeBadgeText}>{stop.type}</Text>
                  </View>
                </View>

                {/* Edit/Delete buttons */}
                {editingStopId === stop.id ? (
                  <View style={styles.editForm}>
                    <TextInput
                      style={styles.editInput}
                      placeholder="Stop name"
                      value={editingName}
                      onChangeText={setEditingName}
                    />
                    <View style={styles.typeSelector}>
                      {(['pickup', 'drop', 'school'] as const).map((t) => (
                        <Pressable
                          key={t}
                          style={[
                            styles.typeButton,
                            editingType === t && {
                              backgroundColor: getStopColor(t),
                            },
                          ]}
                          onPress={() => setEditingType(t)}
                        >
                          <Text style={styles.typeButtonText}>{getStopEmoji(t)} {t}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => updateStop(stop.id, editingName, editingType)}
                    >
                      <Text style={styles.saveButtonText}>✓ Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.stopActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setEditingStopId(stop.id);
                        setEditingName(stop.name);
                        setEditingType(stop.type);
                      }}
                    >
                      <Text style={styles.actionButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => moveStop(stop.id, 'up')}
                      >
                        <Text style={styles.actionButtonText}>⬆ Up</Text>
                      </TouchableOpacity>
                    )}
                    {index < stops.length - 1 && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => moveStop(stop.id, 'down')}
                      >
                        <Text style={styles.actionButtonText}>⬇ Down</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => removeStop(stop.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑 Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Distance to next stop */}
                {index < stops.length - 1 && (
                  <Text style={styles.distanceLabel}>
                    ↓ ~{Math.round(Math.random() * 5 + 2)} km to next
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyState}>Tap "Add Stop" to build your route</Text>
        )}

        {/* Save button */}
        {stops.length >= 2 && (
          <TouchableOpacity style={styles.saveRouteButton} onPress={() => onSave(stops)}>
            <Text style={styles.saveRouteButtonText}>📍 Save Route ({stops.length} stops)</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPlaceholder: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapHint: {
    fontSize: 14,
    color: '#666',
  },
  routePreview: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewStop: {
    fontSize: 12,
    marginBottom: 4,
    color: '#333',
  },
  previewStats: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomSheet: {
    maxHeight: '50%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addStopButton: {
    backgroundColor: '#1b5e20',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  addStopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stopsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  stopCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1b5e20',
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stopCoords: {
    fontSize: 12,
    color: '#999',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stopActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 6,
    minWidth: 70,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  distanceLabel: {
    fontSize: 11,
    color: '#1b5e20',
    marginTop: 8,
    fontWeight: '600',
  },
  editForm: {
    marginBottom: 12,
  },
  editInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#1b5e20',
    padding: 10,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyState: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  saveRouteButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
  },
  saveRouteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
