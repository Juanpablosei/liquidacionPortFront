import { apiFetch } from './client';
import { API } from '@/lib/constants/api-endpoints';
import type { Shift } from '@/lib/types/shift';

export interface CreateShiftDto {
  name:         string;
  description?: string;
}

export interface UpdateShiftDto {
  name?:        string;
  description?: string;
}

export function listShifts(companyId: string): Promise<Shift[]> {
  return apiFetch<Shift[]>(API.shifts.list(companyId));
}

export function createShift(companyId: string, data: CreateShiftDto): Promise<Shift> {
  return apiFetch(API.shifts.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateShift(companyId: string, shiftId: string, data: UpdateShiftDto): Promise<Shift> {
  return apiFetch(API.shifts.update(companyId, shiftId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function deleteShift(companyId: string, shiftId: string): Promise<void> {
  return apiFetch(API.shifts.delete(companyId, shiftId), {
    method: 'DELETE',
  });
}
