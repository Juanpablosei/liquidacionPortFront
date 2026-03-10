import type { PaginatedResponse } from '@/lib/types/api';

/** Backend puede devolver T[] o { items: T[] } o { data: T[] }; normalizamos a array. */
export function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.data))  return o.data  as T[];
  }
  return [];
}

/** Backend devuelve doble anidación para objetos individuales: apiFetch retorna data; el objeto real está en data.data. */
export function unwrapObject<T extends object>(raw: unknown, key: keyof T): T {
  const obj = raw as Record<string, unknown>;
  if (obj?.data && typeof obj.data === 'object' && key in (obj.data as object)) {
    return obj.data as T;
  }
  return raw as T;
}

/** Normaliza respuesta paginada del backend. */
export function toPaginated<T>(raw: unknown): PaginatedResponse<T> {
  const obj =
    raw && typeof raw === 'object' && 'items' in (raw as object)
      ? raw
      : raw && typeof raw === 'object' && 'data' in (raw as object)
        ? (raw as { data: unknown }).data
        : raw;
  const o = (obj && typeof obj === 'object' ? obj : {}) as Record<string, unknown>;
  const items = Array.isArray(o.items) ? (o.items as T[]) : [];
  return {
    items,
    total:  Number(o.total ?? items.length),
    page:   Number(o.page ?? 1),
    limit:  Number(o.limit ?? 20),
    pages:  Number(o.pages ?? 1),
  };
}
