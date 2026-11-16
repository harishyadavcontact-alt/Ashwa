import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from './api';

interface TeamMember {
  id: string;
  driverId: string;
  routeName: string;
  monthlyPayment: number;
  lastPaid: string;
}

export function TeamPayrollScreen({ ownerId }: { ownerId: string }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [nextPayout, setNextPayout] = useState('');

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        // TODO: Later, replace with Supabase fetch
        const res = await api.get(`/api/payroll/owner/${ownerId}`);
        const enrichedTeam = res.data.assignments.map((a: any) => ({
          id: a.id,
          driverId: a.driverId,
          routeName: a.routeName || 'Route',
          monthlyPayment: a.monthlyPayment,
          lastPaid: a.lastPaid || 'Not paid yet',
        }));
        setTeam(enrichedTeam);
        setTotalPayroll(res.data.totalMonthlyPayroll || 0);
        setNextPayout(res.data.nextPayoutDate || '');
      } catch (error) {
        console.error('Failed to fetch payroll:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [ownerId]);

  const handleProcessPayment = async (assignmentId: string, amount: number) => {
    try {
      // TODO: Later, integrate with actual payment gateway
      await api.post('/api/payroll/process', {
        assignmentId,
        amount,
      });
      Alert.alert('Success', `Payment of ₹${amount} processed`);
      // Refresh payroll
      location.reload();
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      {/* Payroll Summary */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>💰 Payroll Summary</Text>
        <View style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Total Monthly Payroll:</Text>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>₹{totalPayroll.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Next Payout Date:</Text>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>{nextPayout}</Text>
          </View>
        </View>
      </View>

      {/* Team Members */}
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>👥 Your Team</Text>
      {team.length === 0 ? (
        <View style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#999', textAlign: 'center' }}>No drivers hired yet.</Text>
        </View>
      ) : (
        team.map((member) => (
          <View
            key={member.id}
            style={{
              backgroundColor: '#f9f9f9',
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#10B981',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Driver #{member.driverId.substring(0, 4)}</Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{member.routeName}</Text>
                <Text style={{ fontSize: 14, color: '#999' }}>Last Paid: {member.lastPaid}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#10B981' }}>₹{member.monthlyPayment.toLocaleString()}</Text>
                <TouchableOpacity
                  onPress={() => handleProcessPayment(member.id, member.monthlyPayment)}
                  style={{ marginTop: 8, padding: 8, backgroundColor: '#10B981', borderRadius: 6 }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
