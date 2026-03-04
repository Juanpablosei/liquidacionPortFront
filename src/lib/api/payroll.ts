import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type {
  PayrollPeriod,
  PayrollRun,
  Payslip,
  PayslipLine,
  PayrollPeriodType,
} from '@/lib/types/payroll';

// ─── helpers ────────────────────────────────────────────────────────────────

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.data))  return o.data  as T[];
  }
  return [];
}

function unwrapObject<T extends object>(raw: unknown, key: keyof T): T {
  const obj = raw as Record<string, unknown>;
  if (obj?.data && typeof obj.data === 'object' && key in (obj.data as object)) {
    return obj.data as T;
  }
  return raw as T;
}

// ─── DTOs ───────────────────────────────────────────────────────────────────

export interface CreatePeriodDto {
  periodType: PayrollPeriodType;
  startDate:  string;
  endDate:    string;
  name?:      string;
}

export interface CreateRunDto {
  periodId: string;
}

export interface PatchPayslipLineDto {
  amount: string;
}

// ─── Periods ────────────────────────────────────────────────────────────────

export function listPeriods(companyId: string): Promise<PayrollPeriod[]> {
  return apiFetch<unknown>(API.payroll.periods(companyId)).then((r) => toArray<PayrollPeriod>(r));
}

export function createPeriod(companyId: string, data: CreatePeriodDto): Promise<PayrollPeriod> {
  return apiFetch<unknown>(API.payroll.periods(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<PayrollPeriod>(r, 'id'));
}

// ─── Runs ────────────────────────────────────────────────────────────────────

export function listRuns(companyId: string, periodId?: string): Promise<PayrollRun[]> {
  const qs = periodId ? `?periodId=${periodId}` : '';
  return apiFetch<unknown>(`${API.payroll.runs(companyId)}${qs}`).then((r) => toArray<PayrollRun>(r));
}

export function createRun(companyId: string, data: CreateRunDto): Promise<PayrollRun> {
  return apiFetch<unknown>(API.payroll.runs(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<PayrollRun>(r, 'id'));
}

export function getRun(companyId: string, runId: string): Promise<PayrollRun> {
  return apiFetch<unknown>(API.payroll.run(companyId, runId)).then((r) => unwrapObject<PayrollRun>(r, 'id'));
}

export function calculateRun(companyId: string, runId: string): Promise<PayrollRun> {
  return apiFetch<unknown>(API.payroll.calculate(companyId, runId), {
    method: 'POST',
  }).then((r) => unwrapObject<PayrollRun>(r, 'id'));
}

export function closeRun(companyId: string, runId: string): Promise<PayrollRun> {
  return apiFetch<unknown>(API.payroll.close(companyId, runId), {
    method: 'POST',
  }).then((r) => unwrapObject<PayrollRun>(r, 'id'));
}

// ─── Payslips ────────────────────────────────────────────────────────────────

export function listPayslips(companyId: string, runId: string): Promise<Payslip[]> {
  return apiFetch<unknown>(API.payroll.payslips(companyId, runId)).then((r) => toArray<Payslip>(r));
}

export function getPayslip(companyId: string, runId: string, payslipId: string): Promise<Payslip> {
  return apiFetch<unknown>(API.payroll.payslip(companyId, runId, payslipId)).then((r) => unwrapObject<Payslip>(r, 'id'));
}

export function patchPayslipLine(
  companyId:  string,
  runId:      string,
  payslipId:  string,
  lineId:     string,
  data:       PatchPayslipLineDto,
): Promise<PayslipLine> {
  return apiFetch<unknown>(API.payroll.patchLine(companyId, runId, payslipId, lineId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  }).then((r) => unwrapObject<PayslipLine>(r, 'id'));
}

export async function exportPayslipsCsv(companyId: string, runId: string): Promise<Blob> {
  const blob = await apiFetch<Blob>(API.payroll.exportCsv(companyId, runId));
  return blob;
}
