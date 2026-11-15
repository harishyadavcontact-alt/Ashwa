import type { LeaderboardEntry, MetricType, LeaderboardPeriod } from '@ashwa/shared';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from './theme';

interface LeaderboardScreenProps {
  driverId?: string;
  token?: string;
  onNavigate?: (screen: string) => void;
}

type LeaderboardData = {
  week: Record<MetricType, LeaderboardEntry[]>;
  month: Record<MetricType, LeaderboardEntry[]>;
  allTime: Record<MetricType, LeaderboardEntry[]>;
};

const BADGE_EMOJIS: Record<string, string> = {
  TOP_PERFORMER: '🏆',
  FAMILIES_50: '⭐',
  REFERRALS_5: '👥',
  OWNER: '🚐',
};

const DEMO_LEADERBOARD: LeaderboardData = {
  week: {
    FAMILIES_SERVED: [
      {
        rank: 1,
        driverId: 'driver-3',
        driverName: 'Ahmed Hassan',
        metricValue: 120,
        badges: ['TOP_PERFORMER', 'OWNER'],
        period: 'WEEK',
        metricType: 'FAMILIES_SERVED',
      },
      {
        rank: 2,
        driverId: 'driver-1',
        driverName: 'Rajesh Kumar',
        metricValue: 85,
        badges: ['FAMILIES_50', 'OWNER'],
        period: 'WEEK',
        metricType: 'FAMILIES_SERVED',
      },
      {
        rank: 3,
        driverId: 'driver-2',
        driverName: 'Priya Sharma',
        metricValue: 72,
        badges: ['FAMILIES_50', 'OWNER'],
        period: 'WEEK',
        metricType: 'FAMILIES_SERVED',
      },
      {
        rank: 4,
        driverId: 'driver-4',
        driverName: 'Vikram Patel',
        metricValue: 58,
        badges: [],
        period: 'WEEK',
        metricType: 'FAMILIES_SERVED',
      },
      {
        rank: 5,
        driverId: 'driver-5',
        driverName: 'Sanjay Singh',
        metricValue: 45,
        badges: [],
        period: 'WEEK',
        metricType: 'FAMILIES_SERVED',
      },
    ],
    EARNINGS: [
      {
        rank: 1,
        driverId: 'driver-3',
        driverName: 'Ahmed Hassan',
        metricValue: 45000,
        badges: ['TOP_PERFORMER', 'OWNER'],
        period: 'WEEK',
        metricType: 'EARNINGS',
      },
      {
        rank: 2,
        driverId: 'driver-1',
        driverName: 'Rajesh Kumar',
        metricValue: 35000,
        badges: ['OWNER'],
        period: 'WEEK',
        metricType: 'EARNINGS',
      },
      {
        rank: 3,
        driverId: 'driver-2',
        driverName: 'Priya Sharma',
        metricValue: 28000,
        badges: ['OWNER'],
        period: 'WEEK',
        metricType: 'EARNINGS',
      },
      {
        rank: 4,
        driverId: 'driver-4',
        driverName: 'Vikram Patel',
        metricValue: 22000,
        badges: [],
        period: 'WEEK',
        metricType: 'EARNINGS',
      },
      {
        rank: 5,
        driverId: 'driver-5',
        driverName: 'Sanjay Singh',
        metricValue: 18000,
        badges: [],
        period: 'WEEK',
        metricType: 'EARNINGS',
      },
    ],
    REFERRALS_SENT: [
      {
        rank: 1,
        driverId: 'driver-3',
        driverName: 'Ahmed Hassan',
        metricValue: 25,
        badges: ['TOP_PERFORMER', 'REFERRALS_5'],
        period: 'WEEK',
        metricType: 'REFERRALS_SENT',
      },
      {
        rank: 2,
        driverId: 'driver-1',
        driverName: 'Rajesh Kumar',
        metricValue: 12,
        badges: ['REFERRALS_5'],
        period: 'WEEK',
        metricType: 'REFERRALS_SENT',
      },
      {
        rank: 3,
        driverId: 'driver-2',
        driverName: 'Priya Sharma',
        metricValue: 8,
        badges: [],
        period: 'WEEK',
        metricType: 'REFERRALS_SENT',
      },
      {
        rank: 4,
        driverId: 'driver-4',
        driverName: 'Vikram Patel',
        metricValue: 5,
        badges: [],
        period: 'WEEK',
        metricType: 'REFERRALS_SENT',
      },
      {
        rank: 5,
        driverId: 'driver-5',
        driverName: 'Sanjay Singh',
        metricValue: 3,
        badges: [],
        period: 'WEEK',
        metricType: 'REFERRALS_SENT',
      },
    ],
    RUNS: [
      {
        rank: 1,
        driverId: 'driver-3',
        driverName: 'Ahmed Hassan',
        metricValue: 245,
        badges: ['TOP_PERFORMER'],
        period: 'WEEK',
        metricType: 'RUNS',
      },
      {
        rank: 2,
        driverId: 'driver-1',
        driverName: 'Rajesh Kumar',
        metricValue: 198,
        badges: [],
        period: 'WEEK',
        metricType: 'RUNS',
      },
      {
        rank: 3,
        driverId: 'driver-2',
        driverName: 'Priya Sharma',
        metricValue: 176,
        badges: [],
        period: 'WEEK',
        metricType: 'RUNS',
      },
      {
        rank: 4,
        driverId: 'driver-4',
        driverName: 'Vikram Patel',
        metricValue: 145,
        badges: [],
        period: 'WEEK',
        metricType: 'RUNS',
      },
      {
        rank: 5,
        driverId: 'driver-5',
        driverName: 'Sanjay Singh',
        metricValue: 128,
        badges: [],
        period: 'WEEK',
        metricType: 'RUNS',
      },
    ],
  },
  month: {},
  allTime: {},
};

