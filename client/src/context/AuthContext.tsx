import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StorageMode } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  onlineUserIds: string[];
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: (userId: string) => Promise<void>;
  switchStorageMode: (mode: StorageMode) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = api.getToken();
      if (storedToken) {
        // Clear legacy mock tokens so user connects to real live cloud backend
        if (storedToken.startsWith('mock_jwt_')) {
          console.log('Clearing legacy mock token to connect to real live cloud backend');
          api.setToken(null);
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const res = await api.getMe();
          setUser(res.user);
          socket.connect(storedToken);
        } catch (err) {
          console.warn('Failed to restore session:', err);
          api.setToken(null);
          setToken(null);
          setUser(null);
        }
      } else {
        // No stored token: show Initial Sign Up / Sign In Page
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Listen to WebSocket presence
  useEffect(() => {
    // Fetch initial presence via API as well
    api.getOnlineUserIds().then((ids) => {
      if (ids && ids.length > 0) {
        setOnlineUserIds((prev) => Array.from(new Set([...prev, ...ids])));
      }
    });

    const unsubConnected = socket.on('connected', (data: { userId: string; onlineUserIds: string[] }) => {
      setOnlineUserIds(data.onlineUserIds || []);
    });

    const unsubPresence = socket.on('presence.update', (data: { userId: string; isOnline: boolean }) => {
      setOnlineUserIds((prev) => {
        if (data.isOnline) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId];
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    });

    // Also sync presence periodically every 10 seconds
    const interval = setInterval(() => {
      api.getOnlineUserIds().then((ids) => {
        if (ids && ids.length > 0) {
          setOnlineUserIds(ids);
        }
      });
    }, 10000);

    return () => {
      unsubConnected();
      unsubPresence();
      clearInterval(interval);
    };
  }, []);

  // Heartbeat keepalive: device online means there is internet connectivity to the device
  // Keeps device active on network even when user is not actively tapping the app
  useEffect(() => {
    if (!user) return;

    const pingHeartbeat = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        api.sendHeartbeat().then((res) => {
          if (res?.onlineUserIds) {
            setOnlineUserIds(res.onlineUserIds);
          }
        });
      }
    };

    pingHeartbeat();
    const timer = setInterval(pingHeartbeat, 25000);

    const handleOnline = () => pingHeartbeat();
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  const login = async (identifier: string, pass: string) => {
    const res = await api.login(identifier, pass);
    localStorage.setItem('aam_user_explicitly_authenticated', 'true');
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    socket.connect(res.token);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('aam_user_explicitly_authenticated', 'true');
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    socket.connect(res.token);
  };

  const demoLogin = async (userId: string) => {
    setLoading(true);
    socket.disconnect();
    const res = await api.demoLogin(userId);
    localStorage.setItem('aam_user_explicitly_authenticated', 'true');
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    socket.connect(res.token);
    setLoading(false);
  };

  const switchStorageMode = async (mode: StorageMode) => {
    if (!user) return;
    const res = await api.switchStorageMode(mode);
    setUser(res.user);
  };

  const refreshProfile = async () => {
    if (!token) return;
    const res = await api.getMe();
    setUser(res.user);
  };

  const logout = () => {
    socket.disconnect();
    localStorage.removeItem('aam_user_explicitly_authenticated');
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        onlineUserIds,
        login,
        register,
        demoLogin,
        switchStorageMode,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
