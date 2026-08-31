import type {
  ApiEnvelope,
  EventDetail,
  EventSchedule,
  ScheduleActionData,
} from '../types/schedule';

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) ||
  'http://localhost:8000';

function buildUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message ?? 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export async function getMySchedules(token: string): Promise<ApiEnvelope<EventSchedule[]>> {
  return fetchJson<ApiEnvelope<EventSchedule[]>>(buildUrl('/api/mobile/v1/me/schedules'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
}

export async function getEventDetail(
  token: string,
  eventId: number,
): Promise<ApiEnvelope<EventDetail>> {
  return fetchJson<ApiEnvelope<EventDetail>>(buildUrl(`/api/mobile/v1/events/${eventId}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
}

export async function acceptSchedule(
  token: string,
  assignmentId: number,
): Promise<ApiEnvelope<ScheduleActionData>> {
  return fetchJson<ApiEnvelope<ScheduleActionData>>(
    buildUrl(`/api/mobile/v1/me/schedules/${assignmentId}/accept`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );
}

export async function declineSchedule(
  token: string,
  assignmentId: number,
  reason: string,
): Promise<ApiEnvelope<ScheduleActionData>> {
  return fetchJson<ApiEnvelope<ScheduleActionData>>(
    buildUrl(`/api/mobile/v1/me/schedules/${assignmentId}/decline`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    },
  );
}
