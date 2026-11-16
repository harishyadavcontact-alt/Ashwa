import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';

interface Metrics {
  families: number;
  kids: number;
  routes: number;
  drivers: number;
  totalEarnings: number;
  growthRate: number;
}

interface FunnelData {
  inviteSent: number;
  inviteOpened: number;
  signupComplete: number;
  childSetup: number;
  linked: number;
  firstTrip: number;
}

interface ChurnData {
  [key: string]: number;
}

interface UnitEconomics {
  cac: number;
  ltv: number;
  paybackPeriod: number;
}

interface LeaderboardEntry {
  driverId: string;
  name: string;
  familiesServed: number;
  tripsCompleted: number;
  attendancePercentage: number;
  referralsSent: number;
  totalEarnings: number;
  rating: number;
  rank: number;
}

const AdminCommandCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [churn, setChurn] = useState<ChurnData | null>(null);
  const [unitEconomics, setUnitEconomics] = useState<UnitEconomics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    setRefreshing(true);
    try {
      const [metricsRes, funnelRes, churnRes, unitRes, leaderRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/funnel'),
        fetch('/api/admin/churn'),
        fetch('/api/admin/unit-economics'),
        fetch('/api/admin/leaderboard?limit=10'),
      ]);

      const [metricsData, funnelData, churnData, unitData, leaderData] = await Promise.all([
        metricsRes.json(),
        funnelRes.json(),
        churnRes.json(),
        unitRes.json(),
        leaderRes.json(),
      ]);

      setMetrics(metricsData);
      setFunnel(funnelData);
      setChurn(churnData);
      setUnitEconomics(unitData);
      setLeaderboard(leaderData);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const conversionRate = (from: number, to: number) => {
    return from > 0 ? ((to / from) * 100).toFixed(1) : '0';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboard} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Command Center</Text>
        <Text style={styles.subtitle}>Ashwa Growth & Health Metrics</Text>
      </View>

      {/* Key Metrics Cards */}
      {metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Families</Text>
              <Text style={styles.metricValue}>{metrics.families}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Routes</Text>
              <Text style={styles.metricValue}>{metrics.routes}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Drivers</Text>
              <Text style={styles.metricValue}>{metrics.drivers}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Earnings</Text>
              <Text style={styles.metricValue}>₹{(metrics.totalEarnings / 1000).toFixed(1)}k</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Daily Growth</Text>
              <Text style={styles.metricValue}>{((metrics.growthRate - 1) * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Funnel Analysis */}
      {funnel && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversion Funnel</Text>
          <View style={styles.funnelContainer}>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelLabel}>Invite Sent</Text>
              <Text style={styles.funnelNumber}>{funnel.inviteSent}</Text>
            </View>
            <View style={styles.funnelArrow}>→</View>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelLabel}>Opened ({conversionRate(funnel.inviteSent, funnel.inviteOpened)}%)</Text>
              <Text style={styles.funnelNumber}>{funnel.inviteOpened}</Text>
            </View>
            <View style={styles.funnelArrow}>→</View>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelLabel}>Signed Up ({conversionRate(funnel.inviteOpened, funnel.signupComplete)}%)</Text>
              <Text style={styles.funnelNumber}>{funnel.signupComplete}</Text>
            </View>
            <View style={styles.funnelArrow}>→</View>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelLabel}>Child Setup ({conversionRate(funnel.signupComplete, funnel.childSetup)}%)</Text>
              <Text style={styles.funnelNumber}>{funnel.childSetup}</Text>
            </View>
            <View style={styles.funnelArrow}>→</View>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelLabel}>Linked ({conversionRate(funnel.childSetup, funnel.linked)}%)</Text>
              <Text style={styles.funnelNumber}>{funnel.linked}</Text>
            </View>
            <View style={styles.funnelArrow}>→</View>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelLabel}>First Trip ({conversionRate(funnel.linked, funnel.firstTrip)}%)</Text>
              <Text style={styles.funnelNumber}>{funnel.firstTrip}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Churn Analysis */}
      {churn && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Churn by Step</Text>
          {Object.entries(churn).map(([step, count]) => (
            <View key={step} style={styles.churnRow}>
              <Text style={styles.churnLabel}>{step.replace(/_/g, ' ')}</Text>
              <Text style={[styles.churnCount, count > 0 ? styles.churnNegative : styles.churnNeutral]}>
                {count > 0 ? `↓ ${count}` : '✓'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Unit Economics */}
      {unitEconomics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unit Economics</Text>
          <View style={styles.economicsGrid}>
            <View style={styles.economicsCard}>
              <Text style={styles.economicsLabel}>CAC</Text>
              <Text style={styles.economicsValue}>₹{unitEconomics.cac}</Text>
              <Text style={styles.economicsSubtext}>Cost to acquire</Text>
            </View>
            <View style={styles.economicsCard}>
              <Text style={styles.economicsLabel}>LTV</Text>
              <Text style={styles.economicsValue}>₹{unitEconomics.ltv}</Text>
              <Text style={styles.economicsSubtext}>Lifetime value</Text>
            </View>
            <View style={styles.economicsCard}>
              <Text style={styles.economicsLabel}>Payback</Text>
              <Text style={styles.economicsValue}>{unitEconomics.paybackPeriod}mo</Text>
              <Text style={styles.economicsSubtext}>Break-even</Text>
            </View>
            <View style={styles.economicsCard}>
              <Text style={styles.economicsLabel}>Ratio</Text>
              <Text style={styles.economicsValue}>{(unitEconomics.ltv / unitEconomics.cac).toFixed(1)}x</Text>
              <Text style={styles.economicsSubtext}>LTV/CAC</Text>
            </View>
          </View>
        </View>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Drivers</Text>
          {leaderboard.map((driver) => (
            <View key={driver.driverId} style={styles.leaderboardRow}>
              <View style={styles.leaderboardRank}>
                <Text style={styles.rankText}>#{driver.rank}</Text>
              </View>
              <View style={styles.leaderboardInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverStats}>
                  {driver.familiesServed} families • {driver.tripsCompleted} trips • ₹{(driver.totalEarnings / 1000).toFixed(0)}k
                </Text>
              </View>
              <View style={styles.leaderboardRating}>
                <Text style={styles.ratingText}>⭐ {driver.rating}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#003366',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f0f4f8',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
  },
  funnelContainer: {
    alignItems: 'center',
  },
  funnelStep: {
    backgroundColor: '#e8f2ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 4,
    alignItems: 'center',
    minWidth: 100,
  },
  funnelLabel: {
    fontSize: 11,
    color: '#003366',
  },
  funnelNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
  },
  funnelArrow: {
    fontSize: 16,
    color: '#999',
    marginVertical: 4,
  },
  churnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  churnLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  churnCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  churnNegative: {
    color: '#d32f2f',
  },
  churnNeutral: {
    color: '#388e3c',
  },
  economicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  economicsCard: {
    width: '48%',
    backgroundColor: '#fff9e6',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc72c',
  },
  economicsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  economicsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 4,
  },
  economicsSubtext: {
    fontSize: 11,
    color: '#999',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  leaderboardRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffc72c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
  },
  leaderboardInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 2,
  },
  driverStats: {
    fontSize: 11,
    color: '#999',
  },
  leaderboardRating: {
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f57c00',
  },
});

export default AdminCommandCenter;
