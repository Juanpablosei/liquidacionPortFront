import { z } from 'zod';
import type { Translations } from '@/lib/i18n/es';

const holidayNameRegex = /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ0-9\s.,;:()'-]+$/;

type V = Translations['validators'];

export function attendanceSchema(v: V) {
  return z.object({
    employeeId: z.string().min(1, v.selectEmployee),
    date:       z.string().min(1, v.dateRequired),
    clockIn:    z.string().optional().or(z.literal('')),
    clockOut:   z.string().optional().or(z.literal('')),
    notes:      z.string().max(500).optional().or(z.literal('')),
  }).refine((data) => {
    if (data.clockIn && data.clockOut) {
      return data.clockOut > data.clockIn;
    }
    return true;
  }, {
    message: v.exitAfterEntry,
    path: ['clockOut'],
  });
}

export function overtimeSchema(v: V) {
  return z.object({
    employeeId:   z.string().min(1, v.selectEmployee),
    date:         z.string().min(1, v.dateRequired),
    overtimeType: z.enum(['OT_50', 'OT_100'], { message: v.selectType }),
    minutes:      z.number().int().min(1, v.minutesMin).max(720, v.minutesMax),
    notes:        z.string().max(500).optional().or(z.literal('')),
  });
}

export function holidaySchema(v: V) {
  return z.object({
    date:       z.string().min(1, v.dateRequired),
    name:       z.string().min(1, v.nameRequired).max(200).regex(holidayNameRegex, v.nameInvalidChars),
    isOptional: z.boolean(),
  });
}

export type AttendanceInput = z.infer<ReturnType<typeof attendanceSchema>>;
export type OvertimeInput   = z.infer<ReturnType<typeof overtimeSchema>>;
export type HolidayInput    = z.infer<ReturnType<typeof holidaySchema>>;

export function shiftSchema(v: V) {
  return z.object({
    name:        z.string().min(1, v.nameRequired).max(100),
    description: z.string().max(500).optional().or(z.literal('')),
  });
}

export function absenceSchema(v: V) {
  return z.object({
    employeeId: z.string().min(1, v.selectEmployee),
    date:       z.string().min(1, v.dateRequired),
    type:       z.enum(['UNJUSTIFIED', 'JUSTIFIED', 'NOTIFIED'], { message: v.selectType }),
    reason:     z.string().max(500).optional().or(z.literal('')),
  });
}

export function vacationRequestSchema(v: V) {
  return z.object({
    employeeId: z.string().min(1, v.selectEmployee),
    startDate:  z.string().min(1, v.dateRequired),
    endDate:    z.string().min(1, v.dateRequired),
    reason:     z.string().max(500).optional().or(z.literal('')),
  });
}

export function leaveRequestSchema(v: V) {
  return z.object({
    employeeId:  z.string().min(1, v.selectEmployee),
    leaveTypeId: z.string().min(1, v.selectType),
    startDate:   z.string().min(1, v.dateRequired),
    endDate:     z.string().min(1, v.dateRequired),
    reason:      z.string().max(500).optional().or(z.literal('')),
  });
}

export function leaveTypeSchema(v: V) {
  return z.object({
    name:    z.string().min(1, v.nameRequired).max(100),
    isPaid:  z.boolean(),
    maxDays: z.number().int().min(1).nullable().optional(),
  });
}

export type ShiftInput           = z.infer<ReturnType<typeof shiftSchema>>;
export type AbsenceInput         = z.infer<ReturnType<typeof absenceSchema>>;
export type VacationRequestInput = z.infer<ReturnType<typeof vacationRequestSchema>>;
export type LeaveRequestInput    = z.infer<ReturnType<typeof leaveRequestSchema>>;
export type LeaveTypeInput       = z.infer<ReturnType<typeof leaveTypeSchema>>;
