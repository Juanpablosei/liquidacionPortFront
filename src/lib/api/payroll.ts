import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type {
  PayrollPeriod,
  PayrollRun,
  Payslip,
  PayslipLine,
  PayrollPeriodType,
  SignaturesSummary,
} from '@/lib/types/payroll';
import type { PaginatedResponse } from '@/lib/types/api';

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

export interface ListPayslipsParams {
  page?:       number;
  limit?:      number;
  employeeId?: string;
}

export function listPayslips(
  companyId: string,
  runId:     string,
  params:    ListPayslipsParams = {},
): Promise<Payslip[]> {
  const query = new URLSearchParams();
  if (params.page)       query.set('page',       String(params.page));
  if (params.limit)      query.set('limit',      String(params.limit));
  if (params.employeeId) query.set('employeeId', params.employeeId);
  const qs = query.toString();
  return apiFetch<unknown>(`${API.payroll.payslips(companyId, runId)}${qs ? `?${qs}` : ''}`).then((r) => toArray<Payslip>(r));
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

export function getPayslipSignatures(companyId: string, runId: string): Promise<SignaturesSummary> {
  return apiFetch<unknown>(API.payroll.signatures(companyId, runId)).then(
    (r) => unwrapObject<SignaturesSummary>(r, 'total'),
  );
}

export async function exportPayslipsCsv(companyId: string, runId: string): Promise<Blob> {
  const blob = await apiFetch<Blob>(API.payroll.exportCsv(companyId, runId));
  return blob;
}

export async function exportPayslipsPdf(companyId: string, runId: string): Promise<Blob> {
  return apiFetch<Blob>(API.payroll.exportPdf(companyId, runId));
}

export async function exportPayslipPdf(companyId: string, runId: string, payslipId: string): Promise<Blob> {
  return apiFetch<Blob>(API.payroll.payslipPdf(companyId, runId, payslipId));
}

// ─── helpers (paginated) ─────────────────────────────────────────────────────

function toPaginated<T>(raw: unknown): PaginatedResponse<T> {
  const obj =
    raw && typeof raw === 'object' && 'items' in (raw as object)
      ? raw
      : raw && typeof raw === 'object' && 'data' in (raw as object)
        ? (raw as { data: unknown }).data
        : raw;
  const o = (obj && typeof obj === 'object' ? obj : {}) as Record<string, unknown>;
  const items = Array.isArray(o.items) ? (o.items as T[]) : [];
  return {
    items,
    total:  Number(o.total ?? items.length),
    page:   Number(o.page ?? 1),
    limit:  Number(o.limit ?? 20),
    pages:  Number(o.pages ?? 1),
  };
}

// ─── Cross-Run Payslips (admin/manager view) ────────────────────────────────

export interface ListCrossRunPayslipsParams {
  page?:       number;
  limit?:      number;
  employeeId?: string;
  fromDate?:   string;
  toDate?:     string;
}

export function listCrossRunPayslips(
  companyId: string,
  params: ListCrossRunPayslipsParams = {},
): Promise<PaginatedResponse<Payslip>> {
  const query = new URLSearchParams();
  if (params.page       !== undefined) query.set('page',       String(params.page));
  if (params.limit      !== undefined) query.set('limit',      String(params.limit));
  if (params.employeeId)               query.set('employeeId', params.employeeId);
  if (params.fromDate)                 query.set('fromDate',   params.fromDate);
  if (params.toDate)                   query.set('toDate',     params.toDate);
  const qs = query.toString();
  return apiFetch<unknown>(
    `${API.payroll.crossRunPayslips(companyId)}${qs ? `?${qs}` : ''}`,
  ).then(toPaginated<Payslip>);
}

// ─── My Payslips (employee portal) ──────────────────────────────────────────

export interface ListMyPayslipsParams {
  page?:  number;
  limit?: number;
}

export function listMyPayslips(
  companyId: string,
  params: ListMyPayslipsParams = {},
): Promise<PaginatedResponse<Payslip>> {
  const query = new URLSearchParams();
  if (params.page  !== undefined) query.set('page',  String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<unknown>(
    `${API.myPayslips.list(companyId)}${qs ? `?${qs}` : ''}`,
  ).then(toPaginated<Payslip>);
}

export function getMyPayslip(companyId: string, payslipId: string): Promise<Payslip> {
  return apiFetch<unknown>(API.myPayslips.detail(companyId, payslipId)).then((r) => unwrapObject<Payslip>(r, 'id'));
}

export function signPayslip(companyId: string, payslipId: string, comment?: string): Promise<Payslip> {
  return apiFetch<unknown>(API.myPayslips.sign(companyId, payslipId), {
    method: 'POST',
    body:   JSON.stringify(comment ? { comment } : {}),
  }).then((r) => unwrapObject<Payslip>(r, 'id'));
}
