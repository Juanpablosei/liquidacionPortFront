import { useAuthStore } from '@/stores/auth-store';
import { getTranslations } from '@/lib/i18n';
import type { ApiResponse, ApiError } from '@/lib/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body:        JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');

    const json = await res.json();
    const data = json.data?.data && typeof json.data.data === 'object' ? json.data.data : json.data;
    const { accessToken: newAccess, refreshToken: newRefresh } = data;
    setTokens(newAccess, newRefresh);
    return newAccess;
  } catch {
    logout();
    return null;
  }
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T>(
  path:    string,
  options: FetchOptions = {},
): Promise<T> {
  const { accessToken, user } = useAuthStore.getState();
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const isFormData = rest.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Accept-Language': user?.locale ?? 'es',
    ...(customHeaders as Record<string, string> ?? {}),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const method = (rest.method ?? 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { credentials: 'include', headers, ...rest });
  } catch {
    // Network error — backend is unreachable
    if (!skipAuth) {
      const { logout } = useAuthStore.getState();
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    const t = getTranslations(useAuthStore.getState().user?.locale);
    throw new ApiRequestError(t.auth.connectionError, 0);
  }

  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      const t2 = getTranslations(useAuthStore.getState().user?.locale);
      throw new ApiRequestError(t2.auth.sessionExpired, 401);
    }

    headers['Authorization'] = `Bearer ${newToken}`;
    const retryResponse = await fetch(`${BASE_URL}${path}`, { credentials: 'include', headers, ...rest });
    return parseResponse<T>(retryResponse);
  }

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('text/csv') || contentType.includes('spreadsheetml') || contentType.includes('octet-stream') || contentType.includes('application/pdf')) {
    return response.blob() as unknown as T;
  }

  const json = await response.json();

  if (!response.ok) {
    const err = json as ApiError;
    throw new ApiRequestError(
      Array.isArray(err.message) ? err.message.join(', ') : err.message,
      response.status,
    );
  }

  const envelope = json as ApiResponse<T>;
  return envelope.data;
}

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
