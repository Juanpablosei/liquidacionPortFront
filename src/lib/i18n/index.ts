import es, { type Translations } from './es';
export type { Translations };
import en from './en';
import { useAuthStore } from '@/stores/auth-store';

const dictionaries: Record<string, Translations> = { es, en };

export type Locale = 'es' | 'en';

/** Get the translations object for the given locale (defaults to 'es'). */
export function getTranslations(locale?: string | null): Translations {
  return dictionaries[locale ?? 'es'] ?? es;
}

/**
 * React hook that returns the translations for the current user locale.
 * Reactively updates when the user changes their language.
 */
export function useTranslation(): Translations {
  const locale = useAuthStore((s) => s.user?.locale);
  return getTranslations(locale);
}

/** Map app locale to Intl locale id */
export function getLocaleId(locale?: string | null): string {
  return locale === 'en' ? 'en-US' : 'es-AR';
}

/** React hook that returns the Intl locale id for the current user. */
export function useLocaleId(): string {
  const locale = useAuthStore((s) => s.user?.locale);
  return getLocaleId(locale);
}
