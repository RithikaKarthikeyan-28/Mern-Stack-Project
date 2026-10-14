import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('skilltrack_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || localStorage.getItem('skilltrack_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync session state to storage
  const persistSession = (newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('skilltrack_token', newToken);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('skilltrack_token');
    }

    if (newUser) {
      localStorage.setItem('skilltrack_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('skilltrack_user');
    }

    setToken(newToken);
    setUser(newUser);
  };

  const logout = useCallback(() => {
    persistSession(null, null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token') || localStorage.getItem('skilltrack_token');
    if (!currentToken) {
      persistSession(null, null);
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      const userData = response.data?.data?.user || response.data?.user;
      if (userData) {
        setUser(userData);
        localStorage.setItem('skilltrack_user', JSON.stringify(userData));
        return userData;
      }
    } catch (err) {
      // If error is 401/unauthorized, log out
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, [logout]);

  // Initial verification on mount
  useEffect(() => {
    const initAuth = async () => {
      const currentToken = localStorage.getItem('token') || localStorage.getItem('skilltrack_token');
      if (currentToken) {
        await refreshUser();
      } else {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for unauthorized events triggered by API interceptor
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [refreshUser, logout]);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const data = response.data?.data || response.data;
    const { token: receivedToken, user: receivedUser } = data;

    persistSession(receivedToken, receivedUser);
    return { success: true, user: receivedUser, token: receivedToken };
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const data = response.data?.data || response.data;
    return data;
  };

  const isAuthenticated = Boolean(token && user);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
