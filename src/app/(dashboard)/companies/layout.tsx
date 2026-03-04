import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Empresas',
  description: 'Gestión de empresas y equipos.',
};

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
