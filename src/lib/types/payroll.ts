export type ConceptCalcType  = 'FIXED' | 'PERCENT' | 'HOURLY' | 'MANUAL';
export type ConceptCategory  = 'EARNING' | 'DEDUCTION';
export type PercentBase      = 'BASIC' | 'GROSS';
export type PayrollPeriodType = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'CUSTOM';
export type RunStatus        = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'CLOSED';

export interface PayrollConcept {
  id:           string;
  companyId:    string;
  code:         string;
  name:         string;
  category:     ConceptCategory;
  calcType:     ConceptCalcType;
  fixedAmount:  string | null;
  percentValue: string | null;
  percentBase:  PercentBase;
  hourlyRate:   string | null;
  isActive:     boolean;
  sortOrder:    number;
  createdAt:    string;
  updatedAt:    string;
}

export interface PayrollPeriod {
  id:         string;
  companyId:  string;
  periodType: PayrollPeriodType;
  startDate:  string;
  endDate:    string;
  name:       string | null;
  closedAt:   string | null;
  createdAt:  string;
  updatedAt:  string;
  runs?:      PayrollRun[];
}

export interface PayrollRun {
  id:        string;
  periodId:  string;
  status:    RunStatus;
  runAt:     string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id:              string;
  runId:           string;
  employeeId:      string;
  grossPay:        string;
  totalDeductions: string;
  netPay:          string;
  createdAt:       string;
  updatedAt:       string;
  employee?:       Pick<import('./employee').Employee, 'id' | 'firstName' | 'lastName' | 'documentNumber'>;
  lines?:          PayslipLine[];
}

export interface PayslipLine {
  id:          string;
  payslipId:   string;
  conceptCode: string;
  conceptName: string;
  category:    ConceptCategory;
  amount:      string;
}
