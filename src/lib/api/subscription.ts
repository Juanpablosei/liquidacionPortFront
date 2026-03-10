import { apiFetch } from './client';
import { API } from '../constants/api-endpoints';
import type { Subscription, Payment } from '../types/admin';

export function getCompanySubscription(companyId: string): Promise<Subscription> {
  return apiFetch<Subscription>(API.companySubscription.detail(companyId));
}

export function getCompanyPayments(companyId: string): Promise<Payment[]> {
  return apiFetch<Payment[]>(API.companySubscription.payments(companyId));
}
