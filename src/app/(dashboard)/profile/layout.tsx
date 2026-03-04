import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi perfil',
  description: 'Gestión de cuenta, contraseña y sesiones activas.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
