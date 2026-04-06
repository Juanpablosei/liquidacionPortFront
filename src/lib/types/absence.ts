export type AbsenceType   = 'UNJUSTIFIED' | 'JUSTIFIED' | 'NOTIFIED';
export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Absence {
  id:         string;
  companyId:  string;
  employeeId: string;
  date:       string;
  type:       AbsenceType;
  status:     AbsenceStatus;
  reason:     string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt:  string;
  updatedAt:  string;
  employee?:  { firstName: string; lastName: string };
}

export interface AbsenteeismReportEntry {
  employeeId:    string;
  employeeName:  string;
  totalAbsences: number;
  justified:     number;
  unjustified:   number;
  notified:      number;
}
