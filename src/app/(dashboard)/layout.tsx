'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useCompanyStore } from '@/stores/company-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { listCompanies } from '@/lib/api/companies';
import { ROUTES } from '@/lib/constants/routes';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router           = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { setCompanies } = useCompanyStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.login);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    listCompanies()
      .then(setCompanies)
      .catch(() => {});
  }, [isAuthenticated, setCompanies]);

  // Spinner solo mientras se verifica la sesión (isLoading).
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  // Sin sesión: fondo oscuro (nunca blanco) mientras el useEffect
  // ejecuta router.replace('/login'). No se renderiza contenido protegido.
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-[#0A0F1C]" />;
  }

  return (
    <div className="flex h-screen bg-[#0A0F1C] overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(37,99,235,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(37,99,235,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            zIndex: 0,
          }}
        />

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-screen-xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
