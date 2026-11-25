import type {
  ChildUpsertInput,
  CurrentAssignmentState,
  CurrentTripState,
  DriverServiceSummary,
  TimelineEventSummary,
  ParentReferralStats,
  AttendanceRecord,
  Invoice,
  MonthlyAttendanceSummary,
} from '@ashwa/shared';
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
    request<{ accessToken: string; user: { id: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  requestOTP: (phone: string, role: string) =>
    request<{ otpSent: true }>('/auth/request-otp', { method: 'POST', body: { phone, role } }),
  verifyOTP: (phone: string, otp: string, role: string) =>
    request<{ accessToken: string }>('/auth/verify-otp', { method: 'POST', body: { phone, otp, role } }),
  listChildren: (token: string) => request<any[]>('/children', { token }),
  createChild: (token: string, body: ChildUpsertInput) =>
    request('/children', { method: 'POST', token, body }),
  updateChild: (token: string, id: string, body: Partial<ChildUpsertInput>) =>
    request(`/children/${id}`, { method: 'PATCH', token, body }),
  deleteChild: (token: string, id: string) => request(`/children/${id}`, { method: 'DELETE', token }),
  listInstitutions: () => request<any[]>('/institutions'),
  searchDrivers: (params: URLSearchParams) => request<DriverServiceSummary[]>(`/drivers/search?${params.toString()}`),
  driverSummary: (id: string) => request<DriverServiceSummary>(`/drivers/${id}/summary`),
  requestAssignment: (token: string, body: Record<string, unknown>) =>
    request('/assignments/request', { method: 'POST', token, body }),
  cancelAssignment: (token: string, id: string) => request(`/assignments/${id}/cancel`, { method: 'POST', token }),
  currentAssignment: (token: string) => request<CurrentAssignmentState>('/assignments/current', { token }),
  currentTrip: (token: string) => request<CurrentTripState>('/trips/current', { token }),
  tripTimeline: (token: string, tripId: string) =>
    request<{ tripId: string; timeline: TimelineEventSummary[] }>(`/trips/${tripId}/timeline`, { token }),
  saveDeviceToken: (token: string, deviceToken: string, platform: string) =>
    request('/auth/device-token', { method: 'POST', token, body: { token: deviceToken, platform } }),

  // Referral system
  getReferralCode: (token: string) =>
    request<{ referralCode: string }>('/referrals/code', { token }),
  registerWithReferral: (token: string, referralCode: string) =>
    request('/referrals/register', { method: 'POST', token, body: { referralCode } }),
  linkChildToReferral: (childId: string, referralCode: string) =>
    request('/referrals/link-child', { method: 'POST', body: { childId, referralCode } }),
  recordPayment: (token: string, childId: string, month: number, year: number, amount: number, status: 'PENDING' | 'PAID' | 'FAILED') =>
    request('/referrals/record-payment', { method: 'POST', token, body: { childId, month, year, amount, status } }),
  getReferralStats: (token: string) =>
    request<ParentReferralStats>('/referrals/stats', { token }),
  getMyReferralEarnings: (token: string) =>
    request<{ totalEarnings: number }>('/referrals/earnings', { token }),

  // Attendance & Invoices
  getMonthlyAttendance: (token: string, month: number, year: number) =>
    request<MonthlyAttendanceSummary>(`/attendance/monthly?month=${month}&year=${year}`, { token }),
  getAttendanceRecords: (token: string, childId: string, month: number, year: number) =>
    request<AttendanceRecord[]>(`/attendance/child/${childId}?month=${month}&year=${year}`, { token }),
  getInvoice: (token: string, month: number, year: number) =>
    request<Invoice>(`/invoices/monthly?month=${month}&year=${year}`, { token }),
  markAttendanceExcused: (token: string, childId: string, date: string) =>
    request('/attendance/excused', { method: 'POST', token, body: { childId, date } }),
  payInvoice: (token: string, invoiceId: string) =>
    request(`/invoices/${invoiceId}/pay`, { method: 'POST', token }),

  // Invite signup
  claimInvite: (body: {
    code: string;
    parentPhone: string;
    childName: string;
    school: string;
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
  }) =>
    request<{ success: boolean; parent: any; message: string }>('/api/invites/claim', {
      method: 'POST',
      body,
    }),
};
