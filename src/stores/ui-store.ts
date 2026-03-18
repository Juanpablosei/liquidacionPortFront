import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed:   boolean;
  mobileSidebarOpen:  boolean;
  theme:              'light' | 'dark' | 'system';
  locale:             'es' | 'en';

  toggleSidebar:        () => void;
  setSidebar:           (collapsed: boolean) => void;
  openMobileSidebar:    () => void;
  closeMobileSidebar:   () => void;
  setTheme:             (theme: 'light' | 'dark' | 'system') => void;
  setLocale:            (locale: 'es' | 'en') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed:  false,
      mobileSidebarOpen: false,
      theme:             'dark',
      locale:            'es',

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebar: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      openMobileSidebar:  () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),

      setTheme: (theme) =>
        set({ theme }),

      setLocale: (locale) =>
        set({ locale }),
    }),
    {
      name:    'ui-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
