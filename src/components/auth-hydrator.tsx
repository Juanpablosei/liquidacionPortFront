'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { refreshTokens } from '@/lib/api/auth';

export function AuthHydrator() {
  const { refreshToken, setTokens, logout, hydrate } = useAuthStore();

  useEffect(() => {
    async function hydrateAuth() {
      if (!refreshToken) {
        hydrate();
        return;
      }

      try {
        const data = await refreshTokens(refreshToken);
        setTokens(data.accessToken, data.refreshToken);
      } catch {
        logout();
      } finally {
        hydrate();
      }
    }

    hydrateAuth();
  // Solo ejecutar al montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
