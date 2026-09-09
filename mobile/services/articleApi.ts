import type { MobileArticle, MobileArticlePage } from '../types/article';

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) ||
  'http://localhost:8000';

function buildUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed');
  }

  return payload as T;
}

export function getArticles(token: string, page = 1): Promise<MobileArticlePage> {
  return fetchJson<MobileArticlePage>(buildUrl(`/api/mobile/v1/articles?page=${page}`), token);
}

export function getArticle(token: string, articleId: number): Promise<{ data: MobileArticle }> {
  return fetchJson<{ data: MobileArticle }>(buildUrl(`/api/mobile/v1/articles/${articleId}`), token);
}
