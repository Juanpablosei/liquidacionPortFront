'use client';

import { Globe } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { useTranslation } from '@/lib/i18n';
import { updateLocale } from '@/lib/api/auth';

export function LocaleToggle() {
  const user = useAuthStore((s) => s.user);
  const uiLocale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  const t = useTranslation();
  const currentLocale: 'es' | 'en' = (user?.locale as 'es' | 'en') ?? uiLocale;

  async function toggleLocale() {
    const next = currentLocale === 'es' ? 'en' : 'es';

    // Always update ui-store (works for everyone)
    setLocale(next);

    // Also update auth-store + backend if logged in
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setUser({ ...currentUser, locale: next });
      try {
        await updateLocale(next);
      } catch {
        useAuthStore.getState().setUser({ ...currentUser, locale: currentLocale });
        setLocale(currentLocale);
      }
    }
  }

  return (
    <button
      onClick={toggleLocale}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-overlay transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      aria-label={t.header.changeLang}
    >
      <Globe className="w-3.5 h-3.5" />
      {currentLocale.toUpperCase()}
    </button>
  );
}
