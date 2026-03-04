import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Configuración', description: 'Datos y ajustes de la empresa.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
