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
  email: string;
  role:  Exclude<CompanyRole, 'OWNER'>;
}

export interface UpdateMemberDto {
  role: CompanyRole;
}

export function listCompanies(): Promise<Company[]> {
  return apiFetch(API.companies.list);
}

export function createCompany(data: CreateCompanyDto): Promise<Company> {
  return apiFetch(API.companies.create, {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function getCompany(id: string): Promise<Company> {
  return apiFetch(API.companies.detail(id));
}

export function updateCompany(id: string, data: UpdateCompanyDto): Promise<Company> {
  return apiFetch(API.companies.update(id), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function listMembers(companyId: string): Promise<CompanyUser[]> {
  return apiFetch(API.companies.members(companyId));
}

export function addMember(companyId: string, data: AddMemberDto): Promise<CompanyUser> {
  return apiFetch(API.companies.members(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateMember(
  companyId: string,
  userId:    string,
  data:      UpdateMemberDto,
): Promise<CompanyUser> {
  return apiFetch(API.companies.member(companyId, userId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
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
  return apiFetch(API.companies.transferOwnership(companyId), {
    method: 'POST',
    body:   JSON.stringify({ newOwnerUserId }),
  });
}
