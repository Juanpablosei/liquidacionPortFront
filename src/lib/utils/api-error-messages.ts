import type { Translations } from '@/lib/i18n';

/**
 * Maps a raw backend error code (e.g. "subscription.NO_SUBSCRIPTION")
 * to a translated, user-friendly message.
 *
 * Returns `null` when the code is not recognized, so callers can
 * fall back to the raw message.
 */
export function mapBackendError(code: string, t: Translations): string | null {
  const map: Record<string, string> = {
    'subscription.NO_SUBSCRIPTION': t.apiErrors.noSubscription,
    'subscription.BLOCKED':         t.apiErrors.subscriptionBlocked,
    'subscription.PAST_DUE':        t.apiErrors.subscriptionPastDue,
    'subscription.CANCELLED':       t.apiErrors.subscriptionCancelled,
    'subscription.TRIAL_EXPIRED':   t.apiErrors.trialExpired,
  };

  return map[code] ?? null;
}

/**
 * Extracts a user-friendly error message from an unknown catch value.
 *
 * Usage in page / component catch blocks:
 * ```ts
 * } catch (err) {
 *   toast.error(getErrorMessage(err, t));
 * }
 * ```
 */
export function getErrorMessage(err: unknown, t: Translations): string {
  if (err instanceof Error) {
    return mapBackendError(err.message, t) ?? err.message;
  }
  if (typeof err === 'string') {
    return mapBackendError(err, t) ?? err;
  }
  return t.apiErrors.unexpectedError;
}
