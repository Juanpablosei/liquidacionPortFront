import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Asistencia', description: 'Registro de entradas y salidas del personal.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
