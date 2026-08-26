import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, UserOut } from '../api/client';

const ACCESS_KEY = 'jobblitz_access_token';
const REFRESH_KEY = 'jobblitz_refresh_token';

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try { return typeof window !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
    }
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try { if (typeof window !== 'undefined') localStorage.setItem(key, value); } catch {}
      return;
    }
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try { if (typeof window !== 'undefined') localStorage.removeItem(key); } catch {}
      return;
    }
    try { await SecureStore.deleteItemAsync(key); } catch {}
  },
};

interface AuthState {
  user: UserOut | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserOut>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const accessToken = await storage.getItem(ACCESS_KEY);
      const refreshToken = await storage.getItem(REFRESH_KEY);
      if (accessToken) {
        api.setToken(accessToken);
        const user = await api.getMe();
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      }
    } catch {
      // Token expired or invalid — clear
      await storage.deleteItem(ACCESS_KEY);
      await storage.deleteItem(REFRESH_KEY);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const tokens = await api.login(email, password);
    await storage.setItem(ACCESS_KEY, tokens.access_token);
    await storage.setItem(REFRESH_KEY, tokens.refresh_token);
    api.setToken(tokens.access_token);
    const user = await api.getMe();
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user,
      isAuthenticated: true,
    });
  },

  register: async (email, password, fullName) => {
    const tokens = await api.register(email, password, fullName);
    await storage.setItem(ACCESS_KEY, tokens.access_token);
    await storage.setItem(REFRESH_KEY, tokens.refresh_token);
    api.setToken(tokens.access_token);
    const user = await api.getMe();
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await storage.deleteItem(ACCESS_KEY);
    await storage.deleteItem(REFRESH_KEY);
    api.setToken(null);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  updateUser: (data) => {
    const { user } = get();
    if (user) set({ user: { ...user, ...data } });
  },
}));
