import type { RouteAnalytics, RouteRecommendation, EarningsTrendData } from '@ashwa/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from './theme';

interface AnalyticsScreenProps {
  token?: string;
  onNavigate?: (screen: string) => void;
}

type Tab = 'overview' | 'profitability' | 'recommendations' | 'earnings';

const DEMO_ROUTES: RouteAnalytics[] = [
  {
    id: '1',
    driverId: 'driver-1',
    serviceId: 'school-a',
    routeName: 'School A',
    month: 11,
    year: 2026,
    families: 5,
    revenue: 3000,
    fuelCost: 700,
    maintenanceCost: 500,
    netProfit: 1800,
    occupancyRate: 62.5,
    averageRating: 4.8,
    growth: 6.67,
    capacitySeats: 8,
    bookedSeats: 5,
  },
  {
    id: '2',
    driverId: 'driver-1',
    serviceId: 'school-b',
    routeName: 'School B',
    month: 11,
    year: 2026,
    families: 2,
    revenue: 600,
    fuelCost: 200,
    maintenanceCost: 200,
    netProfit: 200,
    occupancyRate: 25,
    averageRating: 3.5,
    growth: -33.33,
    capacitySeats: 8,
    bookedSeats: 2,
  },
  {
    id: '3',
    driverId: 'driver-1',
    serviceId: 'tuition-c',
    routeName: 'Tuition C',
    month: 11,
    year: 2026,
    families: 3,
    revenue: 2100,
    fuelCost: 400,
    maintenanceCost: 300,
    netProfit: 1400,
    occupancyRate: 90,
    averageRating: 4.9,
    growth: 55.56,
    capacitySeats: 4,
    bookedSeats: 3,
  },
];

const DEMO_EARNINGS: EarningsTrendData[] = [
  { month: 'Jun', revenue: 4500, expenses: 1800, netProfit: 2700 },
  { month: 'Jul', revenue: 5000, expenses: 1900, netProfit: 3100 },
  { month: 'Aug', revenue: 5200, expenses: 2000, netProfit: 3200 },
  { month: 'Sep', revenue: 5100, expenses: 2050, netProfit: 3050 },
  { month: 'Oct', revenue: 5300, expenses: 2100, netProfit: 3200 },
  { month: 'Nov', revenue: 5700, expenses: 1900, netProfit: 3800 },
];

