export type ShiftDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface ShiftScheduleEntry {
  day:          ShiftDay;
  startTime:    string;
  endTime:      string;
  breakMinutes: number;
}

export interface Shift {
  id:          string;
  companyId:   string;
  name:        string;
  description: string | null;
  schedule:    ShiftScheduleEntry[];
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}
