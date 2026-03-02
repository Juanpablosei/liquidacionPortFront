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
  user:         User;
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}

export async function login(dto: LoginDto): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(API.auth.login, {
    method:   'POST',
    body:     JSON.stringify(dto),
    skipAuth: true,
  });
}

export async function register(dto: RegisterDto): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(API.auth.register, {
    method:   'POST',
    body:     JSON.stringify(dto),
    skipAuth: true,
  });
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(API.auth.refresh, {
    method:   'POST',
    body:     JSON.stringify({ refreshToken }),
    skipAuth: true,
  });
}

export async function logout(): Promise<void> {
  return apiFetch<void>(API.auth.logout, { method: 'POST' });
}

export async function logoutAll(): Promise<void> {
  return apiFetch<void>(API.auth.logoutAll, { method: 'POST' });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>(API.auth.me);
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

export async function sendConfirmationEmail(): Promise<void> {
  return apiFetch<void>(API.auth.sendConfirmationEmail, { method: 'POST' });
}

export async function changePassword(dto: ChangePasswordDto): Promise<void> {
  return apiFetch<void>(API.auth.changePassword, {
    method: 'POST',
    body:   JSON.stringify(dto),
  });
}
