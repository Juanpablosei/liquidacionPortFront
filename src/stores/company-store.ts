import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Company, CompanyUser, CompanyRole } from '@/lib/types/company';

interface CompanyState {
  activeCompany:  Company | null;
  membership:     CompanyUser | null;
  role:           CompanyRole | null;
  companies:      Company[];

  setActiveCompany: (company: Company, membership: CompanyUser) => void;
  setCompanies:     (companies: Company[]) => void;
  clearCompany:     () => void;
  updateCompany:    (data: Partial<Company>) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompany: null,
      membership:    null,
      role:          null,
      companies:     [],

      setActiveCompany: (company, membership) =>
        set({ activeCompany: company, membership, role: membership.role }),

      setCompanies: (companies) =>
        set({ companies }),

      clearCompany: () =>
        set({ activeCompany: null, membership: null, role: null }),

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
        membership:    state.membership,
        role:          state.role,
      }),
    },
  ),
);
