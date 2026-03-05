import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { Attendance } from '@/lib/types/attendance';
import type { PaginatedResponse } from '@/lib/types/api';

export interface CreateAttendanceDto {
  employeeId:    string;
  date:          string;
  clockIn?:      string;
  clockOut?:     string;
  workedMinutes?: number;
  notes?:        string;
}

export interface UpdateAttendanceDto {
  clockIn?:       string;
  clockOut?:      string;
  workedMinutes?: number;
  notes?:        string;
}

export interface ListAttendanceParams {
  employeeId?: string;
  fromDate?:   string;
  toDate?:     string;
  page?:       number;
  limit?:      number;
}

export function listAttendance(
  companyId: string,
  params:    ListAttendanceParams = {},
): Promise<PaginatedResponse<Attendance>> {
  const query = new URLSearchParams();
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.fromDate)   query.set('fromDate',   params.fromDate);
  if (params.toDate)     query.set('toDate',     params.toDate);
  if (params.page)       query.set('page',       String(params.page));
  if (params.limit)      query.set('limit',      String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<Attendance>>(`${API.attendance.list(companyId)}${qs ? `?${qs}` : ''}`);
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
