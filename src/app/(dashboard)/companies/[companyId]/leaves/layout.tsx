import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Licencias — Silent Port' };

export default function LeavesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
