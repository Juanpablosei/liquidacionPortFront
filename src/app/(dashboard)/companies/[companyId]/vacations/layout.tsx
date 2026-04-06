import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Vacaciones — Silent Port' };

export default function VacationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
