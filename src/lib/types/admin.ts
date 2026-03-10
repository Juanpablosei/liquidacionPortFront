// ─── Subscription Enums ───────────────────────────────────────────────────────

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'BLOCKED' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

// ─── Plan ─────────────────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id:              string;
  code:            string;
  name:            string;
  maxEmployees:    number;
  monthlyPrice:    string; // Decimal from API
  annualPrice:     string; // Decimal from API
  trialDays:       number;
  gracePeriodDays: number;
  isCustom:        boolean;
  isActive:        boolean;
  createdAt:       string;
  updatedAt:       string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id:             string;
  subscriptionId: string;
  amount:         string; // Decimal from API
  periodStart:    string;
  periodEnd:      string;
  paidAt:         string;
  notes:          string | null;
  recordedBy:     string;
  createdAt:      string;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface Subscription {
  id:                 string;
  companyId:          string;
  planId:             string;
  billingCycle:       BillingCycle;
  status:             SubscriptionStatus;
  effectivePrice:     string; // Decimal from API
  trialEndsAt:        string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd:   string | null;
  blockedAt:          string | null;
  cancelledAt:        string | null;
  notes:              string | null;
  createdAt:          string;
  updatedAt:          string;
  plan?:              SubscriptionPlan;
  company?:           { id: string; name: string };
  payments?:          Payment[];
}

// ─── Admin Company (from /admin/companies) ────────────────────────────────────

export interface AdminCompany {
  id:        string;
  name:      string;
  taxId:     string | null;
  address:   string | null;
  phone:     string | null;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
  subscription: {
    id:             string;
    status:         SubscriptionStatus;
    billingCycle:   BillingCycle;
    effectivePrice: string;
    currentPeriodEnd: string | null;
    plan: { code: string; name: string };
  } | null;
  _count: { employees: number };
}

// ─── Dashboard Metrics ────────────────────────────────────────────────────────

export interface DashboardMetrics {
  companies: {
    total:    number;
    active:   number;
    inactive: number;
  };
  employees: {
    total:    number;
    active:   number;
    inactive: number;
  };
  subscriptions: {
    total:    number;
    byStatus: Record<string, number>;
    byPlan:   Array<{ planId: string; planName: string; count: number }>;
  };
  revenue: {
    currentMonth:  number;
    previousMonth: number;
    growth:        number; // percentage
  };
  recentPayments: Array<Payment & { subscription: { company: { id: string; name: string } } }>;
  expiringSoon:   Array<Subscription & { company: { id: string; name: string }; plan: SubscriptionPlan }>;
}
