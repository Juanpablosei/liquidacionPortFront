import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { VacationBalance, VacationRequest, VacationStatus } from '@/lib/types/vacation';
import type { PaginatedResponse } from '@/lib/types/api';

export interface CreateVacationRequestDto {
  employeeId: string;
  startDate:  string;
  endDate:    string;
  reason?:    string;
}

export interface ReviewVacationDto {
  status:      'APPROVED' | 'REJECTED';
  reviewNote?: string;
}

export interface ListVacationRequestsParams {
  employeeId?: string;
  status?:     VacationStatus;
  fromDate?:   string;
  toDate?:     string;
  page?:       number;
  limit?:      number;
}

export function listVacationBalances(companyId: string): Promise<VacationBalance[]> {
  return apiFetch<VacationBalance[]>(API.vacations.balances(companyId));
}

export function getVacationBalance(companyId: string, employeeId: string): Promise<VacationBalance> {
  return apiFetch<VacationBalance>(API.vacations.balance(companyId, employeeId));
}

export function listVacationRequests(
  companyId: string,
  params:    ListVacationRequestsParams = {},
): Promise<PaginatedResponse<VacationRequest>> {
  const query = new URLSearchParams();
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.status)     query.set('status',     params.status);
  if (params.fromDate)   query.set('fromDate',   params.fromDate);
  if (params.toDate)     query.set('toDate',     params.toDate);
  if (params.page)       query.set('page',       String(params.page));
  if (params.limit)      query.set('limit',      String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<VacationRequest>>(
    `${API.vacations.requests(companyId)}${qs ? `?${qs}` : ''}`,
  );
}

export function createVacationRequest(
  companyId: string,
  data:      CreateVacationRequestDto,
): Promise<VacationRequest> {
  return apiFetch(API.vacations.requests(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function reviewVacationRequest(
  companyId: string,
  requestId: string,
  data:      ReviewVacationDto,
): Promise<VacationRequest> {
  return apiFetch(API.vacations.review(companyId, requestId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function cancelVacationRequest(companyId: string, requestId: string): Promise<VacationRequest> {
  return apiFetch(API.vacations.cancel(companyId, requestId), { method: 'POST' });
}
