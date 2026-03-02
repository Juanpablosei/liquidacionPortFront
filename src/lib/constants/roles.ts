import type { CompanyRole } from '@/lib/types/company';

export const ROLE_HIERARCHY: Record<CompanyRole, number> = {
  OWNER:   4,
  ADMIN:   3,
  MANAGER: 2,
  MEMBER:  1,
};

export function hasMinRole(
  userRole: CompanyRole,
  minRole:  CompanyRole,
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export const ROLE_LABELS: Record<CompanyRole, string> = {
  OWNER:   'Propietario',
  ADMIN:   'Administrador',
  MANAGER: 'Gerente',
  MEMBER:  'Miembro',
};
