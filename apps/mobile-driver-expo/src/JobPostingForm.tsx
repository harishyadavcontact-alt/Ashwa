import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from './theme';

interface Route {
  id: string;
  name: string;
  time: string;
}

interface JobPostingFormProps {
  routes: Route[];
  onSubmit: (routeId: string, pay: number) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const JobPostingForm: React.FC<JobPostingFormProps> = ({
  routes,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [monthlyPay, setMonthlyPay] = useState('12000');

  const handleSubmit = async () => {
    if (!selectedRoute || !monthlyPay) {
      return;
    }
    await onSubmit(selectedRoute, Number(monthlyPay));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>+ Post Job</Text>
      <Text style={styles.subtitle}>Hire another driver for one of your routes</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Route</Text>
        {routes.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={[
              styles.routeOption,
              selectedRoute === route.id && styles.routeOptionSelected,
            ]}
            onPress={() => setSelectedRoute(route.id)}
          >
            <Text style={styles.routeName}>{route.name}</Text>
            <Text style={styles.routeTime}>{route.time}</Text>
            <View
              style={[
                styles.radioButton,
                selectedRoute === route.id && styles.radioButtonSelected,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Pay (₹)</Text>
        <TextInput
          style={styles.input}
          value={monthlyPay}
          onChangeText={setMonthlyPay}
          keyboardType="number-pad"
          placeholder="12000"
        />
      </View>

      {selectedRoute && (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Job Preview</Text>
          <View style={styles.previewItem}>
            <Text style={styles.previewTitle}>Route</Text>
            <Text style={styles.previewValue}>
              {routes.find((r) => r.id === selectedRoute)?.name}
            </Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewTitle}>Monthly Pay</Text>
            <Text style={styles.previewValue}>
              ₹{Number(monthlyPay).toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title={loading ? 'Posting...' : 'Post Job'}
          onPress={handleSubmit}
          disabled={!selectedRoute || !monthlyPay || loading}
          color={colors.accent}
        />
        <Button title="Cancel" onPress={onCancel} color={colors.muted} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  routeOption: {
    backgroundColor: colors.panel,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: '#f0fdf4',
  },
  routeName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  routeTime: {
    color: colors.muted,
    fontSize: 12,
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.line,
  },
  radioButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
  },
  preview: {
    backgroundColor: '#f9f8f6',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    color: colors.muted,
    fontSize: 12,
  },
  previewValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 8,
    marginBottom: 20,
  },
});
