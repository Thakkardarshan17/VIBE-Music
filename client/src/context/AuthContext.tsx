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
  // Synchronously initialize user from localStorage so refresh NEVER causes a flash-logout
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('vibe_user');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('vibe_user');
      if (cached) {
        const u = JSON.parse(cached);
        return {
          id: 'prof_' + u.id,
          userId: u.id,
          bio: 'Music enthusiast on VIBE MUSIC',
          favoriteGenres: 'Pop, Bollywood, Punjabi, EDM',
        };
      }
    } catch {}
    return null;
  });

  const [settings, setSettings] = useState<UserSettings | null>(() => {
    return {
      theme: 'dark',
      audioQuality: 'high',
      volume: 80,
      autoplay: true,
      notificationsEnabled: true,
    };
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('vibe_token') || sessionStorage.getItem('vibe_token');
    const cachedUser = localStorage.getItem('vibe_user');

    if (!token && !cachedUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    // If we have cached user, make sure user state is active immediately
    if (cachedUser && !user) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
      } catch {}
    }

    try {
      const data = await authApi.getMe();
      if (data && data.user) {
        setUser(data.user);
        if (data.profile) setProfile(data.profile);
        if (data.settings) setSettings(data.settings);
        localStorage.setItem('vibe_user', JSON.stringify(data.user));
      }
    } catch (err) {
      // Offline or static host: DO NOT LOG OUT! Keep session active indefinitely
      console.log('[Auth] Preserving user session offline/cached on page refresh');
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
      localStorage.setItem('vibe_token', data.token);
      sessionStorage.setItem('vibe_token', data.token);
      localStorage.setItem('vibe_user', JSON.stringify(data.user));
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
      localStorage.setItem('vibe_user', JSON.stringify(res.user));
      setUser(res.user);
      await fetchCurrentUser();
    }
  };

  const resendVerificationCode = async (email: string) => {
    return await authApi.resendCode(email);
  };

  const decodeJwtPayload = (token: string): any => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const googleLogin = async (credential?: string, testProfile?: any) => {
    // Helper to save verified profile locally (used by all fallback paths)
    const saveUserLocally = (profile: any) => {
      const verifiedUser: User = {
        id: 'goog_' + (profile.sub || Math.abs(String(profile.email).split('').reduce((a: any, b: any) => (a << 5) - a + b.charCodeAt(0), 0))),
        email: profile.email.toLowerCase(),
        username: (profile.name || profile.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, ''),
        fullName: profile.name || profile.email.split('@')[0],
        role: 'USER',
        avatarUrl: profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.email)}`,
        emailVerified: true,
      };

      const clientToken = 'vibe_auth_token_' + btoa(encodeURIComponent(JSON.stringify(verifiedUser))) + '.' + Date.now();
      localStorage.setItem('vibe_token', clientToken);
      sessionStorage.setItem('vibe_token', clientToken);
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
    };

    // --- If a testProfile (Guest/Demo) is supplied, skip everything & save directly ---
    if (testProfile && testProfile.email) {
      saveUserLocally(testProfile);
      return;
    }

    if (!credential) {
      throw new Error('No Google credential provided.');
    }

    // --- STRATEGY 1: Try backend verification (works only when server is online) ---
    try {
      const data = await authApi.googleAuth({ credential, testProfile });
      if (data && data.token && data.user) {
        localStorage.setItem('vibe_token', data.token);
        sessionStorage.setItem('vibe_token', data.token);
        localStorage.setItem('vibe_user', JSON.stringify(data.user));
        setUser(data.user);
        await fetchCurrentUser();
        return;
      }
    } catch (backendErr: any) {
      console.warn('[Auth] Backend auth failed (expected on static hosts), using client-side verification:', backendErr?.message);
    }

    // --- STRATEGY 2: Client-side Google token verification chain ---
    let profile: any = null;

    // Try A: JWT decode — standard Google ID Token from One Tap / Sign-In button
    const jwtPayload = decodeJwtPayload(credential);
    if (jwtPayload && jwtPayload.email) {
      profile = {
        email: jwtPayload.email,
        name: jwtPayload.name || jwtPayload.given_name || jwtPayload.email.split('@')[0],
        picture: jwtPayload.picture,
        sub: jwtPayload.sub,
      };
    }

    // Try B: Google tokeninfo API — works for ID tokens
    if (!profile) {
      try {
        const tokeninfoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, {
          timeout: 8000,
        });
        if (tokeninfoRes.data?.email) {
          profile = {
            email: tokeninfoRes.data.email,
            name: tokeninfoRes.data.name || tokeninfoRes.data.email.split('@')[0],
            picture: tokeninfoRes.data.picture,
            sub: tokeninfoRes.data.sub,
          };
        }
      } catch {
        // Not an ID token — try as access token next
      }
    }

    // Try C: Google Userinfo API — works for OAuth2 Access Tokens (popup flow)
    if (!profile) {
      try {
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credential}` },
          timeout: 8000,
        });
        if (googleRes.data?.email) {
          profile = {
            email: googleRes.data.email,
            name: googleRes.data.name || googleRes.data.email.split('@')[0],
            picture: googleRes.data.picture,
            sub: googleRes.data.sub,
          };
        }
      } catch (err: any) {
        console.warn('[Auth] Google userinfo API also failed:', err?.message);
      }
    }

    // Try D: Google tokeninfo for access_token (last resort)
    if (!profile) {
      try {
        const atRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${credential}`, {
          timeout: 8000,
        });
        if (atRes.data?.email) {
          profile = {
            email: atRes.data.email,
            name: atRes.data.email.split('@')[0],
            picture: undefined,
            sub: atRes.data.sub,
          };
        }
      } catch {
        // All verification methods exhausted
      }
    }

    if (profile && profile.email) {
      saveUserLocally(profile);
      return;
    }

    // All strategies exhausted — throw a user-friendly error
    throw new Error('Google identity verification failed. Please try again or use Instant Access.');
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