export function AnalyticsScreen({ token, onNavigate }: AnalyticsScreenProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [routes, setRoutes] = useState<RouteAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  async function loadAnalyticsData() {
    setLoading(true);
    try {
      const storedData = await AsyncStorage.getItem('ashwa.route_analytics');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setRoutes(parsed);
      } else {
        // Initialize with demo data
        await AsyncStorage.setItem('ashwa.route_analytics', JSON.stringify(DEMO_ROUTES));
        setRoutes(DEMO_ROUTES);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setRoutes(DEMO_ROUTES);
    } finally {
      setLoading(false);
    }
  }

  function getRecommendations(): RouteRecommendation[] {
    return [
      {
        routeName: 'School A',
        recommendation: 'Excellent performance. 62% occupancy + high rating. Invite 3 more families.',
        action: 'SCALE',
        priority: 'HIGH',
      },
      {
        routeName: 'School B',
        recommendation: 'Struggling with 25% occupancy. Either drop or reduce price to ₹150.',
        action: 'DROP',
        priority: 'HIGH',
      },
      {
        routeName: 'Tuition C',
        recommendation: 'New route with good potential. 90% occupancy. Add 2 more families to maximize.',
        action: 'SCALE',
        priority: 'MEDIUM',
      },
    ];
  }

  function getTotalMetrics() {
    const totalRevenue = routes.reduce((sum, r) => sum + r.revenue, 0);
    const totalFamilies = routes.reduce((sum, r) => sum + r.families, 0);
    const lastMonth = 5500; // Demo: November last month revenue
    const growth = ((totalRevenue - lastMonth) / lastMonth) * 100;

    return {
      totalRevenue,
      totalFamilies,
      growth,
      lastMonthRevenue: lastMonth,
    };
  }

  function renderOverviewTab() {
    const metrics = getTotalMetrics();
    const lastEarning = DEMO_EARNINGS[DEMO_EARNINGS.length - 1];

    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Total Monthly Revenue</Text>
          <Text style={styles.metric}>₹{metrics.totalRevenue.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Families Served</Text>
          <Text style={styles.metric}>{metrics.totalFamilies} families across {routes.length} routes</Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Growth Trend</Text>
          <Text style={[styles.metric, { color: metrics.growth >= 0 ? '#2ecc71' : '#e74c3c' }]}>
            {metrics.growth >= 0 ? '↑' : '↓'} ₹{Math.abs(Math.round(metrics.totalRevenue - metrics.lastMonthRevenue))} vs last month ({Math.abs(metrics.growth).toFixed(1)}%)
          </Text>
        </View>
        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Net Profit This Month</Text>
          <Text style={styles.metric}>₹{lastEarning.netProfit.toLocaleString('en-IN')}</Text>
        </View>
      </ScrollView>
    );
  }

  function renderProfitabilityTab() {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <Text style={styles.routeName}>{item.routeName}</Text>
                <Text style={[styles.trendBadge, { color: item.growth >= 0 ? '#2ecc71' : '#e74c3c' }]}>
                  {item.growth >= 0 ? '↑' : '↓'} ₹{Math.abs(Math.round(item.growth * 10))}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Families</Text>
                  <Text style={styles.metricValue}>{item.families}</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Revenue</Text>
                  <Text style={styles.metricValue}>₹{item.revenue}</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Occupancy</Text>
                  <Text style={styles.metricValue}>{item.occupancyRate.toFixed(0)}%</Text>
                </View>
              </View>

              <View style={styles.costBreakdown}>
                <Text style={styles.costTitle}>Cost Breakdown</Text>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Fuel: ₹{item.fuelCost}</Text>
                  <Text style={styles.costLabel}>Maintenance: ₹{item.maintenanceCost}</Text>
                </View>
                <Text style={styles.costTotal}>Total Costs: ₹{item.fuelCost + item.maintenanceCost}</Text>
              </View>

              <View style={styles.profitSection}>
                <Text style={styles.profitLabel}>Net Profit</Text>
                <Text style={styles.profitValue}>₹{item.netProfit.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.ratingSection}>
                <Text style={styles.metricLabel}>Rating: {item.averageRating}/5.0</Text>
              </View>

              <View style={styles.actions}>
                <Button title="Scale" onPress={() => {}} />
                <Button title="Archive" onPress={() => {}} />
              </View>
            </View>
          )}
        />
      </ScrollView>
    );
  }

  function renderRecommendationsTab() {
    const recommendations = getRecommendations();

    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.routeName}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationRoute}>{item.routeName}</Text>
                <Text
                  style={[
                    styles.actionBadge,
                    {
                      backgroundColor:
                        item.action === 'SCALE'
                          ? '#2ecc71'
                          : item.action === 'DROP'
                            ? '#e74c3c'
                            : item.action === 'OPTIMIZE'
                              ? '#f39c12'
                              : '#3498db',
                    },
                  ]}
                >
                  {item.action}
                </Text>
              </View>
              <Text style={styles.recommendationText}>{item.recommendation}</Text>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>Priority: {item.priority}</Text>
              </View>
            </View>
          )}
        />
      </ScrollView>
    );
  }

  function renderEarningsTab() {
    const maxValue = Math.max(...DEMO_EARNINGS.map((e) => Math.max(e.revenue, e.expenses, e.netProfit)));
    const chartHeight = 200;

    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>6-Month Earnings Trend</Text>
          <View style={styles.chart}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
                <Text style={styles.legendLabel}>Revenue</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
                <Text style={styles.legendLabel}>Expenses</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
                <Text style={styles.legendLabel}>Net Profit</Text>
              </View>
            </View>

            <View style={{ height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
              {DEMO_EARNINGS.map((data, idx) => {
                const revenueHeight = (data.revenue / maxValue) * chartHeight;
                const expensesHeight = (data.expenses / maxValue) * chartHeight;
                const profitHeight = (data.netProfit / maxValue) * chartHeight;

                return (
                  <View key={idx} style={styles.barGroup}>
                    <View style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                      <View
                        style={[styles.bar, { height: revenueHeight, backgroundColor: '#3498db', width: '30%' }]}
                      />
                      <View
                        style={[styles.bar, { height: expensesHeight, backgroundColor: '#e74c3c', width: '30%' }]}
                      />
                      <View
                        style={[styles.bar, { height: profitHeight, backgroundColor: '#2ecc71', width: '30%' }]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{data.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.cardInline}>
          <Text style={styles.cardTitle}>Latest Month (Nov)</Text>
          {DEMO_EARNINGS.length > 0 && (
            <>
              <Text style={styles.metric}>Revenue: ₹{DEMO_EARNINGS[DEMO_EARNINGS.length - 1].revenue}</Text>
              <Text style={styles.metric}>Expenses: ₹{DEMO_EARNINGS[DEMO_EARNINGS.length - 1].expenses}</Text>
              <Text style={styles.metric}>Net Profit: ₹{DEMO_EARNINGS[DEMO_EARNINGS.length - 1].netProfit}</Text>
            </>
          )}
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.page}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.titleDark}>Route Analytics</Text>
        <Text style={styles.bodyDark}>Profitability, recommendations & earnings trends</Text>
      </View>

      <View style={styles.tabsContainer}>
        {(['overview', 'profitability', 'recommendations', 'earnings'] as const).map((tabName) => (
          <Button
            key={tabName}
            title={
              tabName === 'overview'
                ? 'Overview'
                : tabName === 'profitability'
                  ? 'Routes'
                  : tabName === 'recommendations'
                    ? 'Recs'
                    : 'Earnings'
            }
            onPress={() => setTab(tabName)}
            color={tab === tabName ? colors.accent : colors.muted}
          />
        ))}
      </View>

      {tab === 'overview' && renderOverviewTab()}
      {tab === 'profitability' && renderProfitabilityTab()}
      {tab === 'recommendations' && renderRecommendationsTab()}
      {tab === 'earnings' && renderEarningsTab()}

      <View style={styles.actions}>
        <Button title="Back to Trip Dashboard" onPress={() => onNavigate?.('trip')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  header: { padding: 20, paddingTop: 10, paddingBottom: 16 },
  titleDark: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  bodyDark: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 4 },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 4,
  },
  tabContent: { padding: 16, gap: 12 },
  cardInline: {
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  metric: { color: colors.muted, fontSize: 14 },
  routeCard: {
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeName: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  trendBadge: { fontSize: 14, fontWeight: '600' },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricCol: { alignItems: 'center' },
  metricLabel: { color: colors.muted, fontSize: 12 },
  metricValue: { color: colors.ink, fontSize: 16, fontWeight: '600', marginTop: 4 },
  costBreakdown: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 12, gap: 8 },
  costTitle: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  costRow: { flexDirection: 'row', justifyContent: 'space-between' },
  costLabel: { color: colors.muted, fontSize: 12 },
  costTotal: { color: colors.ink, fontSize: 13, fontWeight: '600', marginTop: 4 },
  profitSection: { backgroundColor: '#e8f5e9', padding: 12, borderRadius: 12, alignItems: 'center' },
  profitLabel: { color: colors.muted, fontSize: 12 },
  profitValue: { color: '#2ecc71', fontSize: 20, fontWeight: '700' },
  ratingSection: { paddingVertical: 8 },
  actions: { gap: 8, paddingHorizontal: 16, paddingBottom: 20 },
  recommendationCard: {
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationRoute: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  priorityBadge: { backgroundColor: '#fff3cd', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  priorityText: { color: '#856404', fontSize: 12, fontWeight: '600' },
  chartContainer: {
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  chartTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  chart: { gap: 16 },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 12, height: 12, borderRadius: 2 },
  legendLabel: { color: colors.muted, fontSize: 12 },
  barGroup: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { borderRadius: 4 },
  chartLabel: { color: colors.muted, fontSize: 11, textAlign: 'center' },
});
