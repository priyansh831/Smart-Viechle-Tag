import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types/index.js';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (data: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    preferredLanguage?: string;
  }) => Promise<void>;
  logout: () => void;
  demoLogin: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'smarttag_jwt_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Validate existing token on boot
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error verifying auth token:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (identifier: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (formData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    preferredLanguage?: string;
  }) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed.');
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const demoLogin = async () => {
    try {
      await login('priyansh_driver', 'password123');
    } catch {
      await login('alex_driver', 'password123');
    }
  };

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        demoLogin,
        authFetch
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
