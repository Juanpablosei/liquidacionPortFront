import { z } from 'zod';

export const attendanceSchema = z.object({
  employeeId: z.string().min(1, 'Seleccioná un empleado'),
  date:       z.string().min(1, 'La fecha es requerida'),
  clockIn:    z.string().optional().or(z.literal('')),
  clockOut:   z.string().optional().or(z.literal('')),
  notes:      z.string().max(500).optional().or(z.literal('')),
});

export const overtimeSchema = z.object({
  employeeId:   z.string().min(1, 'Seleccioná un empleado'),
  date:         z.string().min(1, 'La fecha es requerida'),
  overtimeType: z.enum(['OT_50', 'OT_100'], { error: 'Seleccioná el tipo' }),
  minutes:      z.number().int().min(1, 'Los minutos deben ser mayor a 0'),
  notes:        z.string().max(500).optional().or(z.literal('')),
});

export const holidaySchema = z.object({
  date:       z.string().min(1, 'La fecha es requerida'),
  name:       z.string().min(1, 'El nombre es requerido').max(200),
  isOptional: z.boolean(),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type OvertimeInput   = z.infer<typeof overtimeSchema>;
export type HolidayInput    = z.infer<typeof holidaySchema>;
