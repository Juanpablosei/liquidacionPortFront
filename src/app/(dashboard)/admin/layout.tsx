'use client';

import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const t = useTranslation();
  const pathname = usePathname();

  const hasAccess =
    user?.systemRole === 'SUPER_ADMIN' || user?.systemRole === 'SUPER_VIEWER';

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium text-lg">{t.admin.accessDenied}</p>
          <p className="text-slate-400 text-sm mt-1">{t.admin.accessDeniedDesc}</p>
        </div>
        <Link
          href={ROUTES.companies}
          className="mt-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          {t.admin.backToDashboard}
        </Link>
      </div>
    );
  }

  const tabs = [
    { label: t.admin.dashboard, href: ROUTES.admin },
    { label: t.admin.convenios, href: ROUTES.adminConvenios },
    { label: t.admin.plans, href: ROUTES.adminPlans },
    { label: t.admin.subscriptions, href: ROUTES.adminSubscriptions },
    { label: t.admin.companies, href: ROUTES.adminCompanies },
  ];

  function isActive(href: string): boolean {
    if (href === ROUTES.admin) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <div>
      <nav className="bg-[#111827] rounded-xl mb-6 overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                isActive(tab.href)
                  ? 'text-white border-b-2 border-[#2563EB]'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
