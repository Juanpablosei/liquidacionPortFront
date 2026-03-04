import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Empleados', description: 'Gestión de personal y contratos.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
