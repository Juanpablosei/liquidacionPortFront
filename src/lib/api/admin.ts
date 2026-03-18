import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type {
  SubscriptionPlan,
  Subscription,
  Payment,
  DashboardMetrics,
  AdminCompany,
  BackupFile,
  AdminPaymentProof,
} from '@/lib/types/admin';
import type { PaginatedResponse } from '@/lib/types/api';
import type {
  CreatePlanInput,
  UpdatePlanInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  CreatePaymentInput,
} from '@/lib/validators/admin';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>(API.admin.dashboard);
}

// ─── Companies ────────────────────────────────────────────────────────────────

export interface ListAdminCompaniesParams {
  page?:   number;
  limit?:  number;
  status?: string;
  planId?: string;
}

export function listAdminCompanies(
  params: ListAdminCompaniesParams = {},
): Promise<PaginatedResponse<AdminCompany>> {
  const query = new URLSearchParams();
  if (params.page !== undefined)  query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.status)              query.set('status', params.status);
  if (params.planId)              query.set('planId', params.planId);
  const qs = query.toString();
  return apiFetch<PaginatedResponse<AdminCompany>>(
    `${API.admin.companies}${qs ? `?${qs}` : ''}`,
  );
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export function listPlans(): Promise<SubscriptionPlan[]> {
  return apiFetch<SubscriptionPlan[]>(API.admin.plans);
}

export function getPlan(id: string): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(API.admin.plan(id));
}

export function createPlan(data: CreatePlanInput): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(API.admin.plans, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updatePlan(id: string, data: UpdatePlanInput): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(API.admin.plan(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deletePlan(id: string): Promise<void> {
  return apiFetch<void>(API.admin.plan(id), { method: 'DELETE' });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface ListSubscriptionsParams {
  page?:  number;
  limit?: number;
}

export function listSubscriptions(
  params: ListSubscriptionsParams = {},
): Promise<PaginatedResponse<Subscription>> {
  const query = new URLSearchParams();
  if (params.page !== undefined)  query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<Subscription>>(
    `${API.admin.subscriptions}${qs ? `?${qs}` : ''}`,
  );
}

export function getSubscription(id: string): Promise<Subscription> {
  return apiFetch<Subscription>(API.admin.subscription(id));
}

export function createSubscription(data: CreateSubscriptionInput): Promise<Subscription> {
  return apiFetch<Subscription>(API.admin.subscriptions, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateSubscription(id: string, data: UpdateSubscriptionInput): Promise<Subscription> {
  return apiFetch<Subscription>(API.admin.subscription(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function listPayments(subscriptionId: string): Promise<Payment[]> {
  return apiFetch<Payment[]>(API.admin.payments(subscriptionId));
}

export function createPayment(subscriptionId: string, data: CreatePaymentInput): Promise<Payment> {
  return apiFetch<Payment>(API.admin.payments(subscriptionId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deletePayment(subscriptionId: string, paymentId: string): Promise<void> {
  return apiFetch<void>(API.admin.payment(subscriptionId, paymentId), {
    method: 'DELETE',
  });
}

// ─── Company self-service subscription ────────────────────────────────────────

export function getCompanySubscription(companyId: string): Promise<Subscription & { usage: { currentEmployees: number; maxEmployees: number } }> {
  return apiFetch(API.companySubscription.detail(companyId));
}

export function getCompanyPayments(companyId: string): Promise<Payment[]> {
  return apiFetch<Payment[]>(API.companySubscription.payments(companyId));
}

// ─── Backups ─────────────────────────────────────────────────────────────────

export function listBackups(): Promise<BackupFile[]> {
  return apiFetch<BackupFile[]>(API.admin.backups);
}

export function createManualBackup(): Promise<BackupFile> {
  return apiFetch<BackupFile>(API.admin.backups, { method: 'POST' });
}

// ── Payment Proofs ───────────────────────────────────────────────────────────

export function listPaymentProofs(params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<AdminPaymentProof>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<AdminPaymentProof>>(`${API.admin.paymentProofs}${qs ? `?${qs}` : ''}`);
}

export function getPaymentProof(id: string): Promise<AdminPaymentProof> {
  return apiFetch<AdminPaymentProof>(API.admin.paymentProof(id));
}

export function approvePaymentProof(id: string): Promise<AdminPaymentProof> {
  return apiFetch<AdminPaymentProof>(API.admin.paymentProofApprove(id), { method: 'POST' });
}

export function rejectPaymentProof(id: string, reason: string): Promise<AdminPaymentProof> {
  return apiFetch<AdminPaymentProof>(API.admin.paymentProofReject(id), {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function getPaymentProofsPendingCount(): Promise<number> {
  return apiFetch<PaginatedResponse<AdminPaymentProof>>(`${API.admin.paymentProofs}?status=PENDING&limit=1`)
    .then((res) => res.total);
}
