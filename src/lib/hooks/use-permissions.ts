'use client';

import { useCompanyStore } from '@/stores/company-store';
import { hasMinRole } from '@/lib/constants/roles';
import type { CompanyRole } from '@/lib/types/company';

export function usePermissions() {
  const { role } = useCompanyStore();

  return {
    role,

    hasRole: (roles: CompanyRole[]): boolean =>
      role !== null && roles.includes(role),

    isOwner:   () => role === 'OWNER',
    isAdmin:   () => role === 'ADMIN' || role === 'OWNER',
    isManager: () => hasMinRole(role ?? 'MEMBER', 'MANAGER'),

    canEdit:             () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canDelete:           () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canManageMembers:    () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canViewSalary:       () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canManagePayroll:    () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canViewPayroll:      () => hasMinRole(role ?? 'MEMBER', 'MANAGER'),
    canRecordAttendance: () => hasMinRole(role ?? 'MEMBER', 'MANAGER'),
  };
}
