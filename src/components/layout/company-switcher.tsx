'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Plus, Building2 } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { useTranslation } from '@/lib/i18n';
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
  const t = useTranslation();

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
              className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center text-sm font-semibold text-brand-text hover:bg-brand/30 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              aria-label={activeCompany?.name ?? t.companies.select}
              title={activeCompany?.name ?? t.companies.select}
            >
              {activeCompany ? initials : <Building2 className="w-4 h-4" />}
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-56 bg-card border border-border p-1.5 shadow-xl"
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
          <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-overlay-subtle transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center text-xs font-semibold text-brand-text shrink-0">
              {activeCompany ? initials : <Building2 className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate leading-none mb-0.5">
                {activeCompany?.name ?? t.companies.noCompany}
              </p>
              {role && (
                <p className="text-xs text-muted-foreground leading-none capitalize">
                  {role.toLowerCase()}
                </p>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-muted-foreground transition-colors shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-60 bg-card border border-border p-1.5 shadow-xl"
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
  const t = useTranslation();
  return (
    <>
      {companies.length > 0 ? (
        <div className="mb-1">
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-overlay transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center text-xs font-semibold text-brand-text shrink-0">
                {getInitials(c.name)}
              </div>
              <span className="text-sm text-foreground truncate flex-1">{c.name}</span>
              {c.id === activeId && (
                <Check className="w-3.5 h-3.5 text-brand shrink-0" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground px-2.5 py-2">{t.companies.noCompanies}</p>
      )}

      <div className="border-t border-border pt-1 mt-1 flex flex-col gap-0.5">
        <Link
          href={ROUTES.companies}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-overlay transition-colors text-sm text-muted-foreground hover:text-foreground cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none focus-visible:rounded-lg"
        >
          <Building2 className="w-3.5 h-3.5" />
          {t.companies.viewAll}
        </Link>
        <Link
          href={ROUTES.newCompany}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-overlay transition-colors text-sm text-brand hover:text-blue-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none focus-visible:rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.companies.newCompany}
        </Link>
      </div>
    </>
  );
}
