import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/lib/types/auth';

interface AuthState {
  user:            User | null;
  accessToken:     string | null;
  refreshToken:    string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;

  login:     (user: User, accessToken: string, refreshToken: string) => void;
  logout:    () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser:   (user: User) => void;
  hydrate:   () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,
      isLoading:       true,

      login: (user, accessToken, refreshToken) => {
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=1; path=/; SameSite=Lax';
        }
        // Debug: lo que guardamos en el store (Zustand persist lo escribe en localStorage)
        console.log('[AuthStore] login() — guardando en store (y localStorage):', {
          accessToken: accessToken ? `${accessToken.slice(0, 20)}...` : null,
          refreshToken: refreshToken ? `${refreshToken.slice(0, 20)}...` : null,
        });
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setUser: (user) =>
        set({ user }),

      hydrate: () =>
        set({ isLoading: false }),
    }),
    {
      name:    'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
