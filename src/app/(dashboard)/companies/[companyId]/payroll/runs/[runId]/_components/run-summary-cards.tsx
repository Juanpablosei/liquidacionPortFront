'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface RunSummaryCardsProps {
  totals: { gross: number; deductions: number; net: number };
  fmt: (v: string | number) => string;
  labels: {
    totalEarnings: string;
    totalDeductions: string;
    totalNet: string;
  };
}

export function RunSummaryCards({ totals, fmt, labels }: RunSummaryCardsProps) {
  const cards = [
    {
      label: labels.totalEarnings,
      value: totals.gross,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: labels.totalDeductions,
      value: totals.deductions,
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: labels.totalNet,
      value: totals.net,
      icon: <DollarSign className="w-4 h-4" />,
      color: 'text-white',
      bg: 'bg-[#2563EB]/10 border-[#2563EB]/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border px-4 py-3 ${card.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={card.color}>{card.icon}</span>
            <span className="text-xs text-slate-500">{card.label}</span>
          </div>
          <p className={`font-mono text-lg font-semibold ${card.color}`}>{fmt(card.value)}</p>
        </div>
      ))}
    </div>
  );
}
