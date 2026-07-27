/**
 * Access token lives ONLY in memory (React/module state) to reduce XSS exposure.
 * Refresh token is persisted in localStorage so the session can survive a page
 * reload; on app boot we silently call /api/auth/refresh using it.
 */

const REFRESH_TOKEN_KEY = 'pms_refresh_token';

let accessToken = null;
let accessTokenExpiresAt = null; // ISO string
let currentUser = null;

const listeners = new Set();

function notify() {
  listeners.forEach((cb) => cb({ accessToken, currentUser }));
}

export const tokenStore = {
  getAccessToken: () => accessToken,
  getAccessTokenExpiresAt: () => accessTokenExpiresAt,
  getCurrentUser: () => currentUser,

  setSession({ accessToken: at, accessTokenExpiresAt: exp, refreshToken, user }) {
    accessToken = at;
    accessTokenExpiresAt = exp;
    currentUser = user;
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    notify();
  },

  clearSession() {
    accessToken = null;
    accessTokenExpiresAt = null;
    currentUser = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    notify();
  },

  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }
};
