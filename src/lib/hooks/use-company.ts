'use client';

import { useCompanyStore } from '@/stores/company-store';

export function useCompany() {
  return useCompanyStore();
}
