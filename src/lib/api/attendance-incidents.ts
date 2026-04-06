import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { AttendanceIncident, IncidentSummary, IncidentType, IncidentStatus } from '@/lib/types/attendance';
import type { PaginatedResponse } from '@/lib/types/api';

export interface ListIncidentsParams {
  employeeId?: string;
  fromDate?:   string;
  toDate?:     string;
  type?:       IncidentType;
  status?:     IncidentStatus;
  page?:       number;
  limit?:      number;
}

export interface GenerateAlertsDto {
  fromDate: string;
  toDate:   string;
}

export function listIncidents(
  companyId: string,
  params:    ListIncidentsParams = {},
): Promise<PaginatedResponse<AttendanceIncident>> {
  const query = new URLSearchParams();
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.fromDate)   query.set('fromDate',   params.fromDate);
  if (params.toDate)     query.set('toDate',     params.toDate);
  if (params.type)       query.set('type',       params.type);
  if (params.status)     query.set('status',     params.status);
  if (params.page)       query.set('page',       String(params.page));
  if (params.limit)      query.set('limit',      String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<AttendanceIncident>>(
    `${API.attendanceIncidents.list(companyId)}${qs ? `?${qs}` : ''}`,
  );
}

export function getIncidentSummary(companyId: string): Promise<IncidentSummary> {
  return apiFetch<IncidentSummary>(API.attendanceIncidents.summary(companyId));
}

export function acknowledgeIncident(companyId: string, incidentId: string): Promise<AttendanceIncident> {
  return apiFetch(API.attendanceIncidents.acknowledge(companyId, incidentId), { method: 'POST' });
}

export function dismissIncident(companyId: string, incidentId: string): Promise<AttendanceIncident> {
  return apiFetch(API.attendanceIncidents.dismiss(companyId, incidentId), { method: 'POST' });
}

export function generateAlerts(
  companyId: string,
  data:      GenerateAlertsDto,
): Promise<{ generated: number }> {
  return apiFetch(API.attendanceIncidents.generate(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}
