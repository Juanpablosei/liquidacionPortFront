export const COLORS = {
  primary: {
    DEFAULT: '#0F172A',
    light:   '#334155',
    lighter: '#64748B',
  },
  accent: {
    DEFAULT: '#2563EB',
    hover:   '#1D4ED8',
    light:   '#DBEAFE',
    lighter: '#EFF6FF',
  },
  success: {
    DEFAULT: '#16A34A',
    light:   '#DCFCE7',
  },
  warning: {
    DEFAULT: '#D97706',
    light:   '#FEF3C7',
  },
  danger: {
    DEFAULT: '#DC2626',
    light:   '#FEE2E2',
  },
  neutral: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A',
  },
  background: {
    DEFAULT:   '#FFFFFF',
    secondary: '#F8FAFC',
    dark:      '#0F172A',
  },
  border: {
    DEFAULT: '#E2E8F0',
    focus:   '#2563EB',
    strong:  '#CBD5E1',
  },
  text: {
    primary:   '#0F172A',
    secondary: '#64748B',
    disabled:  '#94A3B8',
    inverse:   '#FFFFFF',
  },
} as const;

export type ColorKey = keyof typeof COLORS;
