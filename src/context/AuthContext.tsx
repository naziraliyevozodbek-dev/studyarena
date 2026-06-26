'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  role: string;
  xp: number;
  level: number;
  streak: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authenticate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // @ts-expect-error - Telegram WebApp is injected dynamically
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        throw new Error('Please open inside Telegram');
      }

      tg.ready();
      tg.expand();
      
      const initData = tg.initData;
      if (!initData) {
        throw new Error('No Telegram initData found');
      }

      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
      });

      if (!res.ok) {
        throw new Error('Authentication failed');
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load Telegram Web App JS if not present
    if (typeof window !== 'undefined' && !('Telegram' in window)) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;
      script.onload = () => { authenticate(); };
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else {
      setTimeout(() => authenticate(), 0);
    }
  }, []);

  const refreshUser = async () => {
    // Basic refresh logic (in real app, call a /api/users/me endpoint with the token)
    // For now, we'll just skip to keep it simple, or re-run authenticate.
    await authenticate();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
