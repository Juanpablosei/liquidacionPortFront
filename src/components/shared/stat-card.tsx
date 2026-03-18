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
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 transition-colors hover:border-border hover:bg-secondary">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
          {icon}
        </div>
      </div>

      <div>
        <p className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
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
      <Link href={href} className="block cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:rounded-xl focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
