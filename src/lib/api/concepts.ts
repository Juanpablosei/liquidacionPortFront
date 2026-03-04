import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { PayrollConcept } from '@/lib/types/payroll';

export interface CreateConceptDto {
  code:         string;
  name:         string;
  category:     'EARNING' | 'DEDUCTION';
  calcType:     'FIXED' | 'PERCENT' | 'HOURLY' | 'MANUAL';
  fixedAmount?: string;
  percentValue?: string;
  percentBase?: 'BASIC' | 'GROSS';
  hourlyRate?:  string;
  sortOrder?:   number;
}

export type UpdateConceptDto = Partial<CreateConceptDto> & { isActive?: boolean };

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.data))  return o.data  as T[];
  }
  return [];
}

function unwrapObject<T extends object>(raw: unknown, key: keyof T): T {
  const obj = raw as Record<string, unknown>;
  if (obj?.data && typeof obj.data === 'object' && key in (obj.data as object)) {
    return obj.data as T;
  }
  return raw as T;
}

export function listConcepts(companyId: string): Promise<PayrollConcept[]> {
  return apiFetch<unknown>(API.concepts.list(companyId)).then((r) => toArray<PayrollConcept>(r));
}

export function createConcept(companyId: string, data: CreateConceptDto): Promise<PayrollConcept> {
  return apiFetch<unknown>(API.concepts.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<PayrollConcept>(r, 'id'));
}

export function updateConcept(companyId: string, id: string, data: UpdateConceptDto): Promise<PayrollConcept> {
  return apiFetch<unknown>(API.concepts.update(companyId, id), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<PayrollConcept>(r, 'id'));
}

export function deleteConcept(companyId: string, id: string): Promise<void> {
  return apiFetch<void>(API.concepts.delete(companyId, id), { method: 'DELETE' });
}
