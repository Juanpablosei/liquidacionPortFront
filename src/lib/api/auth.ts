import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type {
  User,
  TokenResponse,
  UserSession,
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ResetPasswordDto,
} from '@/lib/types/auth';

export interface LoginResponse {
  user:                User;
  accessToken:         string;
  refreshToken:        string;
  expiresIn:           number;
  mustChangePassword?: boolean;
}

/** Backend devuelve doble anidación: apiFetch retorna data; los tokens están en data.data. */
function unwrapLoginResponse(raw: unknown): LoginResponse {
  const obj = raw as Record<string, unknown>;
  const inner =
    obj?.data && typeof obj.data === 'object' && 'accessToken' in (obj.data as object)
      ? (obj.data as Record<string, unknown>)
      : obj?.data && typeof obj.data === 'object' && 'data' in obj.data
        ? (obj.data as Record<string, unknown>).data
        : obj;
  const payload = (inner ?? obj) as Record<string, unknown>;
  return {
    user:                payload.user as User,
    accessToken:         String(payload.accessToken ?? ''),
    refreshToken:        String(payload.refreshToken ?? ''),
    expiresIn:           Number(payload.expiresIn ?? 0),
    mustChangePassword:  Boolean(payload.mustChangePassword ?? false),
  };
}

export async function login(dto: LoginDto): Promise<LoginResponse> {
  const raw = await apiFetch<LoginResponse | { data: { data?: Record<string, unknown> } }>(API.auth.login, {
    method:   'POST',
    body:     JSON.stringify(dto),
    skipAuth: true,
  });
  const res = unwrapLoginResponse(raw);
  if (!res.user && res.accessToken) {
    const { useAuthStore } = await import('@/stores/auth-store');
    useAuthStore.getState().setTokens(res.accessToken, res.refreshToken);
    res.user = await getMe();
  }
  return res;
}

export async function register(dto: RegisterDto): Promise<LoginResponse> {
  const raw = await apiFetch<LoginResponse | { data: LoginResponse | { data?: Record<string, unknown> } }>(API.auth.register, {
    method:   'POST',
    body:     JSON.stringify(dto),
    skipAuth: true,
  });
  const res = unwrapLoginResponse(raw);
  if (!res.user && res.accessToken) {
    const { useAuthStore } = await import('@/stores/auth-store');
    useAuthStore.getState().setTokens(res.accessToken, res.refreshToken);
    res.user = await getMe();
  }
  return res;
}

function unwrapTokenResponse(raw: unknown): TokenResponse {
  const obj = raw as Record<string, unknown>;
  const inner =
    obj?.data && typeof obj.data === 'object' && 'accessToken' in (obj.data as object)
      ? (obj.data as Record<string, unknown>)
      : obj?.data && typeof obj.data === 'object' && 'data' in obj.data
        ? (obj.data as Record<string, unknown>).data
        : obj;
  const p = (inner ?? obj) as Record<string, unknown>;
  return {
    accessToken:  String(p.accessToken ?? ''),
    refreshToken: String(p.refreshToken ?? ''),
    expiresIn:   Number(p.expiresIn ?? 0),
  };
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const raw = await apiFetch<TokenResponse | { data: TokenResponse | { data: TokenResponse } }>(API.auth.refresh, {
    method:   'POST',
    body:     JSON.stringify({ refreshToken }),
    skipAuth: true,
  });
  return unwrapTokenResponse(raw);
}

export async function logout(): Promise<void> {
  return apiFetch<void>(API.auth.logout, { method: 'POST' });
}

export async function logoutAll(): Promise<void> {
  return apiFetch<void>(API.auth.logoutAll, { method: 'POST' });
}

export async function getMe(): Promise<User> {
  const raw = await apiFetch<unknown>(API.auth.me);
  const obj = raw as Record<string, unknown>;
  // El backend puede devolver doble anidación: { success, data: { id, email... } }
  if (obj?.data && typeof obj.data === 'object' && 'id' in (obj.data as object)) {
    return obj.data as User;
  }
  return raw as User;
}

export async function getSessions(): Promise<UserSession[]> {
  return apiFetch<UserSession[]>(API.auth.sessions);
}

export async function revokeSession(sessionId: string): Promise<void> {
  return apiFetch<void>(API.auth.session(sessionId), { method: 'DELETE' });
}

export async function forgotPassword(email: string): Promise<void> {
  return apiFetch<void>(API.auth.forgotPassword, {
    method:   'POST',
    body:     JSON.stringify({ email }),
    skipAuth: true,
  });
}

export async function resetPassword(dto: ResetPasswordDto): Promise<void> {
  return apiFetch<void>(API.auth.resetPassword, {
    method:   'POST',
    body:     JSON.stringify(dto),
    skipAuth: true,
  });
}

export async function confirmEmail(token: string): Promise<void> {
  return apiFetch<void>(API.auth.confirmEmail, {
    method:   'POST',
    body:     JSON.stringify({ token }),
    skipAuth: true,
  });
}

export async function sendConfirmationEmail(email: string): Promise<void> {
  return apiFetch<void>(API.auth.sendConfirmationEmail, {
    method:   'POST',
    body:     JSON.stringify({ email }),
    skipAuth: true,
  });
}

export async function changePassword(dto: ChangePasswordDto): Promise<void> {
  return apiFetch<void>(API.auth.changePassword, {
    method: 'POST',
    body:   JSON.stringify(dto),
  });
}

export async function updateLocale(locale: string): Promise<void> {
  await apiFetch<unknown>(API.auth.locale, {
    method: 'PATCH',
    body:   JSON.stringify({ locale }),
  });
}
