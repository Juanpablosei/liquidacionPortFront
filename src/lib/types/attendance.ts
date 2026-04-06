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

export type IncidentType   = 'ABSENCE' | 'DEFICIT' | 'SURPLUS' | 'UNSCHEDULED_ATTENDANCE';
export type IncidentStatus = 'PENDING' | 'ACKNOWLEDGED' | 'DISMISSED';

export interface AttendanceIncident {
  id:              string;
  companyId:       string;
  employeeId:      string;
  date:            string;
  type:            IncidentType;
  status:          IncidentStatus;
  expectedMinutes: number | null;
  actualMinutes:   number | null;
  deltaMinutes:    number | null;
  notes:           string | null;
  reviewNote:      string | null;
  reviewedAt:      string | null;
  createdAt:       string;
  updatedAt:       string;
  employee?:       { firstName: string; lastName: string };
}

export interface IncidentSummary {
  ABSENCE:                number;
  DEFICIT:                number;
  SURPLUS:                number;
  UNSCHEDULED_ATTENDANCE: number;
  PENDING:                number;
  ACKNOWLEDGED:           number;
  DISMISSED:              number;
}
