export type SalaryType = 'MONTHLY' | 'HOURLY';

export interface Employee {
  id:              string;
  companyId:       string;
  documentType:    string;
  documentNumber:  string;
  firstName:       string;
  lastName:        string;
  email:           string | null;
  phone:           string | null;
  birthDate:       string | null;
  hireDate:        string;
  terminationDate: string | null;
  isActive:        boolean;
  convenioId?:         string | null;
  convenioCategoryId?: string | null;
  convenioName?:       string | null;
  convenioCategoryName?: string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface Contract {
  id:             string;
  employeeId:     string;
  startDate:      string;
  endDate:        string | null;
  salaryType:     SalaryType;
  salaryAmount:   string | null;
  createdAt:      string;
  updatedAt:      string;
  weeklySchedule?: ContractScheduleEntry[];
}

export interface ContractScheduleEntry {
  id:           string;
  contractId:   string;
  weekday:      number;
  startTime:    string;
  endTime:      string;
  breakMinutes: number;
}
