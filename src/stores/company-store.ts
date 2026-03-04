import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Company, CompanyRole } from '@/lib/types/company';

interface CompanyState {
  activeCompany: Company | null;
  role:          CompanyRole | null;
  companies:     Company[];

  setActiveCompany: (company: Company, role: CompanyRole) => void;
  setCompanies:     (companies: Company[]) => void;
  clearCompany:     () => void;
  updateCompany:    (data: Partial<Company>) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompany: null,
      role:          null,
      companies:     [],

      setActiveCompany: (company, role) =>
        set({ activeCompany: company, role }),

      setCompanies: (companies) =>
        set({ companies: Array.isArray(companies) ? companies : [] }),

      clearCompany: () =>
        set({ activeCompany: null, role: null }),

      updateCompany: (data) =>
        set((state) => ({
          activeCompany: state.activeCompany
            ? { ...state.activeCompany, ...data }
            : null,
        })),
    }),
    {
      name:    'company-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeCompany: state.activeCompany,
        role:          state.role,
      }),
    },
  ),
);
