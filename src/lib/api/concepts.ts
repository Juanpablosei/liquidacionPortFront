import { apiFetch } from './client';
import { toArray, unwrapObject } from './helpers';
import { API } from '@/lib/constants/api-endpoints';
import type { PayrollConcept, FormulaValidationResult } from '@/lib/types/payroll';

export interface CreateConceptDto {
  code:         string;
  name:         string;
  category:     'EARNING' | 'DEDUCTION';
  calcType:     'FIXED' | 'PERCENT' | 'HOURLY' | 'MANUAL' | 'FORMULA';
  fixedAmount?: string;
  percentValue?: string;
  percentBase?: 'BASIC' | 'GROSS';
  hourlyRate?:  string;
  formula?:     string;
  sortOrder?:   number;
}

export type UpdateConceptDto = Partial<CreateConceptDto> & { isActive?: boolean };

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

export function validateFormula(companyId: string, formula: string): Promise<FormulaValidationResult> {
  return apiFetch<FormulaValidationResult>(API.concepts.validateFormula(companyId), {
    method: 'POST',
    body:   JSON.stringify({ formula }),
  });
}
