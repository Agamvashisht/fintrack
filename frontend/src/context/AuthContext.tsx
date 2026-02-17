import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/services';
import type { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        setUser(res.data);
      } catch {
        // Try refresh
        try {
          const refreshRes = await authApi.refresh();
          localStorage.setItem('accessToken', refreshRes.data.accessToken);
          const meRes = await authApi.getMe();
          setUser(meRes.data);
        } catch {
          localStorage.removeItem('accessToken');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for unauthorized logout events
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      navigate('/login');
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    navigate('/dashboard');
    toast.success(`Welcome back, ${res.data.user.name}!`);
  }, [navigate]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    navigate('/dashboard');
    toast.success('Account created! Welcome to FinTrack.');
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      navigate('/login');
      toast.success('Logged out successfully');
    }
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
