import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { Absence, AbsenceType, AbsenceStatus, AbsenteeismReportEntry } from '@/lib/types/absence';
import type { PaginatedResponse } from '@/lib/types/api';

export interface CreateAbsenceDto {
  employeeId: string;
  date:       string;
  type:       AbsenceType;
  reason?:    string;
}

export interface UpdateAbsenceDto {
  type?:   AbsenceType;
  reason?: string;
}

export interface ReviewAbsenceDto {
  status:      'APPROVED' | 'REJECTED';
  reviewNote?: string;
}

export interface ListAbsencesParams {
  employeeId?: string;
  fromDate?:   string;
  toDate?:     string;
  type?:       AbsenceType;
  status?:     AbsenceStatus;
  page?:       number;
  limit?:      number;
}

export function listAbsences(
  companyId: string,
  params:    ListAbsencesParams = {},
): Promise<PaginatedResponse<Absence>> {
  const query = new URLSearchParams();
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.fromDate)   query.set('fromDate',   params.fromDate);
  if (params.toDate)     query.set('toDate',     params.toDate);
  if (params.type)       query.set('type',       params.type);
  if (params.status)     query.set('status',     params.status);
  if (params.page)       query.set('page',       String(params.page));
  if (params.limit)      query.set('limit',      String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<Absence>>(
    `${API.absences.list(companyId)}${qs ? `?${qs}` : ''}`,
  );
}

export function createAbsence(companyId: string, data: CreateAbsenceDto): Promise<Absence> {
  return apiFetch(API.absences.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateAbsence(
  companyId: string,
  absenceId: string,
  data:      UpdateAbsenceDto,
): Promise<Absence> {
  return apiFetch(API.absences.update(companyId, absenceId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function reviewAbsence(
  companyId: string,
  absenceId: string,
  data:      ReviewAbsenceDto,
): Promise<Absence> {
  return apiFetch(API.absences.review(companyId, absenceId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function deleteAbsence(companyId: string, absenceId: string): Promise<void> {
  return apiFetch(API.absences.delete(companyId, absenceId), { method: 'DELETE' });
}

export function getAbsenteeismReport(
  companyId: string,
  params:    { fromDate?: string; toDate?: string } = {},
): Promise<AbsenteeismReportEntry[]> {
  const query = new URLSearchParams();
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate)   query.set('toDate',   params.toDate);
  const qs = query.toString();
  return apiFetch<AbsenteeismReportEntry[]>(
    `${API.absences.report(companyId)}${qs ? `?${qs}` : ''}`,
  );
}
