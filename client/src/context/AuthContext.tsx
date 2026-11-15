import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserProfile, UserSettings } from '../types/music.js';
import { authApi } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (credentials: { login: string; password: string; rememberMe?: boolean }) => Promise<any>;
  register: (data: { fullName: string; email: string; password: string; confirmPassword?: string; mobileNumber?: string }) => Promise<any>;
  verifyEmail: (data: { email: string; code: string }) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<any>;
  googleLogin: (credential?: string, testProfile?: any) => Promise<void>;
  logout: () => Promise<void>;
  promptLogout: () => void;
  showLogoutModal: boolean;
  setShowLogoutModal: (show: boolean) => void;
  confirmLogout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile & { fullName?: string; username?: string; avatarUrl?: string; mobileNumber?: string }>) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('vibe_token') || sessionStorage.getItem('vibe_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setProfile(data.profile);
      setSettings(data.settings);
    } catch (err) {
      console.warn('Session expired or revoked:', err);
      localStorage.removeItem('vibe_token');
      sessionStorage.removeItem('vibe_token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { login: string; password: string; rememberMe?: boolean }) => {
    const data = await authApi.login(credentials);
    if (data.token) {
      if (credentials.rememberMe) {
        localStorage.setItem('vibe_token', data.token);
        sessionStorage.removeItem('vibe_token');
      } else {
        sessionStorage.setItem('vibe_token', data.token);
        localStorage.removeItem('vibe_token');
      }
      setUser(data.user);
      await fetchCurrentUser();
    }
    return data;
  };

  const register = async (data: { fullName: string; email: string; password: string; confirmPassword?: string; mobileNumber?: string }) => {
    const res = await authApi.register(data);
    return res;
  };

  const verifyEmail = async (data: { email: string; code: string }) => {
    const res = await authApi.verifyEmail(data);
    if (res.token) {
      localStorage.setItem('vibe_token', res.token);
      setUser(res.user);
      await fetchCurrentUser();
    }
  };

  const resendVerificationCode = async (email: string) => {
    return await authApi.resendCode(email);
  };

  const googleLogin = async (credential?: string, testProfile?: any) => {
    const data = await authApi.googleAuth({ credential, testProfile });
    if (data.token) {
      localStorage.setItem('vibe_token', data.token);
      setUser(data.user);
      await fetchCurrentUser();
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      // Disconnect and wipe client auth
      localStorage.removeItem('vibe_token');
      sessionStorage.removeItem('vibe_token');
      setUser(null);
      setProfile(null);
      setSettings(null);
      // Dispatch stop audio event
      window.dispatchEvent(new Event('vibe_logout_event'));
    }
  };

  const promptLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    // Redirect to login page and replace history
    window.location.href = '/login';
  };

  const updateProfile = async (data: Partial<UserProfile & { fullName?: string; username?: string; avatarUrl?: string; mobileNumber?: string }>) => {
    const res = await authApi.updateProfile(data);
    setProfile(res.profile);
    setUser((prev) => (prev ? { ...prev, ...(data.fullName && { fullName: data.fullName }), ...(data.username && { username: data.username }), ...(data.avatarUrl && { avatarUrl: data.avatarUrl }) } : null));
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    const res = await authApi.updateSettings(data);
    setSettings(res.settings);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        settings,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        register,
        verifyEmail,
        resendVerificationCode,
        googleLogin,
        logout,
        promptLogout,
        showLogoutModal,
        setShowLogoutModal,
        confirmLogout,
        refreshUser: fetchCurrentUser,
        updateProfile,
        updateSettings,
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
