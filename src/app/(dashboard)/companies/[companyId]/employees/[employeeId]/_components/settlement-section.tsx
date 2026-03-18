'use client';

import { FileText, Loader2 } from 'lucide-react';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Settlement, SettlementReason } from '@/lib/types/settlement';
import type { Translations } from '@/lib/i18n/es';
import { formatDate, INPUT_CLASS } from './shared';

interface SettlementDetailProps {
  settlement: Settlement;
  canViewSalary: () => boolean;
  localeId: string;
  t: Translations;
}

export function SettlementDetail({
  settlement,
  canViewSalary,
  localeId,
  t,
}: SettlementDetailProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{t.settlements.detail.title}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{t.settlements.detail.reason}</p>
          <p className="text-sm font-medium text-foreground">
            {settlement.reason === 'DISMISSAL' ? t.settlements.detail.dismissal : t.settlements.detail.resignation}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{t.settlements.detail.terminationDate}</p>
          <p className="text-sm font-medium text-foreground font-mono">
            {formatDate(settlement.terminationDate, localeId)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{t.settlements.detail.hireDate}</p>
          <p className="text-sm font-medium text-foreground font-mono">
            {formatDate(settlement.hireDateSnapshot, localeId)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{t.settlements.detail.seniority}</p>
          <p className="text-sm font-medium text-foreground">
            {t.settlements.detail.seniorityFormat
              .replace('{years}', String(settlement.seniorityYears))
              .replace('{months}', String(settlement.seniorityMonths))
              .replace('{days}', String(settlement.seniorityDays))}
          </p>
        </div>
      </div>

      {canViewSalary() && (
        <>
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-0.5">{t.settlements.detail.dailySalary}</p>
            <CurrencyDisplay amount={settlement.dailySalary} />
          </div>

          {(() => {
            const payslip = settlement.run?.payslips?.[0];
            const lines = payslip?.lines;
            if (!lines || lines.length === 0) return null;
            return (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-3">{t.settlements.detail.lines}</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-overlay-subtle">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">{t.settlements.detail.concept}</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">{t.settlements.detail.category}</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2">{t.settlements.detail.amount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-4 py-2.5 text-foreground">{line.conceptName}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              line.category === 'EARNING'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {line.category === 'EARNING' ? t.settlements.detail.earning : t.settlements.detail.deduction}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            <CurrencyDisplay amount={line.amount} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-overlay-subtle">
                        <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-foreground">{t.settlements.detail.total}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          <CurrencyDisplay amount={payslip.netPay} />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

interface SettlementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlementReason: SettlementReason;
  setSettlementReason: (v: SettlementReason) => void;
  settlementDate: string;
  setSettlementDate: (v: string) => void;
  generatingSettlement: boolean;
  onGenerate: () => void;
  t: Translations;
}

export function SettlementModal({
  open,
  onOpenChange,
  settlementReason,
  setSettlementReason,
  settlementDate,
  setSettlementDate,
  generatingSettlement,
  onGenerate,
  t,
}: SettlementModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t.settlements.create.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t.settlements.create.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t.settlements.create.reason}</label>
            <Select
              value={settlementReason}
              onValueChange={(v) => setSettlementReason(v as SettlementReason)}
            >
              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="DISMISSAL" className="focus:bg-overlay focus:text-foreground">{t.settlements.create.dismissal}</SelectItem>
                <SelectItem value="RESIGNATION" className="focus:bg-overlay focus:text-foreground">{t.settlements.create.resignation}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t.settlements.create.terminationDate}</label>
            <Input
              type="date"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
              className={`${INPUT_CLASS} [color-scheme:dark]`}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={generatingSettlement}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors disabled:opacity-50 cursor-pointer"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onGenerate}
            disabled={generatingSettlement || !settlementDate}
            aria-busy={generatingSettlement}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {generatingSettlement
              ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 motion-safe:animate-spin" />{t.settlements.create.generating}</span>
              : t.settlements.create.confirm}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
