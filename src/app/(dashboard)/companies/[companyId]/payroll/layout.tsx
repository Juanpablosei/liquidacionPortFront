import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Nómina', description: 'Períodos de liquidación y runs de pago.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
