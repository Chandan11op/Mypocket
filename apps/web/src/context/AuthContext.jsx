import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check authenticated user on mount
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authApi.getMe();
      if (res.data.success && res.data.data.user) {
        setUser(res.data.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for custom logout events dispatched by Axios interceptor
    const handleForceLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, [checkAuth]);

  // Login action
  const login = async (mobileNumber, password) => {
    const res = await authApi.login({
      mobile_number: mobileNumber,
      password,
    });

    if (res.data.success && res.data.data) {
      const { user: userData, accessToken, refreshToken } = res.data.data;
      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      setUser(userData);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  // Register action
  const register = async (payload) => {
    const res = await authApi.register(payload);
    return res.data;
  };

  // Logout action
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await authApi.logout(refreshToken);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  // Logout from all devices
  const logoutAll = async () => {
    try {
      await authApi.logoutAll();
    } catch (err) {
      console.error('Logout all error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        logoutAll,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
