import { apiFetch } from './client';
import { toArray } from './helpers';
import { API } from '@/lib/constants/api-endpoints';
import type { Contract, ContractScheduleEntry } from '@/lib/types/employee';

export interface CreateContractDto {
  startDate:    string;
  endDate?:     string;
  salaryType:   'MONTHLY' | 'HOURLY';
  salaryAmount: string;
  conceptIds?:  string[];
}

export interface UpdateContractDto {
  startDate?:    string;
  endDate?:      string;
  salaryType?:   'MONTHLY' | 'HOURLY';
  salaryAmount?: string;
}

export interface SetScheduleDto {
  entries: Array<{
    weekday:      number;
    startTime:    string;
    endTime:      string;
    breakMinutes: number;
  }>;
}

export interface ContractConcept {
  id:        string;
  code:      string;
  name:      string;
  category:  'EARNING' | 'DEDUCTION';
  calcType:  'FIXED' | 'PERCENT' | 'HOURLY' | 'MANUAL';
  isActive:  boolean;
  sortOrder: number;
}

export function listContracts(
  companyId:  string,
  employeeId: string,
): Promise<Contract[]> {
  return apiFetch(API.contracts.list(companyId, employeeId));
}

export function createContract(
  companyId:  string,
  employeeId: string,
  data:       CreateContractDto,
): Promise<Contract> {
  return apiFetch(API.contracts.create(companyId, employeeId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateContract(
  companyId:  string,
  employeeId: string,
  contractId: string,
  data:       UpdateContractDto,
): Promise<Contract> {
  return apiFetch(API.contracts.update(companyId, employeeId, contractId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function getSchedule(
  companyId:  string,
  employeeId: string,
  contractId: string,
): Promise<ContractScheduleEntry[]> {
  return apiFetch(API.contracts.schedule(companyId, employeeId, contractId));
}

export function setSchedule(
  companyId:  string,
  employeeId: string,
  contractId: string,
  data:       SetScheduleDto,
): Promise<ContractScheduleEntry[]> {
  return apiFetch(API.contracts.schedule(companyId, employeeId, contractId), {
    method: 'PUT',
    body:   JSON.stringify(data),
  });
}

// ─── Contract Concepts ───────────────────────────────────────────────────────

export function listContractConcepts(
  companyId:  string,
  employeeId: string,
  contractId: string,
): Promise<ContractConcept[]> {
  return apiFetch<unknown>(API.contracts.concepts(companyId, employeeId, contractId)).then(toArray<ContractConcept>);
}

export function assignContractConcepts(
  companyId:  string,
  employeeId: string,
  contractId: string,
  conceptIds: string[],
): Promise<ContractConcept[]> {
  return apiFetch<unknown>(API.contracts.concepts(companyId, employeeId, contractId), {
    method: 'POST',
    body:   JSON.stringify({ conceptIds }),
  }).then(toArray<ContractConcept>);
}

export function removeContractConcept(
  companyId:  string,
  employeeId: string,
  contractId: string,
  conceptId:  string,
): Promise<void> {
  return apiFetch(API.contracts.concept(companyId, employeeId, contractId, conceptId), {
    method: 'DELETE',
  });
}
