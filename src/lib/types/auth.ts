export type SystemRole = 'USER' | 'SUPER_ADMIN' | 'SUPER_VIEWER';

export interface User {
  id:                  string;
  email:               string;
  name:                string | null;
  isActive:            boolean;
  emailVerifiedAt:     string | null;
  mustChangePassword:  boolean;
  locale:              string | null;
  systemRole:          SystemRole;
  createdAt:           string;
}

export interface TokenResponse {
  accessToken:   string;
  refreshToken?: string;
  expiresIn:     number;
}

export interface UserSession {
  id:        string;
  userAgent: string | null;
  ip:        string | null;
  createdAt: string;
  expiresAt: string;
}

export interface LoginDto {
  email:    string;
  password: string;
}

export interface RegisterDto {
  email:    string;
  password: string;
  name?:    string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword:     string;
}

export interface ResetPasswordDto {
  token:       string;
  newPassword: string;
}
