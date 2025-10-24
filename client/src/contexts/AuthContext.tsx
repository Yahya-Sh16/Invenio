"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user && !!tokens;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedTokens = localStorage.getItem('authTokens');
        const storedUser = localStorage.getItem('authUser');

        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);
          
          setTokens(parsedTokens);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!tokens) return;

    const refreshInterval = setInterval(async () => {
      const success = await refreshToken();
      if (!success) {
        logout();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [tokens]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { user: userData, tokens: tokenData } = data;

      setUser(userData);
      setTokens(tokenData);

      localStorage.setItem('authTokens', JSON.stringify(tokenData));
      localStorage.setItem('authUser', JSON.stringify(userData));

      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: string = 'VIEWER'): Promise<void> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Auto-login after registration
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = (): void => {
    if (tokens?.refreshToken) {
      // Call logout endpoint to invalidate refresh token
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      }).catch(console.error);
    }

    setUser(null);
    setTokens(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('authUser');
    router.push('/login');
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        return false;
      }

      const newTokens = data.tokens;
      setTokens(newTokens);
      localStorage.setItem('authTokens', JSON.stringify(newTokens));

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    login,
    register,
    logout,
    refreshToken,
    isLoading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
