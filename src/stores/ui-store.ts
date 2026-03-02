import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  theme:            'light' | 'dark' | 'system';

  toggleSidebar: () => void;
  setSidebar:    (collapsed: boolean) => void;
  setTheme:      (theme: 'light' | 'dark' | 'system') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme:            'light',

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebar: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) =>
        set({ theme }),
    }),
    {
      name:    'ui-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
