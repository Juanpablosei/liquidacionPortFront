'use client';

import { usePermissions } from '@/lib/hooks/use-permissions';
import type { CompanyRole } from '@/lib/types/company';

interface RoleGateProps {
  roles:     CompanyRole[];
  children:  React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { hasRole } = usePermissions();
  return hasRole(roles) ? <>{children}</> : <>{fallback}</>;
}
