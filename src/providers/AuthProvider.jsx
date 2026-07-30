import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('lifeline_access_token') || null);
  const [loading, setLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState('Life Line Diagnostics — Vijayawada');

  // ── Role-based navigation ──────────────────────────────────────────
  const getDashboardPath = useCallback((userRole) => {
    const role = userRole || user?.role;
    switch (role) {
      case 'PATIENT':         return '/portal/dashboard';
      case 'RECEPTIONIST':    return '/operations/patients';
      case 'LAB_TECHNICIAN':
      case 'PHLEBOTOMIST':    return '/operations/samples';
      case 'PATHOLOGIST':     return '/operations/approvals';
      case 'OWNER':
      case 'ADMIN':           return '/operations/dashboard';
      default:                return '/portal/dashboard';
    }
  }, [user]);

  // ── Persist tokens ─────────────────────────────────────────────────
  const saveTokens = (access, refresh) => {
    if (access) {
      setToken(access);
      localStorage.setItem('lifeline_access_token', access);
    }
    if (refresh) {
      localStorage.setItem('lifeline_refresh_token', refresh);
    }
  };

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lifeline_access_token');
    localStorage.removeItem('lifeline_refresh_token');
    localStorage.removeItem('lifeline_user_profile');
  }, []);

  // ── Restore session on mount ───────────────────────────────────────
  const restoreSession = useCallback(async () => {
    setLoading(true);
    const savedToken = localStorage.getItem('lifeline_access_token');
    const savedUserStr = localStorage.getItem('lifeline_user_profile');

    if (savedUserStr) {
      try {
        setUser(JSON.parse(savedUserStr));
      } catch (_) {}
    }

    if (savedToken) {
      setToken(savedToken);
      try {
        const res = await api.get('/api/auth/me/');
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('lifeline_user_profile', JSON.stringify(res.data));
        }
      } catch (err) {
        // Backend offline — keep existing saved user from localStorage
        // Session will be validated again on next API call
        console.warn('Session restore: backend unreachable, using cached profile.');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ── Login — pure Django JWT ────────────────────────────────────────
  const login = async (email, password) => {
    const normEmail = email.trim().toLowerCase();
    try {
      const res = await api.post('/api/auth/token/', { email: normEmail, password });
      const { access, refresh, user: apiUser } = res.data;
      saveTokens(access, refresh);

      let userObj = apiUser;
      if (!userObj) {
        const meRes = await api.get('/api/auth/me/', {
          headers: { Authorization: `Bearer ${access}` },
        });
        userObj = meRes.data;
      }

      setUser(userObj);
      localStorage.setItem('lifeline_user_profile', JSON.stringify(userObj));
      return { success: true, user: userObj, redirect: getDashboardPath(userObj.role) };
    } catch (err) {
      const detail = err.response?.data?.detail
        || err.response?.data?.error
        || 'Invalid email or password. Please try again.';
      throw new Error(detail);
    }
  };

  // ── Register — pure Django REST ────────────────────────────────────
  const register = async (formData) => {
    const normEmail = formData.email.trim().toLowerCase();
    try {
      const res = await api.post('/api/auth/patients/register/', {
        email: normEmail,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || '',
        date_of_birth: formData.date_of_birth || '',
        gender: formData.gender || 'M',
        address: formData.address || '',
      });

      if (res.data?.access) {
        const { access, refresh, user: regUser } = res.data;
        saveTokens(access, refresh);
        setUser(regUser);
        localStorage.setItem('lifeline_user_profile', JSON.stringify(regUser));
        return { success: true, user: regUser, redirect: '/portal/dashboard' };
      }
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.error || d?.email?.[0] || d?.detail || 'Registration failed. Please try again.';
      throw new Error(msg);
    }
    throw new Error('Registration failed. Please try again.');
  };

  // ── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout/');
    } catch (_) {}
    clearSession();
  }, [clearSession]);

  // ── Helpers ────────────────────────────────────────────────────────
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (Array.isArray(allowedRoles)) return allowedRoles.includes(user.role);
    return user.role === allowedRoles;
  };

  const value = {
    user,
    token,
    loading,
    activeBranch,
    setActiveBranch,
    login,
    register,
    logout,
    hasRole,
    getDashboardPath,
    isAuthenticated: Boolean(user),
    clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthProvider;
