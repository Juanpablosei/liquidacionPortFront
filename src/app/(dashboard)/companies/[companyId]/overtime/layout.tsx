import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Horas extra', description: 'Registro de horas extra OT 50% y OT 100%.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
