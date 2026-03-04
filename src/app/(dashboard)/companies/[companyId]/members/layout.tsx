import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Miembros', description: 'Roles y permisos del equipo.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
