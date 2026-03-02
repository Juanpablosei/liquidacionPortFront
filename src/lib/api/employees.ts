import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { Employee } from '@/lib/types/employee';
import type { PaginatedResponse } from '@/lib/types/api';

export interface CreateEmployeeDto {
  documentType:   string;
  documentNumber: string;
  firstName:      string;
  lastName:       string;
  email?:         string;
  phone?:         string;
  birthDate?:     string;
  hireDate:       string;
}

export interface UpdateEmployeeDto {
  documentType?:  string;
  documentNumber?: string;
  firstName?:     string;
  lastName?:      string;
  email?:         string;
  phone?:         string;
  birthDate?:     string;
  hireDate?:      string;
}

export interface TerminateEmployeeDto {
  terminationDate: string;
}

export interface ListEmployeesParams {
  page?:     number;
  limit?:    number;
  search?:   string;
  isActive?: boolean;
}

export function listEmployees(
  companyId: string,
  params:    ListEmployeesParams = {},
): Promise<PaginatedResponse<Employee>> {
  const query = new URLSearchParams();
  if (params.page  !== undefined) query.set('page',  String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.search)              query.set('search', params.search);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  const qs = query.toString();
  return apiFetch(`${API.employees.list(companyId)}${qs ? `?${qs}` : ''}`);
}

export function getEmployee(companyId: string, employeeId: string): Promise<Employee> {
  return apiFetch(API.employees.detail(companyId, employeeId));
}

export function createEmployee(companyId: string, data: CreateEmployeeDto): Promise<Employee> {
  return apiFetch(API.employees.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateEmployee(
  companyId:  string,
  employeeId: string,
  data:       UpdateEmployeeDto,
): Promise<Employee> {
  return apiFetch(API.employees.update(companyId, employeeId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function terminateEmployee(
  companyId:  string,
  employeeId: string,
  data:       TerminateEmployeeDto,
): Promise<Employee> {
  return apiFetch(API.employees.terminate(companyId, employeeId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}
