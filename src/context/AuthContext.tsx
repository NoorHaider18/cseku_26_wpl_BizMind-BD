import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setStoredToken, getStoredToken } from '../services/api.ts';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager';
  phone?: string;
  avatar?: string;
  job_title?: string;
  business_id: string;
  business?: {
    id: string;
    name: string;
    industry: string;
    currency: string;
    location?: string;
    bin_number?: string;
    trade_license?: string;
    phone?: string;
    email?: string;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: 'owner' | 'manager';
  phone?: string;
  avatar?: string;
  job_title?: string;
  business_name?: string;
  industry?: string;
  currency?: string;
  location?: string;
  bin_number?: string;
  trade_license?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  currency: string;
  formatMoney: (amount: number) => string;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser> & { password?: string }) => Promise<any>;
  updateBusinessProfile: (data: any) => Promise<any>;
  switchDemoUser: (role: 'owner' | 'manager') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getMe();
      setUser(data);
    } catch (err) {
      console.warn('Session check failed or token expired:', err);
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    const me = await api.getMe();
    setUser(me);
  }

  async function register(payload: RegisterPayload) {
    const res = await api.register(payload);
    setStoredToken(res.token);
    const me = await api.getMe();
    setUser(me);
  }

  function logout() {
    setStoredToken(null);
    setUser(null);
  }

  async function updateProfile(data: Partial<AuthUser> & { password?: string }) {
    const res = await api.updateProfile(data);
    setUser(res.user);
    return res;
  }

  async function updateBusinessProfile(data: any) {
    const res = await api.updateBusinessProfile(data);
    const me = await api.getMe();
    setUser(me);
    return res;
  }

  async function switchDemoUser(targetRole: 'owner' | 'manager') {
    const email = targetRole === 'owner' ? 'owner@sme.com' : 'manager@sme.com';
    await login(email, 'password123');
  }

  const currency = user?.business?.currency || '৳';

  const formatMoney = (amount: number): string => {
    const num = Number(amount) || 0;
    return `${currency} ${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        currency,
        formatMoney,
        login,
        register,
        logout,
        updateProfile,
        updateBusinessProfile,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
