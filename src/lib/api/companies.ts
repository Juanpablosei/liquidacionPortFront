import { apiFetch } from './client';
import { toArray, unwrapObject } from './helpers';
import { API } from '@/lib/constants/api-endpoints';
import type { Company, CompanyUser, CompanyRole } from '@/lib/types/company';
import type { SubscriptionPlan, PaymentProof } from '@/lib/types/admin';

export interface CreateCompanyDto {
  name:      string;
  taxId?:    string;
  address?:  string;
  phone?:    string;
  planCode?: string;
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

export function leaveCompany(companyId: string): Promise<void> {
  return apiFetch(API.companies.leaveCompany(companyId), {
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

// ─── Public Plans ───────────────────────────────────────────────────────────

export function getPublicPlans(): Promise<SubscriptionPlan[]> {
  return apiFetch<SubscriptionPlan[]>(API.plans.list);
}

// ─── Payment Proofs ─────────────────────────────────────────────────────────

export function uploadPaymentProof(companyId: string, file: File, notes?: string): Promise<{ id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (notes) formData.append('notes', notes);
  return apiFetch(API.companySubscription.paymentProof(companyId), {
    method: 'POST',
    body: formData,
  });
}

export function listPaymentProofs(companyId: string): Promise<PaymentProof[]> {
  return apiFetch<PaymentProof[]>(API.companySubscription.paymentProofs(companyId));
}
