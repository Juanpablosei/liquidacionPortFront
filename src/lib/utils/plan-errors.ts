import type { PlanLimitError, PlanFeatureError } from '@/lib/types/plan';

const PLAN_LIMIT_MESSAGES = [
  'plan.EMPLOYEE_LIMIT_REACHED',
  'plan.MEMBER_LIMIT_REACHED',
  'plan.RUN_LIMIT_REACHED',
  'plan.COMPANY_LIMIT_REACHED',
];

const PLAN_FEATURE_MESSAGE = 'plan.FEATURE_NOT_AVAILABLE';

export function isPlanLimitError(error: unknown): error is PlanLimitError {
  if (!error || typeof error !== 'object') return false;
  const err = error as Record<string, unknown>;
  return (
    err.statusCode === 403 &&
    typeof err.message === 'string' &&
    PLAN_LIMIT_MESSAGES.includes(err.message)
  );
}

export function isPlanFeatureError(error: unknown): error is PlanFeatureError {
  if (!error || typeof error !== 'object') return false;
  const err = error as Record<string, unknown>;
  return (
    err.statusCode === 403 &&
    err.message === PLAN_FEATURE_MESSAGE &&
    typeof err.feature === 'string'
  );
}

export function isPlanError(error: unknown): boolean {
  return isPlanLimitError(error) || isPlanFeatureError(error);
}

export function getPlanLimitKey(message: string): string | null {
  const map: Record<string, string> = {
    'plan.EMPLOYEE_LIMIT_REACHED': 'employeeLimit',
    'plan.MEMBER_LIMIT_REACHED': 'memberLimit',
    'plan.RUN_LIMIT_REACHED': 'runLimit',
    'plan.COMPANY_LIMIT_REACHED': 'companyLimit',
  };
  return map[message] ?? null;
}

export function getPlanFeatureKey(feature: string): string | null {
  const map: Record<string, string> = {
    exportPdf: 'exportPdf',
    unions: 'unions',
    formulas: 'formulas',
    aiUpload: 'aiUpload',
  };
  return map[feature] ?? null;
}
