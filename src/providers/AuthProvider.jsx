import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const PREDEFINED_ACCOUNTS = {
  'samuel@gmail.com': { name: 'Samuel Mekala', role: 'OWNER' },
  'admin@lifeline.com': { name: 'System Admin', role: 'ADMIN' },
  'reception@lifeline.com': { name: 'Priya Sharma (Receptionist)', role: 'RECEPTIONIST' },
  'receptionist@lifeline.com': { name: 'Priya Sharma (Receptionist)', role: 'RECEPTIONIST' },
  'tech@lifeline.com': { name: 'Anil Verma (Lab Technician)', role: 'LAB_TECHNICIAN' },
  'technician@lifeline.com': { name: 'Anil Verma (Lab Technician)', role: 'LAB_TECHNICIAN' },
  'patho@lifeline.com': { name: 'Dr. Sunita Rao (Pathologist)', role: 'PATHOLOGIST' },
  'pathologist@lifeline.com': { name: 'Dr. Sunita Rao (Pathologist)', role: 'PATHOLOGIST' },
  'patient@gmail.com': { name: 'Rajesh Kumar (Patient)', role: 'PATIENT' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('lifeline_access_token') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('lifeline_refresh_token') || null);
  const [loading, setLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState('Life Line Diagnostics Main Hub');

  // Automatic role-based navigation mapping
  const getDashboardPath = useCallback((userRole) => {
    const role = userRole || user?.role;
    switch (role) {
      case 'PATIENT':
        return '/portal/dashboard';
      case 'RECEPTIONIST':
        return '/operations/patients';
      case 'LAB_TECHNICIAN':
      case 'PHLEBOTOMIST':
        return '/operations/samples';
      case 'PATHOLOGIST':
        return '/operations/approvals';
      case 'BRANCH_MANAGER':
      case 'OWNER':
      case 'ADMIN':
        return '/operations/dashboard';
      default:
        return '/portal/dashboard';
    }
  }, [user]);

  // Helper to load registered users array from localStorage
  const getRegisteredUsersList = () => {
    try {
      const raw = localStorage.getItem('lifeline_registered_users_list');
      if (!raw) return [];
      const list = JSON.parse(raw);
      // Filter out test emails joel@gmail.com and sunny@gmail.com
      const cleaned = list.filter((u) => u.email?.toLowerCase() !== 'joel@gmail.com' && u.email?.toLowerCase() !== 'sunny@gmail.com');
      if (cleaned.length !== list.length) {
        localStorage.setItem('lifeline_registered_users_list', JSON.stringify(cleaned));
      }
      return cleaned;
    } catch (e) {
      return [];
    }
  };

  // Helper to load employee / staff registry from localStorage
  const getEmployeeList = () => {
    try {
      const raw = localStorage.getItem('lifeline_admin_staff');
      const staffList = raw ? JSON.parse(raw) : [
        { email: 'dr.sunita@lifelinediagnostics.com', full_name: 'Dr. Sunita Rao', role: 'PATHOLOGIST' },
        { email: 'anil.tech@lifelinediagnostics.com', full_name: 'Anil Kumar', role: 'LAB_TECHNICIAN' },
        { email: 'priya.desk@lifelinediagnostics.com', full_name: 'Priya Sharma', role: 'RECEPTIONIST' },
        { email: 'suresh.phleb@lifelinediagnostics.com', full_name: 'Suresh V.', role: 'PHLEBOTOMIST' },
        { email: 'srinivas.k@lifelinediagnostics.com', full_name: 'K. Srinivas', role: 'RECEPTIONIST' },
        { email: 'mahesh.reddy@lifelinediagnostics.com', full_name: 'Mahesh Reddy', role: 'LAB_TECHNICIAN' },
      ];
      return staffList;
    } catch (e) {
      return [];
    }
  };

  // Save tokens to state & localStorage
  const saveTokens = (accessToken, refresh) => {
    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem('lifeline_access_token', accessToken);
    }
    if (refresh) {
      setRefreshToken(refresh);
      localStorage.setItem('lifeline_refresh_token', refresh);
    }
  };

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('lifeline_access_token');
    localStorage.removeItem('lifeline_refresh_token');
    localStorage.removeItem('lifeline_user_profile');
  }, []);

  // Restore session on mount via /api/auth/me or saved local state
  const restoreSession = useCallback(async () => {
    setLoading(true);
    const savedToken = localStorage.getItem('lifeline_access_token');
    const savedUserStr = localStorage.getItem('lifeline_user_profile');

    if (savedToken) {
      try {
        const res = await axios.get(`${API_BASE}/api/auth/me/`, {
          headers: { Authorization: `Bearer ${savedToken}` },
          timeout: 3000,
        });
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('lifeline_user_profile', JSON.stringify(res.data));
        }
      } catch (err) {
        if (savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr);
            if (parsedUser.email?.toLowerCase() === 'joel@gmail.com' || parsedUser.email?.toLowerCase() === 'sunny@gmail.com') {
              clearSession();
            } else {
              setUser(parsedUser);
            }
          } catch (e) {
            clearSession();
          }
        } else {
          clearSession();
        }
      }
    } else if (savedUserStr) {
      try {
        const parsedUser = JSON.parse(savedUserStr);
        setUser(parsedUser);
      } catch (e) {
        clearSession();
      }
    }
    setLoading(false);
  }, [clearSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Silent token refresh
  const performSilentRefresh = useCallback(async () => {
    const currentRefresh = localStorage.getItem('lifeline_refresh_token');
    if (!currentRefresh) return false;

    try {
      const res = await axios.post(`${API_BASE}/api/auth/token/refresh/`, {
        refresh: currentRefresh,
      }, { timeout: 3000 });

      if (res.data?.access) {
        saveTokens(res.data.access, res.data.refresh);
        return true;
      }
    } catch (err) {
      console.warn('Silent token refresh failed.');
    }
    return false;
  }, []);

  // Axios interceptor for auto token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshed = await performSilentRefresh();
          if (refreshed) {
            const newToken = localStorage.getItem('lifeline_access_token');
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [performSilentRefresh]);

  // Authenticate user against Backend API with robust local accounts fallback
  const login = async (email, password) => {
    const normEmail = email.trim().toLowerCase();

    // 1. Attempt Django REST API Login
    try {
      const res = await axios.post(`${API_BASE}/api/auth/token/`, {
        email: normEmail,
        password,
      }, { timeout: 3000 });

      if (res.data) {
        const { access, refresh, user: apiUser } = res.data;
        saveTokens(access, refresh);
        
        let userObj = apiUser;
        if (!userObj) {
          const meRes = await axios.get(`${API_BASE}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${access}` },
          });
          userObj = meRes.data;
        }

        setUser(userObj);
        localStorage.setItem('lifeline_user_profile', JSON.stringify(userObj));
        return { success: true, user: userObj, redirect: getDashboardPath(userObj.role) };
      }
    } catch (err) {
      console.warn('Backend API login unavailable or 401, checking registered & predefined local accounts...');
    }

    // 2. Check Employee / Staff Registry List
    const employeeList = getEmployeeList();
    const foundEmp = employeeList.find((e) => e.email?.toLowerCase() === normEmail);
    if (foundEmp) {
      const empUser = {
        id: foundEmp.id || `emp_${Date.now()}`,
        email: normEmail,
        full_name: foundEmp.full_name,
        role: foundEmp.role,
        phone: foundEmp.mobile || '+91 98765 43210',
        branch: 'Life Line Diagnostics Main Hub',
      };
      saveTokens(`jwt_mock_${Date.now()}`, `jwt_refresh_${Date.now()}`);
      setUser(empUser);
      localStorage.setItem('lifeline_user_profile', JSON.stringify(empUser));
      return { success: true, user: empUser, redirect: getDashboardPath(empUser.role) };
    }

    // 3. Check Registered Patient Accounts Store
    const registeredList = getRegisteredUsersList();
    const foundRegUser = registeredList.find((u) => u.email?.toLowerCase() === normEmail);
    if (foundRegUser) {
      if (foundRegUser.password && foundRegUser.password !== password) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }
      saveTokens(`jwt_mock_${Date.now()}`, `jwt_refresh_${Date.now()}`);
      setUser(foundRegUser);
      localStorage.setItem('lifeline_user_profile', JSON.stringify(foundRegUser));
      return { success: true, user: foundRegUser, redirect: getDashboardPath(foundRegUser.role) };
    }

    // 4. Check Predefined Accounts List
    const account = PREDEFINED_ACCOUNTS[normEmail];
    if (account) {
      const userObj = {
        id: `usr_${Date.now()}`,
        email: normEmail,
        full_name: account.name,
        role: account.role,
        phone: '+91 98765 43210',
        branch: 'Life Line Diagnostics Main Hub',
      };
      saveTokens(`jwt_mock_${Date.now()}`, `jwt_refresh_${Date.now()}`);
      setUser(userObj);
      localStorage.setItem('lifeline_user_profile', JSON.stringify(userObj));
      return { success: true, user: userObj, redirect: getDashboardPath(userObj.role) };
    }

    // Account not found in backend DB, registered users list, or predefined staff accounts -> Reject login
    throw new Error(`Account not found for email "${normEmail}". Please check your email address or click 'Register Patient Account' to create a new profile.`);
  };

  // Register handler with Strict Employee & Duplicate Email Prevention
  const register = async (formData) => {
    const normEmail = formData.email.trim().toLowerCase();

    // STRICT CHECK 1: Prevent Employee Emails from Registering as Patients
    const employeeList = getEmployeeList();
    const isEmployee = employeeList.some((e) => e.email?.toLowerCase() === normEmail);
    const isPredefinedStaff = Boolean(PREDEFINED_ACCOUNTS[normEmail]) && normEmail !== 'patient@gmail.com';

    if (isEmployee || isPredefinedStaff) {
      throw new Error(`The email address "${normEmail}" is registered to an active Staff / Employee account. Staff members must log in via Portal Sign In.`);
    }

    // STRICT CHECK 2: Prevent duplicate patient registrations
    const registeredList = getRegisteredUsersList();
    const isAlreadyRegistered = registeredList.some((u) => u.email?.toLowerCase() === normEmail);

    if (isAlreadyRegistered) {
      throw new Error(`An account with email "${normEmail}" already exists. Please sign in or register with a different email address.`);
    }

    // STRICT CHECK 3: Backend API Registration with duplicate error propagation
    try {
      const res = await axios.post(`${API_BASE}/api/auth/patients/register/`, formData, { timeout: 3000 });
      if (res.data) {
        return await login(normEmail, formData.password);
      }
    } catch (err) {
      if (err.response?.status === 400 || err.response?.data) {
        const errorMsg = err.response?.data?.email?.[0] || err.response?.data?.detail || err.response?.data?.message;
        if (errorMsg) {
          throw new Error(errorMsg);
        }
      }
    }

    // Create & persist new user object into registered accounts list
    const newPatientUser = {
      id: `usr_${Date.now()}`,
      email: normEmail,
      password: formData.password,
      full_name: formData.full_name,
      phone: formData.phone || '+91 98765 43210',
      role: 'PATIENT',
      patient_id: `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
      branch: 'Life Line Diagnostics Main Hub',
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      blood_group: formData.blood_group,
      address: formData.address,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
    };

    const updatedList = [...registeredList, newPatientUser];
    localStorage.setItem('lifeline_registered_users_list', JSON.stringify(updatedList));

    saveTokens(`jwt_mock_${Date.now()}`, `jwt_refresh_${Date.now()}`);
    setUser(newPatientUser);
    localStorage.setItem('lifeline_user_profile', JSON.stringify(newPatientUser));
    return { success: true, user: newPatientUser, redirect: '/portal/dashboard' };
  };

  const logout = () => {
    clearSession();
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }
    return user.role === allowedRoles;
  };

  const value = {
    user,
    token,
    refreshToken,
    loading,
    activeBranch,
    setActiveBranch,
    login,
    register,
    logout,
    hasRole,
    getDashboardPath,
    isAuthenticated: Boolean(user),
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

export default AuthProvider;
