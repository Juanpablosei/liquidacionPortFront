export interface AuditLog {
  id:        string;
  userId:    string;
  companyId: string | null;
  action:    string;
  entity:    string;
  entityId:  string | null;
  details:   Record<string, unknown> | null;
  ip:        string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ListAuditLogsParams {
  page?:     number;
  limit?:    number;
  action?:   string;
  entity?:   string;
  userId?:   string;
  fromDate?: string;
  toDate?:   string;
}
