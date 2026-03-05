import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/lib/types/auth';

interface AuthState {
  user:                User | null;
  accessToken:         string | null;
  refreshToken:        string | null;
  isAuthenticated:     boolean;
  isLoading:           boolean;
  mustChangePassword:  boolean;

  login:     (user: User, accessToken: string, refreshToken: string, mustChangePassword?: boolean) => void;
  logout:    () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser:   (user: User) => void;
  clearMustChangePassword: () => void;
  hydrate:   () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:                null,
      accessToken:         null,
      refreshToken:        null,
      isAuthenticated:     false,
      isLoading:           true,
      mustChangePassword:  false,

      login: (user, accessToken, refreshToken, mustChangePassword) => {
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=1; path=/; SameSite=Lax';
          if (mustChangePassword) {
            document.cookie = 'must-change-pwd=1; path=/; SameSite=Lax';
          }
        }
        set({
          user, accessToken, refreshToken,
          isAuthenticated: true, isLoading: false,
          mustChangePassword: mustChangePassword ?? user?.mustChangePassword ?? false,
        });
      },

      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';
          document.cookie = 'must-change-pwd=; path=/; max-age=0; SameSite=Lax';
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, mustChangePassword: false });
      },

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setUser: (user) =>
        set({ user, mustChangePassword: user?.mustChangePassword ?? false }),

      clearMustChangePassword: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'must-change-pwd=; path=/; max-age=0; SameSite=Lax';
        }
        set({ mustChangePassword: false });
      },

      hydrate: () =>
        set({ isLoading: false }),
    }),
    {
      name:    'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken:        state.accessToken,
        refreshToken:       state.refreshToken,
        user:               state.user,
        isAuthenticated:    state.isAuthenticated,
        mustChangePassword: state.mustChangePassword,
      }),
    },
  ),
);
