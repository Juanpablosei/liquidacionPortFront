import { apiFetch } from './client';
import { toArray } from './helpers';
import { API } from '@/lib/constants/api-endpoints';
import type { Holiday } from '@/lib/types/attendance';

export interface CreateHolidayDto {
  date:       string;
  name:       string;
  isOptional: boolean;
}

export interface UpdateHolidayDto {
  date?:       string;
  name?:       string;
  isOptional?: boolean;
}

export interface ListHolidaysParams {
  year?: number;
}

export function listHolidays(
  companyId: string,
  params:    ListHolidaysParams = {},
): Promise<Holiday[]> {
  const query = new URLSearchParams();
  if (params.year) query.set('year', String(params.year));
  const qs = query.toString();
  return apiFetch<unknown>(`${API.holidays.list(companyId)}${qs ? `?${qs}` : ''}`).then(toArray<Holiday>);
}

export function createHoliday(
  companyId: string,
  data:      CreateHolidayDto,
): Promise<Holiday> {
  return apiFetch(API.holidays.create(companyId), {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function updateHoliday(
  companyId: string,
  holidayId: string,
  data:      UpdateHolidayDto,
): Promise<Holiday> {
  return apiFetch(API.holidays.update(companyId, holidayId), {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export function deleteHoliday(
  companyId: string,
  holidayId: string,
): Promise<void> {
  return apiFetch(API.holidays.delete(companyId, holidayId), {
    method: 'DELETE',
  });
}
