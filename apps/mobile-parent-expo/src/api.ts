import type {
  CurrentAssignmentState,
  CurrentTripState,
  DriverServiceSummary,
  TimelineEventSummary,
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
  listChildren: (token: string) => request<any[]>('/children', { token }),
  createChild: (token: string, body: Record<string, unknown>) =>
    request('/children', { method: 'POST', token, body }),
  listInstitutions: () => request<any[]>('/institutions'),
  searchDrivers: (params: URLSearchParams) => request<DriverServiceSummary[]>(`/drivers/search?${params.toString()}`),
  driverSummary: (id: string) => request<DriverServiceSummary>(`/drivers/${id}/summary`),
  requestAssignment: (token: string, body: Record<string, unknown>) =>
    request('/assignments/request', { method: 'POST', token, body }),
  currentAssignment: (token: string) => request<CurrentAssignmentState>('/assignments/current', { token }),
  currentTrip: (token: string) => request<CurrentTripState>('/trips/current', { token }),
  tripTimeline: (token: string, tripId: string) =>
    request<{ tripId: string; timeline: TimelineEventSummary[] }>(`/trips/${tripId}/timeline`, { token }),
};
