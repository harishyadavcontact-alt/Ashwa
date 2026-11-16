import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from './api';

interface HiredJob {
  id: string;
  jobId: string;
  routeName: string;
  monthlyPayment: number;
  startDate: string;
  thisMonthEarned: number;
}

export function JobsScreen({ driverId }: { driverId: string }) {
  const [jobs, setJobs] = useState<HiredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({ monthlyJobPayment: 0, thisMonthEarned: 0 });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // TODO: Later, replace with Supabase fetch
        const res = await api.get(`/api/jobs/driver/${driverId}`);
        setJobs(res.data.jobs || []);

        const earningsRes = await api.get(`/api/payroll/driver/${driverId}`);
        setEarnings(earningsRes.data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [driverId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      {/* Monthly Earnings Summary */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>💰 Monthly Earnings</Text>
        <View style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Fixed Monthly Pay:</Text>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>₹{earnings.monthlyJobPayment.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#666' }}>This Month Earned:</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>₹{earnings.thisMonthEarned.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Hired Jobs List */}
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>📍 Your Jobs</Text>
      {jobs.length === 0 ? (
        <View style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#999', textAlign: 'center' }}>No active jobs yet. Wait for owner to hire you.</Text>
        </View>
      ) : (
        jobs.map((job) => (
          <View
            key={job.id}
            style={{
              backgroundColor: '#f9f9f9',
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#ffc72c',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>{job.routeName}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#666' }}>Monthly:</Text>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>₹{job.monthlyPayment.toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: '#666' }}>Start Date:</Text>
              <Text style={{ fontSize: 14 }}>{new Date(job.startDate).toLocaleDateString()}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
