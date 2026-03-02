'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { refreshTokens } from '@/lib/api/auth';

export function AuthHydrator() {
  // Previene doble ejecución en React Strict Mode (desarrollo):
  // React monta → efecto → "desmonta" → vuelve a montar → efecto de nuevo.
  // Sin este guard, ambas ejecuciones leen el mismo refreshToken antes de que
  // la primera lo rote, la segunda falla y llama logout().
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      // getState() lee el store EN ESTE MOMENTO (después de que Zustand persist
      // ya hidró desde localStorage con su setTimeout interno).
      const { refreshToken, user, login, logout, hydrate } = useAuthStore.getState();

      if (!refreshToken) {
        hydrate(); // Sin sesión → terminar loading, redirigirá a /login
        return;
      }

      try {
        const data = await refreshTokens(refreshToken);
        // login() ya setea isAuthenticated: true, isLoading: false y la cookie
        login(user!, data.accessToken, data.refreshToken);
      } catch {
        // Refresh falló (token expirado o backend no disponible) → cerrar sesión
        logout(); // logout() ya limpia la cookie
        hydrate(); // terminar loading para que el layout redirija
      }
    })();
  }, []);

  return null;
}
