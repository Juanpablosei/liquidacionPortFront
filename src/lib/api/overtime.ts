import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { OvertimeEntry, OvertimeType } from '@/lib/types/attendance';

export interface CreateOvertimeDto {
  employeeId:   string;
  date:         string;
  overtimeType: OvertimeType;
  minutes:      number;
  notes?:       string;
}

export interface UpdateOvertimeDto {
  date?:         string;
  overtimeType?: OvertimeType;
  minutes?:      number;
  notes?:        string;
}

export interface ListOvertimeParams {
  employeeId?: string;
  fromDate?:   string;
  toDate?:     string;
  type?:       OvertimeType;
}

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && 'items' in (raw as object)) {
    return ((raw as { items: T[] }).items);
  }
  return [];
}

export function listOvertime(
  companyId: string,
  params:    ListOvertimeParams = {},
): Promise<OvertimeEntry[]> {
  const query = new URLSearchParams();
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.fromDate)   query.set('fromDate',   params.fromDate);
  if (params.toDate)     query.set('toDate',     params.toDate);
  if (params.type)       query.set('type',       params.type);
  const qs = query.toString();
  return apiFetch<unknown>(`${API.overtime.list(companyId)}${qs ? `?${qs}` : ''}`).then(toArray<OvertimeEntry>);
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
