import axios from 'axios';
import { tokenStore } from './tokenStore';
import { refreshRequest } from './endpoints/authApi';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach the current access token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Queue so that if several requests 401 at the same moment,
// only ONE refresh call is made and the rest wait for it.
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error, newAccessToken) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only attempt refresh-and-retry once per request, and only on 401.
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken) {
        tokenStore.clearSession();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for the in-flight refresh to finish, then retry this request.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        });
      }

      isRefreshing = true;
      try {
        const data = await refreshRequest(refreshToken);
        tokenStore.setSession({
          accessToken: data.accessToken,
          accessTokenExpiresAt: data.accessTokenExpiresAt,
          refreshToken: data.refreshToken, // rotated
          user: data.user
        });
        resolveQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        resolveQueue(refreshError, null);
        tokenStore.clearSession();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  // Hash router: navigate by setting location directly, since we are
  // outside React component tree here.
  window.location.hash = '#/login';
}

export default apiClient;