// Populate month and allTime with adjusted values
DEMO_LEADERBOARD.month = Object.entries(DEMO_LEADERBOARD.week).reduce(
  (acc, [metric, entries]) => {
    acc[metric as MetricType] = entries.map((entry) => ({
      ...entry,
      period: 'MONTH' as LeaderboardPeriod,
      metricValue: Math.round(entry.metricValue * 3.5), // approx 3.5 weeks
    }));
    return acc;
  },
  {} as Record<MetricType, LeaderboardEntry[]>,
);

DEMO_LEADERBOARD.allTime = Object.entries(DEMO_LEADERBOARD.week).reduce(
  (acc, [metric, entries]) => {
    acc[metric as MetricType] = entries.map((entry) => ({
      ...entry,
      period: 'ALL_TIME' as LeaderboardPeriod,
      metricValue: Math.round(entry.metricValue * 13), // approx 13 weeks
    }));
    return acc;
  },
  {} as Record<MetricType, LeaderboardEntry[]>,
);

export function LeaderboardScreen({
  driverId,
  token,
  onNavigate,
}: LeaderboardScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('WEEK');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(
    'FAMILIES_SERVED',
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const metricLabels: Record<MetricType, string> = {
    FAMILIES_SERVED: 'Families Served',
    EARNINGS: 'Monthly Earnings',
    REFERRALS_SENT: 'Referrals Sent',
    RUNS: 'Completed Runs',
  };

  const metricUnits: Record<MetricType, string> = {
    FAMILIES_SERVED: '',
    EARNINGS: '₹',
    REFERRALS_SENT: '',
    RUNS: '',
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod, selectedMetric]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // In demo mode, use mock data
      const periodData =
        DEMO_LEADERBOARD[selectedPeriod.toLowerCase() as keyof LeaderboardData];
      const entries = periodData[selectedMetric] || [];

      setLeaderboard(entries);

      // Find my rank
      if (driverId) {
        const myEntry = entries.find((e) => e.driverId === driverId);
        setMyRank(myEntry || null);
      }

      setStatus(`Showing top ${entries.length} drivers`);
    } catch (error: any) {
      setStatus(error.message || 'Could not load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isMyRank = driverId && item.driverId === driverId;
    const medal =
      item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '';

    return (
      <View
        style={[
          styles.entryContainer,
          isMyRank && styles.myRankContainer,
        ]}
      >
        <View style={styles.rankSection}>
          <Text style={styles.medal}>{medal}</Text>
          <Text style={styles.rank}>#{item.rank}</Text>
        </View>

        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarText}>{item.driverName.charAt(0)}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.driverName}</Text>
            {item.badges.length > 0 && (
              <View style={styles.badgesContainer}>
                {item.badges.map((badge) => (
                  <Text key={badge} style={styles.badge}>
                    {BADGE_EMOJIS[badge]}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.metricSection}>
          <Text style={styles.metricValue}>
            {metricUnits[selectedMetric]}
            {item.metricValue.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.titleDark}>Leaderboard</Text>
        <Text style={styles.bodyDark}>
          See where you stand. Rank higher, earn more, grow faster.
        </Text>
      </View>

      {myRank && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>Your Rank</Text>
          <View style={styles.myRankContent}>
            <Text style={styles.myRankNumber}>#{myRank.rank}</Text>
            <View style={styles.myRankMetric}>
              <Text style={styles.myRankMetricLabel}>
                {metricLabels[selectedMetric]}
              </Text>
              <Text style={styles.myRankMetricValue}>
                {metricUnits[selectedMetric]}
                {myRank.metricValue.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Period:</Text>
          <View style={styles.buttonGroup}>
            {(['WEEK', 'MONTH', 'ALL_TIME'] as LeaderboardPeriod[]).map(
              (period) => (
                <Button
                  key={period}
                  title={period === 'ALL_TIME' ? 'All Time' : period}
                  onPress={() => setSelectedPeriod(period)}
                  color={
                    selectedPeriod === period ? colors.accent : colors.muted
                  }
                />
              ),
            )}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Metric:</Text>
          <View style={styles.metricSelect}>
            {(
              ['FAMILIES_SERVED', 'EARNINGS', 'REFERRALS_SENT', 'RUNS'] as MetricType[]
            ).map((metric) => (
              <Button
                key={metric}
                title={metric.replace(/_/g, ' ')}
                onPress={() => setSelectedMetric(metric)}
                color={
                  selectedMetric === metric ? colors.accent : colors.muted
                }
              />
            ))}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => `${item.driverId}-${item.metricType}`}
          renderItem={renderLeaderboardEntry}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          ListFooterComponent={
            <>
              {status && <Text style={styles.status}>{status}</Text>}
              <View style={styles.footer}>
                <Button title="Refresh" onPress={loadLeaderboard} />
                {onNavigate && (
                  <Button
                    title="View Success Stories"
                    onPress={() => onNavigate('success-stories')}
                    color={colors.accent}
                  />
                )}
              </View>
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  header: {
    padding: 16,
    backgroundColor: '#dcebf0',
    gap: 8,
  },
  titleDark: { color: colors.ink, fontSize: 24, fontWeight: '700' },
  bodyDark: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  myRankCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#fff8e6',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  myRankLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  myRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  myRankNumber: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: '700',
  },
  myRankMetric: {
    flex: 1,
  },
  myRankMetricLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  myRankMetricValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 12,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  metricSelect: {
    flexDirection: 'column',
    gap: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 8,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  myRankContainer: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: '#f9f9f9',
  },
  rankSection: {
    alignItems: 'center',
    width: 40,
  },
  medal: {
    fontSize: 24,
  },
  rank: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  driverSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.panel,
    fontSize: 18,
    fontWeight: '700',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  badge: {
    fontSize: 14,
  },
  metricSection: {
    alignItems: 'flex-end',
  },
  metricValue: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  status: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
  },
  footer: {
    gap: 8,
    paddingTop: 8,
  },
});
