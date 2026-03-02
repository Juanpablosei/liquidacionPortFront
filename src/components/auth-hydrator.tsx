'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { refreshTokens } from '@/lib/api/auth';

export function AuthHydrator() {
  useEffect(() => {
    async function hydrateAuth() {
      // Leer desde getState() garantiza el estado más reciente,
      // incluyendo el ya rehidratado desde localStorage por Zustand persist.
      const { refreshToken, setTokens, logout, hydrate } = useAuthStore.getState();

      if (!refreshToken) {
        hydrate();
        return;
      }

      try {
        const data = await refreshTokens(refreshToken);
        setTokens(data.accessToken, data.refreshToken);
        document.cookie = 'auth-token=1; path=/; SameSite=Lax';
      } catch {
        logout();
      } finally {
        useAuthStore.getState().hydrate();
      }
    }

    hydrateAuth();
  }, []);

  return null;
}
