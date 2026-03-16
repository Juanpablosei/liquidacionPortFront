import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type {
  Convenio,
  ConvenioCategory,
  CompanyConveniosResponse,
} from '@/lib/types/convenio';
import type {
  CreateConvenioInput,
  UpdateConvenioInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  AssignConvenioInput,
} from '@/lib/validators/convenio';

// ─── Company-scoped ───────────────────────────────────────────────────────────

export function listCompanyConvenios(
  companyId: string,
  options?: { includeExpired?: boolean },
): Promise<CompanyConveniosResponse> {
  const params = new URLSearchParams();
  if (options?.includeExpired) params.set('includeExpired', 'true');
  const qs = params.toString();
  const url = qs ? `${API.convenios.list(companyId)}?${qs}` : API.convenios.list(companyId);
  return apiFetch<CompanyConveniosResponse>(url);
}

export function getExpiringConvenios(companyId: string): Promise<Convenio[]> {
  return apiFetch<Convenio[]>(API.convenios.expiring(companyId));
}

export function createConvenio(companyId: string, data: CreateConvenioInput): Promise<Convenio> {
  return apiFetch<Convenio>(API.convenios.create(companyId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateConvenio(
  companyId: string,
  id: string,
  data: UpdateConvenioInput,
): Promise<Convenio> {
  return apiFetch<Convenio>(API.convenios.update(companyId, id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteConvenio(companyId: string, id: string): Promise<void> {
  return apiFetch<void>(API.convenios.delete(companyId, id), { method: 'DELETE' });
}

export function cloneConvenio(companyId: string, id: string): Promise<Convenio> {
  return apiFetch<Convenio>(API.convenios.clone(companyId, id), { method: 'POST' });
}

// ─── Categories (company-scoped) ──────────────────────────────────────────────

export function addCategory(
  companyId: string,
  convenioId: string,
  data: CreateCategoryInput,
): Promise<ConvenioCategory> {
  return apiFetch<ConvenioCategory>(API.convenios.addCategory(companyId, convenioId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCategory(
  companyId: string,
  categoryId: string,
  data: UpdateCategoryInput,
): Promise<ConvenioCategory> {
  return apiFetch<ConvenioCategory>(API.convenios.updateCategory(companyId, categoryId), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteCategory(companyId: string, categoryId: string): Promise<void> {
  return apiFetch<void>(API.convenios.deleteCategory(companyId, categoryId), {
    method: 'DELETE',
  });
}

// ─── Assign to employee ──────────────────────────────────────────────────────

export function assignConvenio(
  companyId: string,
  employeeId: string,
  data: AssignConvenioInput,
): Promise<void> {
  return apiFetch<void>(API.convenios.assign(companyId, employeeId), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─── Admin (global convenios) ─────────────────────────────────────────────────

export function listAdminConvenios(): Promise<Convenio[]> {
  return apiFetch<Convenio[]>(API.adminConvenios.list);
}

export function createAdminConvenio(data: CreateConvenioInput): Promise<Convenio> {
  return apiFetch<Convenio>(API.adminConvenios.create, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAdminConvenio(id: string, data: UpdateConvenioInput): Promise<Convenio> {
  return apiFetch<Convenio>(API.adminConvenios.update(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteAdminConvenio(id: string): Promise<void> {
  return apiFetch<void>(API.adminConvenios.delete(id), { method: 'DELETE' });
}

export function addAdminCategory(
  convenioId: string,
  data: CreateCategoryInput,
): Promise<ConvenioCategory> {
  return apiFetch<ConvenioCategory>(API.adminConvenios.addCategory(convenioId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAdminCategory(
  categoryId: string,
  data: UpdateCategoryInput,
): Promise<ConvenioCategory> {
  return apiFetch<ConvenioCategory>(API.adminConvenios.updateCategory(categoryId), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteAdminCategory(categoryId: string): Promise<void> {
  return apiFetch<void>(API.adminConvenios.deleteCategory(categoryId), {
    method: 'DELETE',
  });
}
