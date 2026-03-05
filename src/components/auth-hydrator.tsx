'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { refreshTokens, getMe } from '@/lib/api/auth';

export function AuthHydrator() {
  useEffect(() => {
    async function hydrateAuth() {
      const { refreshToken, setTokens, setUser, logout, hydrate } = useAuthStore.getState();

      if (!refreshToken) {
        hydrate();
        return;
      }

      try {
        const data = await refreshTokens(refreshToken);
        setTokens(data.accessToken, data.refreshToken ?? '');
        document.cookie = 'auth-token=1; path=/; SameSite=Lax';

        // Sync mustChangePassword from server
        const user = await getMe();
        setUser(user);
        if (user.mustChangePassword) {
          document.cookie = 'must-change-pwd=1; path=/; SameSite=Lax';
        } else {
          document.cookie = 'must-change-pwd=; path=/; max-age=0; SameSite=Lax';
        }
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
