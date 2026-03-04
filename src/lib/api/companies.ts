import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { Company, CompanyUser, CompanyRole } from '@/lib/types/company';

export interface CreateCompanyDto {
  name:     string;
  taxId?:   string;
  address?: string;
  phone?:   string;
}

export interface UpdateCompanyDto {
  name?:    string;
  taxId?:   string;
  address?: string;
  phone?:   string;
}

export interface AddMemberDto {
  userId: string;
  role:   Exclude<CompanyRole, 'OWNER'>;
}

export interface UpdateMemberDto {
  role: CompanyRole;
}

/** Backend puede devolver T[] o { items: T[] } o { data: T[] }; normalizamos a array. */
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.data)) return o.data as T[];
  }
  return [];
}

/** Backend devuelve doble anidación para objetos individuales: apiFetch retorna data; el objeto real está en data.data. */
function unwrapObject<T extends object>(raw: unknown, key: keyof T): T {
  const obj = raw as Record<string, unknown>;
  if (obj?.data && typeof obj.data === 'object' && key in (obj.data as object)) {
    return obj.data as T;
  }
  return raw as T;
}

export function listCompanies(): Promise<Company[]> {
  return apiFetch<Company[] | { items?: Company[]; data?: Company[] }>(API.companies.list).then((r) => toArray<Company>(r));
}

export function createCompany(data: CreateCompanyDto): Promise<Company> {
  return apiFetch<unknown>(API.companies.create, {
    method: 'POST',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<Company>(r, 'id'));
}

export function getCompany(id: string): Promise<Company> {
  return apiFetch<unknown>(API.companies.detail(id)).then((r) => unwrapObject<Company>(r, 'id'));
}

export function updateCompany(id: string, data: UpdateCompanyDto): Promise<Company> {
  return apiFetch<unknown>(API.companies.update(id), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<Company>(r, 'id'));
}

export function listMembers(companyId: string): Promise<CompanyUser[]> {
  return apiFetch<CompanyUser[] | { items?: CompanyUser[]; data?: CompanyUser[] }>(API.companies.members(companyId)).then((r) => toArray<CompanyUser>(r));
}

export function addMember(companyId: string, data: AddMemberDto): Promise<CompanyUser> {
  return apiFetch<unknown>(API.companies.members(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<CompanyUser>(r, 'id'));
}

export function updateMember(
  companyId: string,
  userId:    string,
  data:      UpdateMemberDto,
): Promise<CompanyUser> {
  return apiFetch<unknown>(API.companies.member(companyId, userId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<CompanyUser>(r, 'id'));
}

export function removeMember(companyId: string, userId: string): Promise<void> {
  return apiFetch(API.companies.member(companyId, userId), {
    method: 'DELETE',
  });
}

export function transferOwnership(
  companyId:      string,
  newOwnerUserId: string,
): Promise<Company> {
  return apiFetch<unknown>(API.companies.transferOwnership(companyId), {
    method: 'POST',
    body:   JSON.stringify({ newOwnerUserId }),
  }).then((r) => unwrapObject<Company>(r, 'id'));
}
