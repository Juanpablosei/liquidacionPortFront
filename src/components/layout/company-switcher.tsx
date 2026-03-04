'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Plus, Building2 } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { ROUTES } from '@/lib/constants/routes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface CompanySwitcherProps {
  collapsed: boolean;
}

export function CompanySwitcher({ collapsed }: CompanySwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { activeCompany, companies, role } = useCompanyStore();

  function handleSelect(companyId: string) {
    setOpen(false);
    router.push(ROUTES.company(companyId));
  }

  const initials = activeCompany ? getInitials(activeCompany.name) : '—';

  if (collapsed) {
    return (
      <div className="px-2 mb-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-10 h-10 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/30 flex items-center justify-center text-sm font-semibold text-[#93BBFC] hover:bg-[#2563EB]/30 transition-colors"
              title={activeCompany?.name ?? 'Seleccionar empresa'}
            >
              {activeCompany ? initials : <Building2 className="w-4 h-4" />}
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-56 bg-[#0F172A] border border-white/[0.08] p-1.5 shadow-xl"
          >
            <CompanyList
              companies={companies}
              activeId={activeCompany?.id}
              onSelect={handleSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="px-3 mb-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border border-[#2563EB]/30 flex items-center justify-center text-xs font-semibold text-[#93BBFC] shrink-0">
              {activeCompany ? initials : <Building2 className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate leading-none mb-0.5">
                {activeCompany?.name ?? 'Sin empresa'}
              </p>
              {role && (
                <p className="text-[11px] text-slate-500 leading-none capitalize">
                  {role.toLowerCase()}
                </p>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-colors shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-60 bg-[#0F172A] border border-white/[0.08] p-1.5 shadow-xl"
        >
          <CompanyList
            companies={companies}
            activeId={activeCompany?.id}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CompanyList({
  companies,
  activeId,
  onSelect,
}: {
  companies: { id: string; name: string }[];
  activeId?: string;
  onSelect:  (id: string) => void;
}) {
  return (
    <>
      {companies.length > 0 ? (
        <div className="mb-1">
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2563EB]/15 flex items-center justify-center text-[11px] font-semibold text-[#93BBFC] shrink-0">
                {getInitials(c.name)}
              </div>
              <span className="text-sm text-white truncate flex-1">{c.name}</span>
              {c.id === activeId && (
                <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 px-2.5 py-2">Sin empresas</p>
      )}

      <div className="border-t border-white/[0.06] pt-1 mt-1 flex flex-col gap-0.5">
        <Link
          href={ROUTES.companies}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-sm text-slate-400 hover:text-white"
        >
          <Building2 className="w-3.5 h-3.5" />
          Ver todas las empresas
        </Link>
        <Link
          href={ROUTES.newCompany}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-sm text-[#2563EB] hover:text-blue-400"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva empresa
        </Link>
      </div>
    </>
  );
}
