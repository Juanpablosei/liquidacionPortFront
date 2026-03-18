'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';

const cycle = { dark: 'light', light: 'system', system: 'dark' } as const;
const icons = { dark: Moon, light: Sun, system: Monitor } as const;

export function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const Icon = icons[theme];

  return (
    <button
      onClick={() => setTheme(cycle[theme])}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-overlay transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      aria-label={`Theme: ${theme}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
