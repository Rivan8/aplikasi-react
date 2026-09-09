import type { MobileNotificationList } from '../types/notification';

const API_BASE_URL =
    (
        globalThis as {
            process?: { env?: { EXPO_PUBLIC_API_BASE_URL?: string } };
        }
    ).process?.env?.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function buildUrl(path: string): string {
    return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}

export function registerPushToken(
    token: string,
    expoPushToken: string,
): Promise<void> {
    return fetchJson<void>(
        buildUrl('/api/mobile/v1/me/push-token'),
        token,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: expoPushToken }),
        },
    );
}

async function fetchJson<T>(
    url: string,
    token: string,
    init: RequestInit = {},
): Promise<T> {
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

export function getNotifications(
    token: string,
): Promise<MobileNotificationList> {
    return fetchJson<MobileNotificationList>(
        buildUrl('/api/mobile/v1/me/notifications'),
        token,
    );
}

export function markNotificationRead(
    token: string,
    notificationId: number,
): Promise<void> {
    return fetchJson<void>(
        buildUrl(`/api/mobile/v1/me/notifications/${notificationId}/read`),
        token,
        { method: 'POST' },
    );
}

export function markAllNotificationsRead(token: string): Promise<void> {
    return fetchJson<void>(
        buildUrl('/api/mobile/v1/me/notifications/read-all'),
        token,
        { method: 'POST' },
    );
}
