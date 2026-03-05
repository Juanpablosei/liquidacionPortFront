import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { OvertimeEntry, OvertimeType } from '@/lib/types/attendance';
import type { PaginatedResponse } from '@/lib/types/api';

export interface CreateOvertimeDto {
  employeeId:   string;
  date:         string;
  overtimeType: OvertimeType;
  minutes:      number;
  notes?:       string;
}

export interface UpdateOvertimeDto {
  minutes?: number;
  notes?:   string;
}

export interface ListOvertimeParams {
  employeeId?: string;
  fromDate?:   string;
  toDate?:     string;
  type?:       OvertimeType;
  page?:       number;
  limit?:      number;
}

export function listOvertime(
  companyId: string,
  params:    ListOvertimeParams = {},
): Promise<PaginatedResponse<OvertimeEntry>> {
  const query = new URLSearchParams();
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.fromDate)   query.set('fromDate',   params.fromDate);
  if (params.toDate)     query.set('toDate',     params.toDate);
  if (params.type)       query.set('type',       params.type);
  if (params.page)       query.set('page',       String(params.page));
  if (params.limit)      query.set('limit',      String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<OvertimeEntry>>(`${API.overtime.list(companyId)}${qs ? `?${qs}` : ''}`);
}

export function createOvertime(
  companyId: string,
  data:      CreateOvertimeDto,
): Promise<OvertimeEntry> {
  return apiFetch(API.overtime.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateOvertime(
  companyId:  string,
  overtimeId: string,
  data:       UpdateOvertimeDto,
): Promise<OvertimeEntry> {
  return apiFetch(API.overtime.update(companyId, overtimeId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function deleteOvertime(
  companyId:  string,
  overtimeId: string,
): Promise<void> {
  return apiFetch(API.overtime.delete(companyId, overtimeId), {
    method: 'DELETE',
  });
}
