'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import authService from '@/services/authService';
import { clearAuthStorage, getToken, getUser, setUser } from '@/utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreAuth = useCallback(async () => {
    setLoading(true);

    try {
      const storedToken = getToken();
      const storedUser = getUser();

      if (!storedToken) {
        setUserState(null);
        setTokenState(null);
        return;
      }

      setTokenState(storedToken);
      setUserState(storedUser);

      const profile = await authService.refreshProfile();
      if (profile.success && profile.data) {
        setUserState(profile.data);
      } else {
        // Token present but profile invalid — clear all auth stores to avoid redirect loops
        clearAuthStorage();
        setUserState(null);
        setTokenState(null);
      }
    } catch {
      clearAuthStorage();
      setUserState(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    if (result.success && result.data) {
      setUserState(result.data.user ?? null);
      setTokenState(result.data.token ?? null);
    }
    return result;
  }, []);

  const register = useCallback(async (payload) => {
    return authService.register(payload);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUserState(null);
    setTokenState(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    if (!nextUser) return;
    setUser(nextUser);
    setUserState(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await authService.refreshProfile();
    if (profile.success && profile.data) {
      setUserState(profile.data);
    }
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      token,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
      loading,
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, login, register, logout, updateUser, refreshUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
