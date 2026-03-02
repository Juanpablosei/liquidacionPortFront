'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title:        string;
  value:        string | number;
  icon:         React.ReactNode;
  description?: string;
  trend?:       { value: number; positive: boolean };
  href?:        string;
}

export function StatCard({ title, value, icon, description, trend, href }: StatCardProps) {
  const content = (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 flex flex-col gap-4 transition-colors hover:border-white/[0.1] hover:bg-[#131c2e]">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
          {icon}
        </div>
      </div>

      <div>
        <p className="text-2xl font-semibold text-white tabular-nums tracking-tight">{value}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </div>

      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend.positive
            ? <TrendingUp className="w-3.5 h-3.5" />
            : <TrendingDown className="w-3.5 h-3.5" />
          }
          <span>{trend.positive ? '+' : ''}{trend.value}% vs mes ant.</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
