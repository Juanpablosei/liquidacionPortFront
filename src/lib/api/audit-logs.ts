import { apiFetch } from './client';
import { toPaginated } from './helpers';
import { API } from '@/lib/constants/api-endpoints';
import type { AuditLog, ListAuditLogsParams } from '@/lib/types/audit-log';
import type { PaginatedResponse } from '@/lib/types/api';

export function listAuditLogs(
  companyId: string,
  params:    ListAuditLogsParams = {},
): Promise<PaginatedResponse<AuditLog>> {
  const query = new URLSearchParams();
  if (params.page)     query.set('page',     String(params.page));
  if (params.limit)    query.set('limit',    String(params.limit));
  if (params.action)   query.set('action',   params.action);
  if (params.entity)   query.set('entity',   params.entity);
  if (params.userId)   query.set('userId',   params.userId);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate)   query.set('toDate',   params.toDate);
  const qs = query.toString();
  return apiFetch<unknown>(
    `${API.auditLogs.list(companyId)}${qs ? `?${qs}` : ''}`,
  ).then(toPaginated<AuditLog>);
}
