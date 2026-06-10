import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api, { setTokens, clearAuth, getRefreshToken } from '../api/client';
import { User } from '../types';

interface AuthError {
  message: string;
  fieldErrors?: Record<string, string>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseAuthError(err: unknown): AuthError {
  const axiosErr = err as { response?: { data?: { error?: string; errors?: Record<string, string> } } };
  return {
    message: axiosErr.response?.data?.error || 'Something went wrong',
    fieldErrors: axiosErr.response?.data?.errors,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    const profile: User = {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    };
    setUser(profile);
    localStorage.setItem('user', JSON.stringify(profile));
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshProfile();
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      const parsed = parseAuthError(err);
      const e = new Error(parsed.message) as Error & { fieldErrors?: Record<string, string> };
      e.fieldErrors = parsed.fieldErrors;
      throw e;
    }
  };

  const register = async (formData: { email: string; password: string; fullName: string }) => {
    try {
      const { data } = await api.post('/auth/register', formData);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      const parsed = parseAuthError(err);
      const e = new Error(parsed.message) as Error & { fieldErrors?: Record<string, string> };
      e.fieldErrors = parsed.fieldErrors;
      throw e;
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // proceed with local logout
    }
    clearAuth();
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { AuthError };
