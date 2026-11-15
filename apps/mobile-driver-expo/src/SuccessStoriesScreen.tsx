import type { SuccessStory } from '@ashwa/shared';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SuccessStoryCard } from './SuccessStoryCard';
import { colors } from './theme';

interface SuccessStoriesScreenProps {
  token?: string;
  onNavigate?: (screen: string) => void;
}

const DEMO_STORIES: SuccessStory[] = [
  {
    id: '1',
    driverId: 'driver-1',
    driverName: 'Rajesh Kumar',
    driverPhotoUrl: undefined,
    title: 'From Solo Driver to Owner in 8 Months',
    content: 'Started as a school transport driver with one route. Through consistent service and customer referrals, I scaled to managing 5 routes. With families willing to support my growth, I secured a small business loan to buy my own vehicle. Today, I own my fleet and have hired 3 drivers to work under me.',
    metrics: {
      familiesServed: 45,
      referralsCount: 12,
      hiredDrivers: 3,
      monthsToOwner: 8,
      monthlyIncome: 35000,
    },
    quote: 'The trust of families transformed my career. What started as daily wages became a sustainable business.',
    milestones: [
      {
        month: 0,
        title: 'Started as Driver',
        description: 'Took first job as a school transport driver, earning ₹15,000/month',
      },
      {
        month: 2,
        title: '50+ Families Trust',
        description: 'Reached milestone of 50 families through consistent service',
      },
      {
        month: 4,
        title: 'First Referral Bonus',
        description: 'Got ₹5,000 bonus for referring 5 new families',
      },
      {
        month: 6,
        title: 'Loan Approved',
        description: 'Applied for and got approved for ₹2L loan to buy own vehicle',
      },
      {
        month: 8,
        title: 'Fleet Owner',
        description: 'Bought vehicle and hired first driver, now earning ₹35,000/month',
      },
    ],
    published: true,
    publishedAt: new Date('2024-10-01'),
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date('2024-10-01'),
  },
  {
    id: '2',
    driverId: 'driver-2',
    driverName: 'Priya Sharma',
    driverPhotoUrl: undefined,
    title: 'Breaking Barriers: Women Owner in Transport',
    content: 'In a male-dominated field, I started as an assistant driver. My dedication and reliability quickly earned me trust from families. Within 6 months, I became an owner, proving that women can lead in transport. I now manage 2 routes and have mentored 2 other women drivers.',
    metrics: {
      familiesServed: 38,
      referralsCount: 8,
      hiredDrivers: 2,
      monthsToOwner: 6,
      monthlyIncome: 28000,
    },
    quote: 'Being a woman owner means showing every girl watching that we belong here too.',
    milestones: [
      {
        month: 0,
        title: 'Started as Assistant',
        description: 'Joined as helper with ₹10,000/month salary',
      },
      {
        month: 2,
        title: 'Promoted to Driver',
        description: 'Promoted to main driver role earning ₹20,000/month',
      },
      {
        month: 4,
        title: 'High Trust Score',
        description: 'Achieved 95+ trust score through 100+ positive reviews',
      },
      {
        month: 6,
        title: 'Owner Status',
        description: 'Got loan and vehicle, became owner with ₹28,000/month income',
      },
    ],
    published: true,
    publishedAt: new Date('2024-09-20'),
    createdAt: new Date('2024-09-10'),
    updatedAt: new Date('2024-09-20'),
  },
  {
    id: '3',
    driverId: 'driver-3',
    driverName: 'Ahmed Hassan',
    driverPhotoUrl: undefined,
    title: 'Scaling from One to Five Routes',
    content: 'Started with just one morning route. Year by year, I expanded by serving families reliably and building reputation. Now managing 5 routes with my hired team, I have built sustainable income that supports my family and creates employment.',
    metrics: {
      familiesServed: 120,
      referralsCount: 25,
      hiredDrivers: 4,
      monthsToOwner: 12,
      monthlyIncome: 45000,
    },
    quote: 'Consistency is the key. Do one thing well, then expand.',
    milestones: [
      {
        month: 0,
        title: 'Single Route',
        description: 'Managing 1 route with 15 families',
      },
      {
        month: 3,
        title: 'Second Route',
        description: 'Added afternoon route, now 30 families',
      },
      {
        month: 6,
        title: 'Third Route + Hire',
        description: 'Managing 3 routes, hired first driver',
      },
      {
        month: 9,
        title: 'Fourth Route',
        description: 'Expanded to 4 routes, team of 2 drivers',
      },
      {
        month: 12,
        title: 'Fleet Owner',
        description: '5 routes, ₹45K/month, 4 drivers, 120 families',
      },
    ],
    published: true,
    publishedAt: new Date('2024-10-15'),
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-10-15'),
  },
];

export function SuccessStoriesScreen({
  token,
  onNavigate,
}: SuccessStoriesScreenProps) {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    try {
      // In demo mode, use mock data
      setStories(DEMO_STORIES.filter((s) => s.published));
      setStatus('Loaded 3 inspiring success stories');
    } catch (error: any) {
      setStatus(error.message || 'Could not load success stories');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (story: SuccessStory) => {
    const message = `Check out ${story.driverName}'s success story! 🚐

"${story.title}"

From Driver to Owner in ${story.metrics.monthsToOwner} months
📊 Families served: ${story.metrics.familiesServed}
💰 Monthly income: ₹${story.metrics.monthlyIncome}
👥 Drivers hired: ${story.metrics.hiredDrivers}

"${story.quote || ''}"

${story.driverName} proves it's possible. You can too! 💪`;

    Alert.alert('Share on WhatsApp', 'Story copied to clipboard for sharing', [
      {
        text: 'Copy Again',
        onPress: () => {
          // In a real app, this would copy to clipboard
          // For demo, just show confirmation
          Alert.alert('Story ready to share', message);
        },
      },
      {
        text: 'Close',
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Loading success stories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.titleDark}>Success Stories</Text>
        <Text style={styles.bodyDark}>
          See how other drivers became owners. Your journey starts here.
        </Text>
      </View>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SuccessStoryCard story={item} onShare={handleShare} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>No stories yet</Text>
            <Text style={styles.metric}>
              More inspiring success stories coming soon
            </Text>
          </View>
        }
        ListFooterComponent={
          <>
            {status && <Text style={styles.status}>{status}</Text>}
            <View style={styles.footer}>
              <Button title="Refresh" onPress={loadStories} />
              {onNavigate && (
                <Button
                  title="View Leaderboard"
                  onPress={() => onNavigate('leaderboard')}
                  color={colors.accent}
                />
              )}
            </View>
          </>
        }
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 0,
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
  emptyCard: {
    backgroundColor: colors.panel,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
    alignItems: 'center',
  },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  metric: { color: colors.muted, fontSize: 14 },
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
