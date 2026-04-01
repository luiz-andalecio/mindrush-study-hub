import axios from 'axios';

const api = axios.create({
  // Por padrão usamos caminho relativo (/api) + proxy do Vite.
  // Em produção, você pode definir VITE_API_URL (ex: https://api.seudominio.com/api).
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mindrush_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mindrush_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
