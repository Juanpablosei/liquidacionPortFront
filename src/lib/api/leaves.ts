import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { LeaveType, LeaveRequest, LeaveStatus, LeaveSummaryEntry } from '@/lib/types/leave';
import type { PaginatedResponse } from '@/lib/types/api';

export interface CreateLeaveTypeDto {
  name:     string;
  isPaid:   boolean;
  maxDays?: number | null;
}

export interface UpdateLeaveTypeDto {
  name?:    string;
  isPaid?:  boolean;
  maxDays?: number | null;
}

export interface CreateLeaveRequestDto {
  employeeId:  string;
  leaveTypeId: string;
  startDate:   string;
  endDate:     string;
  reason?:     string;
}

export interface ReviewLeaveDto {
  status:      'APPROVED' | 'REJECTED';
  reviewNote?: string;
}

export interface ListLeavesParams {
  employeeId?: string;
  status?:     LeaveStatus;
  fromDate?:   string;
  toDate?:     string;
  page?:       number;
  limit?:      number;
}

export function listLeaveTypes(companyId: string): Promise<LeaveType[]> {
  return apiFetch<LeaveType[]>(API.leaves.types(companyId));
}

export function createLeaveType(companyId: string, data: CreateLeaveTypeDto): Promise<LeaveType> {
  return apiFetch(API.leaves.createType(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateLeaveType(
  companyId: string,
  typeId:    string,
  data:      UpdateLeaveTypeDto,
): Promise<LeaveType> {
  return apiFetch(API.leaves.updateType(companyId, typeId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function deleteLeaveType(companyId: string, typeId: string): Promise<void> {
  return apiFetch(API.leaves.deleteType(companyId, typeId), { method: 'DELETE' });
}

export function listLeaves(
  companyId: string,
  params:    ListLeavesParams = {},
): Promise<PaginatedResponse<LeaveRequest>> {
  const query = new URLSearchParams();
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.status)     query.set('status',     params.status);
  if (params.fromDate)   query.set('fromDate',   params.fromDate);
  if (params.toDate)     query.set('toDate',     params.toDate);
  if (params.page)       query.set('page',       String(params.page));
  if (params.limit)      query.set('limit',      String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<LeaveRequest>>(
    `${API.leaves.list(companyId)}${qs ? `?${qs}` : ''}`,
  );
}

export function createLeave(companyId: string, data: CreateLeaveRequestDto): Promise<LeaveRequest> {
  return apiFetch(API.leaves.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function getLeaveSummary(companyId: string, employeeId: string): Promise<LeaveSummaryEntry[]> {
  return apiFetch<LeaveSummaryEntry[]>(API.leaves.summary(companyId, employeeId));
}

export function reviewLeave(
  companyId: string,
  leaveId:   string,
  data:      ReviewLeaveDto,
): Promise<LeaveRequest> {
  return apiFetch(API.leaves.review(companyId, leaveId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function cancelLeave(companyId: string, leaveId: string): Promise<LeaveRequest> {
  return apiFetch(API.leaves.cancel(companyId, leaveId), { method: 'POST' });
}
