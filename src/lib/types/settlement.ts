export type SettlementReason = 'DISMISSAL' | 'RESIGNATION';

export interface RuleBracket {
  minYears: number;
  maxYears: number;
  days:     number;
}

export interface SettlementConfig {
  id:                   string;
  companyId:            string;
  noticePeriodRules:    RuleBracket[];
  severanceDaysPerYear: number;
  vacationRules:        RuleBracket[];
  createdAt:            string;
  updatedAt:            string;
}

export interface UpdateSettlementConfigInput {
  noticePeriodRules?:    RuleBracket[];
  severanceDaysPerYear?: number;
  vacationRules?:        RuleBracket[];
}

export interface SettlementLine {
  conceptCode: string;
  conceptName: string;
  category:    'EARNING' | 'DEDUCTION';
  amount:      string;
}

export interface Settlement {
  id:               string;
  companyId:        string;
  employeeId:       string;
  reason:           SettlementReason;
  terminationDate:  string;
  hireDateSnapshot: string;
  seniorityYears:   number;
  seniorityMonths:  number;
  seniorityDays:    number;
  dailySalary:      string;
  runId:            string;
  createdAt:        string;
  run?: {
    payslips?: Array<{
      grossPay:        string;
      totalDeductions: string;
      netPay:          string;
      lines?:          SettlementLine[];
    }>;
  };
}

export interface CreateSettlementInput {
  reason:          SettlementReason;
  terminationDate: string;
}
