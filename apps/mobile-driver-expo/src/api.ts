import type { CurrentAssignmentState, CurrentTripState, DriverServiceSummary, EventType } from '@ashwa/shared';
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
};
