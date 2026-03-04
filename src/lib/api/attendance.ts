import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { Attendance } from '@/lib/types/attendance';

export interface CreateAttendanceDto {
  employeeId: string;
  date:       string;
  clockIn?:   string;
  clockOut?:  string;
  notes?:     string;
}

export interface UpdateAttendanceDto {
  date?:     string;
  clockIn?:  string;
  clockOut?: string;
  notes?:    string;
}

export interface ListAttendanceParams {
  employeeId?: string;
  fromDate?:   string;
  toDate?:     string;
}

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && 'items' in (raw as object)) {
    return ((raw as { items: T[] }).items);
  }
  return [];
}

export function listAttendance(
  companyId: string,
  params:    ListAttendanceParams = {},
): Promise<Attendance[]> {
  const query = new URLSearchParams();
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.fromDate)   query.set('fromDate',   params.fromDate);
  if (params.toDate)     query.set('toDate',     params.toDate);
  const qs = query.toString();
  return apiFetch<unknown>(`${API.attendance.list(companyId)}${qs ? `?${qs}` : ''}`).then(toArray<Attendance>);
}

export function createAttendance(
  companyId: string,
  data:      CreateAttendanceDto,
): Promise<Attendance> {
  return apiFetch(API.attendance.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateAttendance(
  companyId:    string,
  attendanceId: string,
  data:         UpdateAttendanceDto,
): Promise<Attendance> {
  return apiFetch(API.attendance.update(companyId, attendanceId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function deleteAttendance(
  companyId:    string,
  attendanceId: string,
): Promise<void> {
  return apiFetch(API.attendance.delete(companyId, attendanceId), {
    method: 'DELETE',
  });
}
