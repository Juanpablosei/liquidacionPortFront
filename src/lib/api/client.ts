import { useAuthStore } from '@/stores/auth-store';
import type { ApiResponse, ApiError } from '@/lib/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
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
  const { accessToken } = useAuthStore.getState();
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string> ?? {}),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { headers, ...rest });

  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) throw new ApiRequestError('Sesión expirada', 401);

    headers['Authorization'] = `Bearer ${newToken}`;
    const retryResponse = await fetch(`${BASE_URL}${path}`, { headers, ...rest });
    return parseResponse<T>(retryResponse);
  }

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('text/csv')) {
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
