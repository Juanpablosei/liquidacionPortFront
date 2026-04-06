import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ausencias — Silent Port' };

export default function AbsencesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
