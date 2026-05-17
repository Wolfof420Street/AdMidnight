import { apiFetch } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  sub: string;
  role: 'advertiser';
  email: string;
  name: string;
  expiresAt: string;
}

export const authApi = {
  login: (credentials: LoginRequest) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      timeoutMs: 15_000,
      body: credentials,
    }),
} as const;