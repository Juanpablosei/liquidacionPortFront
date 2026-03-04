import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Conceptos', description: 'Haberes y deducciones de nómina.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
