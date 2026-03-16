import { apiFetch } from './client';
import { toPaginated } from './helpers';
import { API } from '@/lib/constants/api-endpoints';
import type { Union, UnionMembership, UnionDashboard } from '@/lib/types/union';
import type { PaginatedResponse } from '@/lib/types/api';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateUnionDto {
  name:         string;
  code:         string;
  duesType:     string;
  duesValue:    number;
  description?: string;
}

export interface UpdateUnionDto {
  name?:        string;
  code?:        string;
  duesType?:    string;
  duesValue?:   number;
  description?: string;
  isActive?:    boolean;
}

export interface ListUnionsParams {
  page?:     number;
  limit?:    number;
  search?:   string;
  isActive?: boolean;
}

export interface ListUnionMembersParams {
  page?:       number;
  limit?:      number;
  activeOnly?: boolean;
}

export interface AddMemberDto {
  employeeId: string;
  startDate:  string;
}

export interface RemoveMemberDto {
  endDate: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function getUnionsDashboard(companyId: string): Promise<UnionDashboard> {
  return apiFetch(API.unions.dashboard(companyId));
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function listUnions(
  companyId: string,
  params:    ListUnionsParams = {},
): Promise<PaginatedResponse<Union>> {
  const query = new URLSearchParams();
  if (params.page  !== undefined) query.set('page',  String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.search)              query.set('search', params.search);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  const qs = query.toString();
  return apiFetch<unknown>(
    `${API.unions.list(companyId)}${qs ? `?${qs}` : ''}`,
  ).then(toPaginated<Union>);
}

export function getUnion(companyId: string, unionId: string): Promise<Union> {
  return apiFetch(API.unions.detail(companyId, unionId));
}

export function createUnion(companyId: string, data: CreateUnionDto): Promise<Union> {
  return apiFetch(API.unions.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateUnion(
  companyId: string,
  unionId:  string,
  data:     UpdateUnionDto,
): Promise<Union> {
  return apiFetch(API.unions.update(companyId, unionId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function deleteUnion(companyId: string, unionId: string): Promise<void> {
  return apiFetch(API.unions.delete(companyId, unionId), {
    method: 'DELETE',
  });
}

// ─── Members ──────────────────────────────────────────────────────────────────

export function listUnionMembers(
  companyId: string,
  unionId:  string,
  params:   ListUnionMembersParams = {},
): Promise<PaginatedResponse<UnionMembership>> {
  const query = new URLSearchParams();
  if (params.page  !== undefined) query.set('page',  String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.activeOnly !== undefined) query.set('activeOnly', String(params.activeOnly));
  const qs = query.toString();
  return apiFetch<unknown>(
    `${API.unions.members(companyId, unionId)}${qs ? `?${qs}` : ''}`,
  ).then(toPaginated<UnionMembership>);
}

export function addUnionMember(
  companyId: string,
  unionId:  string,
  data:     AddMemberDto,
): Promise<UnionMembership> {
  return apiFetch(API.unions.addMember(companyId, unionId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function removeUnionMember(
  companyId: string,
  unionId:  string,
  memberId: string,
  data:     RemoveMemberDto,
): Promise<UnionMembership> {
  return apiFetch(API.unions.removeMember(companyId, unionId, memberId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}
