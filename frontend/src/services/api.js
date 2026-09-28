import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env.');
}

const api = axios.create({
  baseURL: API_URL,
  // Sends and receives the httpOnly refresh token cookie on cross-origin requests.
  withCredentials: true,
});

// The access token lives only in memory (never in localStorage), so a page
// reload loses it and the app restores the session via the refresh cookie.
let accessToken = null;
let refreshRequest = null;
let handleSessionExpired = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler) {
  handleSessionExpired = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// If several requests fail with 401 at the same time, they all wait for one
// shared refresh request. Sending the same refresh token twice would fail,
// because the server rotates (invalidates) it on first use.
export function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = api
      .post('/auth/refresh-token')
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return response.data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

// A 401 from these endpoints means wrong credentials or no session,
// not an expired access token, so refreshing would not help.
const ROUTES_WITHOUT_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh-token'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const shouldTryRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.hasRetried &&
      !ROUTES_WITHOUT_REFRESH.includes(originalRequest.url);

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    originalRequest.hasRetried = true;

    try {
      await refreshSession();
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      handleSessionExpired();
      return Promise.reject(refreshError);
    }
  }
);

export function getErrorMessage(error) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.request) {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

// Turns [{ field: 'price', message: '...' }] into { price: '...' } for forms.
export function getFieldErrors(error) {
  const fieldErrors = {};
  for (const fieldError of error.response?.data?.errors || []) {
    fieldErrors[fieldError.field] = fieldError.message;
  }
  return fieldErrors;
}

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const productApi = {
  getAll: (params, options) => api.get('/products', { params, ...options }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
};
