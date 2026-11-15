import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from './theme';

interface RouteProfit {
  name: string;
  profit: number;
  occupancy: number;
  trend: number;
  trendDirection: 'up' | 'down';
  recommendation?: 'scale' | 'consider' | 'drop';
}

interface ProfitabilityData {
  routes: RouteProfit[];
}

interface ProfitabilityCardProps {
  data: ProfitabilityData;
}

export const ProfitabilityCard: React.FC<ProfitabilityCardProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case 'scale': return '#22c55e';
      case 'consider': return '#f59e0b';
      case 'drop': return '#dc2626';
      default: return colors.muted;
    }
  };

  const getRecommendationText = (rec?: string) => {
    switch (rec) {
      case 'scale': return 'Scale this route ↑';
      case 'consider': return 'Consider dropping';
      case 'drop': return 'Struggling route';
      default: return '';
    }
  };

  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#06b6d4' }]}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
      >
        <Text style={styles.title}>Route Profitability</Text>
        <Text style={styles.arrow}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.routesList}>
          {data.routes.map((route, idx) => (
            <View key={idx} style={styles.routeItem}>
              <View style={styles.routeHeader}>
                <View>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.occupancy}>
                    {route.occupancy}% occupancy
                  </Text>
                </View>
                <View style={styles.profitContainer}>
                  <Text style={styles.profit}>₹{route.profit.toLocaleString()}</Text>
                  <Text
                    style={[
                      styles.trendText,
                      { color: route.trendDirection === 'up' ? '#22c55e' : '#dc2626' },
                    ]}
                  >
                    {route.trendDirection === 'up' ? '↑' : '↓'} ₹{Math.abs(route.trend).toLocaleString()}
                  </Text>
                </View>
              </View>

              {route.recommendation && (
                <View
                  style={[
                    styles.recommendation,
                    {
                      backgroundColor:
                        route.recommendation === 'scale'
                          ? '#dcfce7'
                          : route.recommendation === 'consider'
                            ? '#fef3c7'
                            : '#fee2e2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.recommendationText,
                      { color: getRecommendationColor(route.recommendation) },
                    ]}
                  >
                    {getRecommendationText(route.recommendation)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {!expanded && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Tap to see {data.routes.length} routes profitability breakdown
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  arrow: {
    color: colors.muted,
    fontSize: 12,
  },
  routesList: {
    gap: 12,
  },
  routeItem: {
    borderLeftWidth: 2,
    borderLeftColor: '#06b6d4',
    paddingLeft: 12,
    gap: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  occupancy: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  profitContainer: {
    alignItems: 'flex-end',
  },
  profit: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  trendText: {
    fontSize: 12,
    marginTop: 4,
  },
  recommendation: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summary: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  summaryText: {
    color: colors.muted,
    fontSize: 13,
  },
});
