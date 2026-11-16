import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
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
      localStorage.setItem('vibe_user', JSON.stringify(data.user));
    } catch (err) {
      // If backend is unreachable or 405 on static hosting, restore cached verified user
      const cached = localStorage.getItem('vibe_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          setProfile({
            id: 'prof_' + parsed.id,
            userId: parsed.id,
            bio: 'Music enthusiast on VIBE MUSIC',
            favoriteGenres: 'Pop, Bollywood, Punjabi, EDM',
          });
          setSettings({
            theme: 'dark',
            audioQuality: 'high',
            volume: 80,
            autoplay: true,
            notificationsEnabled: true,
          });
        } catch {
          localStorage.removeItem('vibe_token');
          localStorage.removeItem('vibe_user');
          setUser(null);
          setProfile(null);
        }
      } else {
        localStorage.removeItem('vibe_token');
        setUser(null);
        setProfile(null);
      }
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
      localStorage.setItem('vibe_user', JSON.stringify(data.user));
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
      localStorage.setItem('vibe_user', JSON.stringify(res.user));
      setUser(res.user);
      await fetchCurrentUser();
    }
  };

  const resendVerificationCode = async (email: string) => {
    return await authApi.resendCode(email);
  };

  const googleLogin = async (credential?: string, testProfile?: any) => {
    // 1. First try backend verification
    try {
      const data = await authApi.googleAuth({ credential, testProfile });
      if (data.token) {
        localStorage.setItem('vibe_token', data.token);
        localStorage.setItem('vibe_user', JSON.stringify(data.user));
        setUser(data.user);
        await fetchCurrentUser();
        return;
      }
    } catch (backendErr: any) {
      console.warn('Backend API auth returned error, verifying directly with Google Userinfo API:', backendErr);

      // 2. Client-side verified Google OAuth Userinfo verification fallback
      if (credential) {
        try {
          const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${credential}` },
            timeout: 10000,
          });
          const profile = googleRes.data;

          if (profile && profile.email) {
            const verifiedUser: User = {
              id: 'goog_' + (profile.sub || Math.abs(profile.email.split('').reduce((a: any, b: any) => (a << 5) - a + b.charCodeAt(0), 0))),
              email: profile.email.toLowerCase(),
              username: (profile.name || profile.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, ''),
              fullName: profile.name || profile.email.split('@')[0],
              role: 'USER',
              avatarUrl: profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.email)}`,
              emailVerified: true,
            };

            const clientToken = 'vibe_auth_token_' + btoa(encodeURIComponent(JSON.stringify(verifiedUser))) + '.' + Date.now();
            localStorage.setItem('vibe_token', clientToken);
            localStorage.setItem('vibe_user', JSON.stringify(verifiedUser));

            setUser(verifiedUser);
            setProfile({
              id: 'prof_' + verifiedUser.id,
              userId: verifiedUser.id,
              bio: 'Music enthusiast on VIBE MUSIC',
              favoriteGenres: 'Pop, Bollywood, Punjabi, EDM',
            });
            setSettings({
              theme: 'dark',
              audioQuality: 'high',
              volume: 80,
              autoplay: true,
              notificationsEnabled: true,
            });
            return;
          }
        } catch (directGoogleErr) {
          console.error('Direct Google Userinfo error:', directGoogleErr);
        }
      }

      throw backendErr;
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
      localStorage.removeItem('vibe_user');
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
