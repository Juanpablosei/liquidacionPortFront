import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Turnos — Silent Port' };

export default function ShiftsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
