export type OvertimeType = 'OT_50' | 'OT_100';

export interface Attendance {
  id:            string;
  employeeId:    string;
  date:          string;
  clockIn:       string | null;
  clockOut:      string | null;
  workedMinutes: number | null;
  notes:         string | null;
  createdAt:     string;
  updatedAt:     string;
  employee?:     { firstName: string; lastName: string };
}

export interface OvertimeEntry {
  id:           string;
  employeeId:   string;
  date:         string;
  overtimeType: OvertimeType;
  minutes:      number;
  notes:        string | null;
  createdAt:    string;
  updatedAt:    string;
  employee?:    { firstName: string; lastName: string };
}

export interface Holiday {
  id:         string;
  companyId:  string;
  date:       string;
  name:       string;
  isOptional: boolean;
  createdAt:  string;
  updatedAt:  string;
}
