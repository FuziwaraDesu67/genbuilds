'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  linkedUid?: string | null;
  isVerified?: boolean;
  verificationCode?: string | null;
  avatarUrl?: string | null;
}

export interface UserFavorite {
  id: number;
  userId: string;
  targetUid: string;
  targetNickname?: string | null;
  targetAvatarUrl?: string | null;
  createdAt: string | Date;
}

interface AuthContextType {
  user: AuthUser | null;
  favorites: UserFavorite[];
  loading: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  login: (params: { identifier: string; password?: string; isQuickLogin?: boolean; linkedUid?: string }) => Promise<{ success: boolean; error?: string }>;
  register: (params: { username: string; email?: string; password?: string; linkedUid?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  linkUid: (uid: string) => Promise<{ success: boolean; error?: string }>;
  verifySignature: () => Promise<{ success: boolean; verified?: boolean; message?: string; error?: string }>;
  toggleFavorite: (targetUid: string, targetNickname?: string, targetAvatarUrl?: string) => Promise<boolean>;
  isFavorited: (uid: string) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFavorites(data.favorites || []);
      } else {
        setUser(null);
        setFavorites([]);
      }
    } catch {
      setUser(null);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (params: { identifier: string; password?: string; isQuickLogin?: boolean; linkedUid?: string }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      setUser(data.user);
      await fetchCurrentUser();
      setIsModalOpen(false);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  };

  const register = async (params: { username: string; email?: string; password?: string; linkedUid?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      setUser(data.user);
      await fetchCurrentUser();
      setIsModalOpen(false);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setFavorites([]);
    }
  };

  const linkUid = async (uid: string) => {
    try {
      const res = await fetch('/api/auth/link-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to link UID' };
      }
      setUser(data.user);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  };

  const verifySignature = async () => {
    try {
      const res = await fetch('/api/auth/verify-signature', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || data.error };
      }
      setUser(data.user);
      return { success: true, verified: true, message: data.message };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  };

  const toggleFavorite = async (targetUid: string, targetNickname?: string, targetAvatarUrl?: string): Promise<boolean> => {
    if (!user) {
      setIsModalOpen(true);
      return false;
    }

    try {
      const res = await fetch('/api/auth/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid, targetNickname, targetAvatarUrl }),
      });
      const data = await res.json();
      if (res.ok && data.favorites) {
        setFavorites(data.favorites);
        return data.favorited;
      }
      return false;
    } catch {
      return false;
    }
  };

  const isFavorited = (uid: string) => {
    return favorites.some(f => f.targetUid === uid);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        favorites,
        loading,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        login,
        register,
        logout,
        linkUid,
        verifySignature,
        toggleFavorite,
        isFavorited,
        refresh: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const DEFAULT_AUTH_CONTEXT: AuthContextType = {
  user: null,
  favorites: [],
  loading: false,
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  login: async () => ({ success: false, error: 'Auth not initialized' }),
  register: async () => ({ success: false, error: 'Auth not initialized' }),
  logout: async () => {},
  linkUid: async () => ({ success: false }),
  verifySignature: async () => ({ success: false }),
  toggleFavorite: async () => false,
  isFavorited: () => false,
  refresh: async () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH_CONTEXT;
}
