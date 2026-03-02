'use client';

import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { ROUTES } from '@/lib/constants/routes';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <>
      <PageHeader
        title="Mi perfil"
        description="Datos de tu cuenta y sesiones activas."
      />

      <div className="max-w-lg">
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-base font-semibold text-[#93BBFC]">
              {(user?.name ?? user?.email ?? '?')[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name ?? '—'}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
            La gestión completa del perfil — cambio de contraseña y sesiones — estará disponible en la Fase 7.
          </p>
        </div>
      </div>
    </>
  );
}
