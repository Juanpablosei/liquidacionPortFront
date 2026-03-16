// ─── Bracket Rules (seniority-based rules stored as JSON) ─────────────────────

export interface BracketRule {
  minYears: number;
  maxYears: number;
}

export interface SeniorityBonusRule extends BracketRule {
  percentPerYear: number; // 0–100
}

export interface VacationRule extends BracketRule {
  days: number; // >= 0
}

export interface SickLeaveRule extends BracketRule {
  days: number; // >= 0
}

// ─── Convenio Category ────────────────────────────────────────────────────────

export interface ConvenioCategory {
  id:         string;
  convenioId: string;
  code:       string;
  name:       string;
  baseSalary: string;  // Decimal comes as string from API
  hourlyRate: string;  // Decimal comes as string from API
  sortOrder:  number;
  createdAt:  string;
  updatedAt:  string;
}

// ─── Convenio ─────────────────────────────────────────────────────────────────

export interface Convenio {
  id:                  string;
  companyId:           string | null; // null = global
  code:                string;
  name:                string;
  seniorityBonusRules: SeniorityBonusRule[] | null;
  vacationRules:       VacationRule[] | null;
  sickLeaveRules:      SickLeaveRule[] | null;
  clonedFromId:        string | null;
  isActive:            boolean;
  expirationDate:      string | null;
  daysRemaining?:      number;      // populated by GET /convenios/expiring
  createdAt:           string;
  updatedAt:           string;
  categories:          ConvenioCategory[];
}

// ─── Company convenios response (own + global) ────────────────────────────────

export interface CompanyConveniosResponse {
  own:    Convenio[];
  global: Convenio[];
}

// ─── Convenio Upload (AI extraction) ──────────────────────────────────────────

export interface ConvenioUploadResponse {
  name: string;
  description: string;
  validFrom: string | null;
  validTo: string | null;
  seniorityRules: { minYears: number; maxYears: number | null; percentage: number }[];
  vacationDays: number | null;
  sickLeaveDays: number | null;
  categories: { code: string; name: string; baseSalary: number }[];
  confidence: number; // 0-1
  rawNotes: string;
  sourceFile: string;
}

export interface ConfirmUploadInput {
  name: string;
  description: string;
  validFrom?: string;
  validTo?: string;
  seniorityRules?: { minYears: number; maxYears: number | null; percentage: number }[];
  vacationDays?: number;
  sickLeaveDays?: number;
  categories?: { code: string; name: string; baseSalary: number }[];
  sourceFile: string;
}
