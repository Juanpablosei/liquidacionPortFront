export type VacationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface VacationBalance {
  employeeId:    string;
  employeeName:  string;
  entitledDays:  number;
  usedDays:      number;
  pendingDays:   number;
  availableDays: number;
  seniorityYears: number;
}

export interface VacationRequest {
  id:          string;
  companyId:   string;
  employeeId:  string;
  startDate:   string;
  endDate:     string;
  days:        number;
  status:      VacationStatus;
  reason:      string | null;
  reviewNote:  string | null;
  reviewedAt:  string | null;
  createdAt:   string;
  updatedAt:   string;
  employee?:   { firstName: string; lastName: string };
}
