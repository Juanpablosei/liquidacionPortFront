import es, { type Translations } from './es';
export type { Translations };
import en from './en';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

const dictionaries: Record<string, Translations> = { es, en };

export type Locale = 'es' | 'en';

/** Get the translations object for the given locale (defaults to 'es'). */
export function getTranslations(locale?: string | null): Translations {
  return dictionaries[locale ?? 'es'] ?? es;
}

/**
 * React hook that returns the translations for the current user locale.
 * Falls back to ui-store locale when user is not logged in.
 */
export function useTranslation(): Translations {
  const userLocale = useAuthStore((s) => s.user?.locale);
  const uiLocale = useUiStore((s) => s.locale);
  return getTranslations(userLocale ?? uiLocale);
}

/** Map app locale to Intl locale id */
export function getLocaleId(locale?: string | null): string {
  return locale === 'en' ? 'en-US' : 'es-AR';
}

/** React hook that returns the Intl locale id for the current user. */
export function useLocaleId(): string {
  const userLocale = useAuthStore((s) => s.user?.locale);
  const uiLocale = useUiStore((s) => s.locale);
  return getLocaleId(userLocale ?? uiLocale);
}
