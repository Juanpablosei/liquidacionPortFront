import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { Contract, ContractScheduleEntry } from '@/lib/types/employee';

export interface CreateContractDto {
  startDate:    string;
  endDate?:     string;
  salaryType:   'MONTHLY' | 'HOURLY';
  salaryAmount: string;
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
