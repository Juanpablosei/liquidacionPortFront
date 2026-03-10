import { apiFetch, ApiRequestError } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type {
  SettlementConfig,
  UpdateSettlementConfigInput,
  Settlement,
  CreateSettlementInput,
} from '@/lib/types/settlement';

// ─── Config ──────────────────────────────────────────────────────────────────

export function getSettlementConfig(companyId: string) {
  return apiFetch<SettlementConfig>(API.settlements.config(companyId));
}

export function updateSettlementConfig(
  companyId: string,
  data: UpdateSettlementConfigInput,
) {
  return apiFetch<SettlementConfig>(API.settlements.config(companyId), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─── Settlement ──────────────────────────────────────────────────────────────

export function createSettlement(
  companyId:  string,
  employeeId: string,
  data:       CreateSettlementInput,
) {
  return apiFetch<Settlement>(API.settlements.create(companyId, employeeId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSettlement(companyId: string, employeeId: string): Promise<Settlement | null> {
  try {
    return await apiFetch<Settlement>(API.settlements.detail(companyId, employeeId));
  } catch (err: unknown) {
    if (err instanceof ApiRequestError && err.status === 404) {
      return null;
    }
    throw err;
  }
}
