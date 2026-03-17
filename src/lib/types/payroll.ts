export type ConceptCalcType  = 'FIXED' | 'PERCENT' | 'HOURLY' | 'MANUAL' | 'FORMULA';
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
  formula:      string | null;
  isActive:     boolean;
  sortOrder:    number;
  createdAt:    string;
  updatedAt:    string;
}

export interface FormulaValidationResult {
  valid:    boolean;
  preview?: number;
  error?:   string;
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

export interface PayslipSignature {
  id:        string;
  signedAt:  string;
  comment:   string | null;
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
  signature?:      PayslipSignature | null;
  run?:            Pick<PayrollRun, 'id' | 'status'> & { period?: Pick<PayrollPeriod, 'id' | 'name' | 'periodType' | 'startDate' | 'endDate'> };
}

export interface SignatureDetail {
  employeeId: string;
  firstName:  string;
  lastName:   string;
  signed:     boolean;
  signedAt:   string | null;
  comment:    string | null;
}

export interface SignaturesSummary {
  total:   number;
  signed:  number;
  pending: number;
  details: SignatureDetail[];
}

export interface PayslipLine {
  id:          string;
  payslipId:   string;
  conceptCode: string;
  conceptName: string;
  category:    ConceptCategory;
  amount:      string;
}

export interface CalculateRunResponse {
  jobId: string;
  status: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  failedReason: string | null;
}
