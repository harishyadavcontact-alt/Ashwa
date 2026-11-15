import type { CurrentAssignmentState, CurrentTripState, DriverServiceSummary, EventType, Job, JobApplication, TeamMember, PayrollRecord, SuccessStory, LeaderboardEntry, LeaderboardQueryParams, SubstituteAssignment, DriverAvailability, SubstituteReason, AttendanceRecord } from '@ashwa/shared';
import { API_BASE_URL } from './config';

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>('/auth/login', { method: 'POST', body: { email, password } }),
  currentAssignments: (token: string) => request<CurrentAssignmentState>('/assignments/current', { token }),
  incomingAssignments: (token: string) => request<CurrentAssignmentState>('/assignments/incoming', { token }),
  meSummary: (token: string) => request<DriverServiceSummary>('/drivers/me/summary', { token }),
  onboard: (token: string, body: Record<string, unknown>) =>
    request('/drivers/onboard', { method: 'POST', token, body }),
  acceptAssignment: (token: string, id: string) => request(`/assignments/${id}/accept`, { method: 'POST', token }),
  rejectAssignment: (token: string, id: string) => request(`/assignments/${id}/reject`, { method: 'POST', token }),
  saveProfile: (token: string, body: Record<string, unknown>) => request('/drivers/profile', { method: 'PATCH', token, body }),
  saveServiceInfo: (token: string, body: Record<string, unknown>) => request('/drivers/service-info', { method: 'POST', token, body }),
  currentTrip: (token: string) => request<CurrentTripState>('/trips/current', { token }),
  startTrip: (token: string, tripType: 'MORNING' | 'AFTERNOON') =>
    request<CurrentTripState>('/trips/start', { method: 'POST', token, body: { tripType } }),
  endTrip: (token: string, id: string) => request(`/trips/${id}/end`, { method: 'POST', token }),
  ping: (token: string, tripId: string, lat: number, lng: number) =>
    request('/tracking/ping', { method: 'POST', token, body: { tripId, lat, lng } }),
  emitEvent: (token: string, tripId: string, childId: string, eventType: EventType) =>
    request(`/trips/${tripId}/event`, { method: 'POST', token, body: { childId, eventType } }),

  // Hiring system endpoints
  postJob: (token: string, routeId: string, payPerMonth: number) =>
    request<Job>('/jobs/post', { method: 'POST', token, body: { routeId, payPerMonth } }),
  listAvailableJobs: (token: string) =>
    request<Job[]>('/jobs/available', { token }),
  applyForJob: (token: string, jobId: string) =>
    request<JobApplication>('/jobs/apply', { method: 'POST', token, body: { jobId } }),
  getMyTeam: (token: string) =>
    request<TeamMember[]>('/hiring/team', { token }),
  getPayrollHistory: (token: string) =>
    request<PayrollRecord[]>('/hiring/payroll', { token }),
  hireDriver: (token: string, jobId: string, driverId: string) =>
    request<Job>(`/jobs/${jobId}/hire`, { method: 'POST', token, body: { driverId } }),
  getJobApplications: (token: string, jobId: string) =>
    request<JobApplication[]>(`/jobs/${jobId}/applications`, { token }),

  // Success Stories
  getSuccessStories: (token: string, limit?: number) =>
    request<SuccessStory[]>(`/success-stories?limit=${limit || 10}`, { token }),
  getSuccessStory: (token: string, storyId: string) =>
    request<SuccessStory>(`/success-stories/${storyId}`, { token }),

  // Leaderboard
  getLeaderboard: (token: string, params: LeaderboardQueryParams) =>
    request<LeaderboardEntry[]>(
      `/leaderboard?metric=${params.metric}&period=${params.period}&limit=${params.limit || 10}`,
      { token },
    ),
  getMyRank: (token: string, metric: string, period: string) =>
    request<LeaderboardEntry>(`/leaderboard/my-rank?metric=${metric}&period=${period}`, { token }),

  // Substitute Driver Assignment
  markUnavailable: (token: string, tripId: string, reason: SubstituteReason) =>
    request<SubstituteAssignment>('/substitutes/mark-unavailable', {
      method: 'POST',
      token,
      body: { tripId, reason }
    }),
  findBackupDriver: (token: string, tripId: string) =>
    request<DriverAvailability | null>('/substitutes/find-backup', {
      method: 'POST',
      token,
      body: { tripId }
    }),
  confirmBackupDriver: (token: string, assignmentId: string, backupDriverId: string) =>
    request<SubstituteAssignment>(`/substitutes/${assignmentId}/confirm`, {
      method: 'POST',
      token,
      body: { backupDriverId }
    }),
  getSubstituteAssignments: (token: string) =>
    request<SubstituteAssignment[]>('/substitutes/my-assignments', { token }),

  // Trip History & Attendance
  getTripHistory: (token: string, limit?: number) =>
    request<Array<{ tripId: string; tripType: string; date: string; children: Array<{ childId: string; childName: string; boarded?: string; dropped?: string }> }>>(`/trips/history?limit=${limit || 30}`, { token }),
  getAttendanceHistory: (token: string, month: number, year: number) =>
    request<AttendanceRecord[]>(`/attendance/history?month=${month}&year=${year}`, { token }),
};
