/**
 * Central Axios API Client
 * Automatically injects JWT Bearer token from localStorage.
 * Handles 401 → silent token refresh → retry.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://lifeline-diagnostics.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inject token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lifeline_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: silent 401 refresh ───────────────────────────
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthError = error.response?.status === 401 || (original.url?.includes('token/refresh') && error.response?.status >= 400);

    if (isAuthError && !original._retry) {
      original._retry = true;


      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('lifeline_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/api/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        localStorage.setItem('lifeline_access_token', data.access);
        if (data.refresh) localStorage.setItem('lifeline_refresh_token', data.refresh);

        refreshQueue.forEach((p) => p.resolve(data.access));
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshError) {
        refreshQueue.forEach((p) => p.reject(refreshError));
        refreshQueue = [];
        // Clear session — redirect to login
        localStorage.removeItem('lifeline_access_token');
        localStorage.removeItem('lifeline_refresh_token');
        localStorage.removeItem('lifeline_user_profile');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Normalise backend error into a human-readable string.
 */
export function getErrorMessage(error) {
  if (error?.response?.data) {
    const d = error.response.data;
    if (typeof d === 'string') return d;
    if (d.error) return d.error;
    if (d.detail) return d.detail;
    if (d.message) return d.message;
    const firstKey = Object.keys(d)[0];
    if (firstKey) {
      const val = d[firstKey];
      return `${firstKey}: ${Array.isArray(val) ? val[0] : val}`;
    }
  }
  return error?.message || 'Something went wrong. Please try again.';
}

export default api;
