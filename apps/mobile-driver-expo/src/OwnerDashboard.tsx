import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors } from './theme';
import { RouteOverviewCard } from './RouteOverviewCard';
import { EarningsCard } from './EarningsCard';
import { TeamCard } from './TeamCard';
import { LoanCard } from './LoanCard';
import { ProfitabilityCard } from './ProfitabilityCard';
import { AttendanceCard } from './AttendanceCard';
import { JobPostingForm } from './JobPostingForm';
import { api } from './api';

type Screen = 'dashboard' | 'analytics' | 'team' | 'post-job';

interface Route {
  id: string;
  name: string;
  time: string;
}

interface OwnerDashboardProps {
  token: string;
  onNavigate?: (screen: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ token, onNavigate }) => {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Demo routes for job posting
  const [routes] = useState<Route[]>([
    { id: '1', name: 'School A - Morning North', time: '07:00 AM' },
    { id: '2', name: 'School B - Morning South', time: '07:30 AM' },
    { id: '3', name: 'School A - Afternoon North', time: '01:00 PM' },
    { id: '4', name: 'School C - Evening East', time: '04:00 PM' },
  ]);

  // Demo data
  const [routeOverview] = useState({
    activeRoutes: 5,
    familiesServed: 150,
    monthlyRevenue: 150000,
    status: 'healthy' as const,
  });

  const [earnings] = useState({
    totalToday: 1850,
    breakdown: [
      { routeName: 'School A', amount: 650 },
      { routeName: 'School B', amount: 580 },
      { routeName: 'Tuition C', amount: 620 },
    ],
    trend: 200,
    trendDirection: 'up' as const,
  });

  const [team] = useState({
    members: [
      { name: 'Rajesh', monthlyPay: 12000, earnedToday: 650, paymentDate: 15 },
      { name: 'Priya', monthlyPay: 10000, earnedToday: 480, paymentDate: 15 },
    ],
    totalPayroll: 22000,
    nextPayoutDays: 4,
  });

  const [loan] = useState({
    principal: 500000,
    monthlyPayment: 8333,
    amountPaid: 75000,
    totalPayment: 300000,
    monthsRemaining: 28,
    nextPaymentDate: 15,
    progressPercent: 25,
    autoDeductEnabled: true,
  });

  const [profitability] = useState({
    routes: [
      {
        name: 'School A',
        profit: 1800,
        occupancy: 62.5,
        trend: 200,
        trendDirection: 'up' as const,
        recommendation: 'scale' as const,
      },
      {
        name: 'School B',
        profit: 200,
        occupancy: 25,
        trend: -100,
        trendDirection: 'down' as const,
        recommendation: 'drop' as const,
      },
      {
        name: 'Tuition C',
        profit: 1400,
        occupancy: 90,
        trend: 500,
        trendDirection: 'up' as const,
        recommendation: 'scale' as const,
      },
    ],
  });

  const [attendance] = useState({
    daysAttended: 20,
    totalDays: 20,
    familySatisfaction: 98,
    driversVerified: true,
  });

  const handlePayEarly = async () => {
    setLoading(true);
    try {
      await api.processPaymentEarly(token);
      setStatus('Payroll processed early!');
    } catch (error: any) {
      setStatus(error.message || 'Could not process payment.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (routeId: string, pay: number) => {
    setLoading(true);
    try {
      await api.postJob(token, routeId, pay);
      setStatus('Job posted successfully!');
      setScreen('dashboard');
    } catch (error: any) {
      setStatus(error.message || 'Could not post job.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoDeduct = async (enabled: boolean) => {
    try {
      await api.toggleLoanAutoDeduct(token, enabled);
      setStatus(`Auto-deduct ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      setStatus(error.message || 'Could not update loan settings.');
    }
  };

  if (screen === 'post-job') {
    return (
      <SafeAreaView style={styles.page}>
        <JobPostingForm
          routes={routes}
          onSubmit={handlePostJob}
          onCancel={() => setScreen('dashboard')}
          loading={loading}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.stack}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titleDark}>Owner Dashboard</Text>
          <Text style={styles.bodyDark}>
            Everything at a glance. Analytics first, actions always available.
          </Text>
          {status && (
            <Text style={styles.status}>{status}</Text>
          )}
        </View>

        {loading && <ActivityIndicator color={colors.accent} />}

        {/* Card 1: Route Overview */}
        <RouteOverviewCard data={routeOverview} />

        {/* Card 2: Today's Earnings */}
        <EarningsCard data={earnings} />

        {/* Card 3: My Team */}
        <TeamCard data={team} onPayEarly={handlePayEarly} />

        {/* Card 4: Van Loan */}
        <LoanCard data={loan} onToggleAutoDeduct={handleToggleAutoDeduct} />

        {/* Card 5: Route Profitability */}
        <ProfitabilityCard data={profitability} />

        {/* Card 6: Attendance & Trust */}
        <AttendanceCard data={attendance} />

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setScreen('post-job')}
          >
            <Text style={styles.actionButtonText}>+ POST JOB</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('team')}
          >
            <Text style={styles.actionButtonText}>👥 MY TEAM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('analytics')}
          >
            <Text style={styles.actionButtonText}>📊 ANALYTICS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('more')}
          >
            <Text style={styles.actionButtonText}>⋮ MORE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  stack: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  header: {
    gap: 8,
  },
  titleDark: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  bodyDark: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  status: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    height: 80,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
