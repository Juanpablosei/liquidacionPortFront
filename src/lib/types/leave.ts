export type LeaveTypeLct = 'SICKNESS' | 'MATERNITY' | 'MARRIAGE' | 'BEREAVEMENT' | 'EXAM' | 'BLOOD_DONATION' | 'MOVING' | 'UNPAID';
export type LeaveStatus  = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id:        string;
  companyId: string | null;
  name:      string;
  code:      string;
  isPaid:    boolean;
  maxDays:   number | null;
  isGlobal:  boolean;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id:          string;
  companyId:   string;
  employeeId:  string;
  leaveTypeId: string;
  startDate:   string;
  endDate:     string;
  days:        number;
  status:      LeaveStatus;
  reason:      string | null;
  reviewNote:  string | null;
  reviewedAt:  string | null;
  createdAt:   string;
  updatedAt:   string;
  employee?:   { firstName: string; lastName: string };
  leaveType?:  { name: string; isPaid: boolean };
}

export interface LeaveSummaryEntry {
  leaveTypeId:   string;
  leaveTypeName: string;
  isPaid:        boolean;
  usedDays:      number;
  maxDays:       number | null;
}
