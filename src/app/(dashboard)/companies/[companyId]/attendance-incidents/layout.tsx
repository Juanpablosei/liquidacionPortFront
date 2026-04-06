import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Incidentes — Silent Port' };

export default function AttendanceIncidentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
