import type { MobileMessage, MobileMessagePage } from '../types/message';

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) ||
  'http://localhost:8000';

function buildUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}

async function fetchJson<T>(url: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed');
  }

  return payload as T;
}

export function getMyMessages(token: string, page = 1): Promise<MobileMessagePage> {
  return fetchJson<MobileMessagePage>(buildUrl(`/api/mobile/v1/me/messages?page=${page}`), token);
}

export function getMessage(token: string, messageId: number): Promise<{ data: MobileMessage }> {
  return fetchJson<{ data: MobileMessage }>(
    buildUrl(`/api/mobile/v1/me/messages/${messageId}`),
    token,
  );
}

export function markMessageRead(token: string, messageId: number): Promise<void> {
  return fetchJson<void>(buildUrl(`/api/mobile/v1/me/messages/${messageId}/read`), token, {
    method: 'POST',
  });
}