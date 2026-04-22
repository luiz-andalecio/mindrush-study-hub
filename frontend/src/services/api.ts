import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from '@/auth/tokenStore';
import { getCookie } from '@/auth/cookies';

function normalizeApiBaseUrl(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '/api';

  // Remove trailing slashes para evitar //auth/refresh.
  const noTrail = raw.replace(/\/+$/, '');

  // Se o usuário apontar para o host (ex.: http://localhost:8080), garantimos o sufixo /api.
  // Se já apontar para /api (ex.: https://api.seudominio.com/api), mantemos.
  return noTrail.endsWith('/api') ? noTrail : `${noTrail}/api`;
}

const api = axios.create({
  // Por padrão usamos caminho relativo (/api) + proxy do Vite.
  // Em produção, você pode definir VITE_API_URL (ex: https://api.seudominio.com/api).
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Evita múltiplos refresh simultâneos
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = api
    .post<{ token: string }>(
      '/auth/refresh',
      {},
      { headers: { 'x-csrf-token': getCookie('mindrush_csrf') ?? '' } },
    )
    .then((r) => r.data.token)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Envia CSRF token (double submit) quando existir.
  // Necessário para /auth/refresh e /auth/logout (usa cookie httpOnly).
  const csrf = getCookie('mindrush_csrf');
  if (csrf) {
    config.headers['x-csrf-token'] = csrf;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error?.response?.status;
    type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };
    const originalRequest = error?.config as RetriableRequestConfig | undefined;

    const url = String(originalRequest?.url ?? '');
    const skipRefresh = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    if (status === 401 && originalRequest && !originalRequest._retry && !skipRefresh) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshAccessToken();
          setAccessToken(newToken);
          isRefreshing = false;
        } else {
          const newToken = await refreshAccessToken();
          setAccessToken(newToken);
        }

        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${getAccessToken()}`;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        clearAccessToken();
        window.dispatchEvent(new Event('mindrush:logout'));
      }
    }

    if (status === 401 && skipRefresh) {
      // Não força logout em credenciais inválidas.
      clearAccessToken();
    }

    return Promise.reject(error);
  },
);

export default api;
