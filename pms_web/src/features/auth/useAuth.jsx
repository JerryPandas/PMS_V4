import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStore } from '../../api/tokenStore';
import { loginRequest, registerRequest, refreshRequest, logoutRequest } from '../../api/endpoints/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(tokenStore.getCurrentUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    return tokenStore.subscribe(({ currentUser }) => setUser(currentUser));
  }, []);

  // On app load, try to silently restore the session from the stored refresh token.
  useEffect(() => {
    const existingRefreshToken = tokenStore.getRefreshToken();
    if (!existingRefreshToken) {
      setIsBootstrapping(false);
      return;
    }
    refreshRequest(existingRefreshToken)
      .then((data) => {
        tokenStore.setSession({
          accessToken: data.accessToken,
          accessTokenExpiresAt: data.accessTokenExpiresAt,
          refreshToken: data.refreshToken,
          user: data.user
        });
      })
      .catch(() => tokenStore.clearSession())
      .finally(() => setIsBootstrapping(false));
  }, []);

  const login = useCallback(async (userName, password) => {
    const data = await loginRequest(userName, password);
    tokenStore.setSession({
      accessToken: data.accessToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt,
      refreshToken: data.refreshToken,
      user: data.user
    });
    return data.user;
  }, []);

  const register = useCallback(async (userName, displayName, password, email) => {
    const data = await registerRequest(userName, displayName, password, email);
    tokenStore.setSession({
      accessToken: data.accessToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt,
      refreshToken: data.refreshToken,
      user: data.user
    });
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } finally {
      tokenStore.clearSession();
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isBootstrapping,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
