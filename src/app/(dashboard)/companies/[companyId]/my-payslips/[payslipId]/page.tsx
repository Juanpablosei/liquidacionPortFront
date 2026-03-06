'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { CheckCircle2, Clock, Loader2, PenLine } from 'lucide-react';
import { getMyPayslip, signPayslip } from '@/lib/api/payroll';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import type { Payslip } from '@/lib/types/payroll';

export default function MyPayslipDetailPage() {
  const { companyId, payslipId } = useParams<{ companyId: string; payslipId: string }>();
  const t = useTranslation();
  const localeId = useLocaleId();

  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [comment, setComment] = useState('');

  const load = useCallback(() => {
    if (!companyId || !payslipId) return;
    setIsLoading(true);
    getMyPayslip(companyId, payslipId)
      .then(setPayslip)
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, [companyId, payslipId]);

  useEffect(() => { load(); }, [load]);

  async function handleSign() {
    if (!companyId || !payslipId) return;
    setSigning(true);
    try {
      const updated = await signPayslip(companyId, payslipId, comment.trim() || undefined);
      setPayslip(updated);
      toast.success(t.myPayslips.signSuccess);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.myPayslips.alreadySigned);
    } finally {
      setSigning(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title={t.myPayslips.detail} backHref={ROUTES.myPayslips(companyId)} />
        <LoadingSkeleton variant="detail" rows={8} />
      </>
    );
  }

  if (!payslip) {
    return (
      <>
        <PageHeader title={t.myPayslips.detail} backHref={ROUTES.myPayslips(companyId)} />
        <p className="text-slate-400 text-sm text-center py-10">{t.myPayslips.notLinked}</p>
      </>
    );
  }

  const earnings = payslip.lines?.filter((l) => l.category === 'EARNING') ?? [];
  const deductions = payslip.lines?.filter((l) => l.category === 'DEDUCTION') ?? [];
  const period = payslip.run?.period;
  const isSigned = !!payslip.signature;

  return (
    <>
      <PageHeader
        title={period?.name ?? t.myPayslips.detail}
        description={period ? `${formatDate(period.startDate, localeId)} – ${formatDate(period.endDate, localeId)}` : undefined}
        backHref={ROUTES.myPayslips(companyId)}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <SummaryCard label={t.myPayslips.gross} amount={payslip.grossPay} />
        <SummaryCard label={t.myPayslips.deductions} amount={payslip.totalDeductions} variant="danger" />
        <SummaryCard label={t.myPayslips.net} amount={payslip.netPay} variant="success" />
      </div>

      {/* Signature status */}
      <div className="mb-6 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
        {isSigned ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-400">{t.myPayslips.signed}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.myPayslips.signedAt.replace('{date}', formatDate(payslip.signature!.signedAt, localeId))}
              </p>
              {payslip.signature!.comment && (
                <p className="text-xs text-slate-500 mt-1">
                  {t.myPayslips.signedComment.replace('{comment}', payslip.signature!.comment)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm font-medium text-amber-400">{t.myPayslips.pending}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.myPayslips.signCommentPlaceholder}
                maxLength={500}
                aria-label={t.myPayslips.signComment}
                className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
              />
              <button
                onClick={handleSign}
                disabled={signing}
                className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {signing ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <PenLine className="w-4 h-4" />}
                {signing ? t.myPayslips.signing : t.myPayslips.sign}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lines */}
      {earnings.length > 0 && (
        <LinesSection title={t.myPayslips.earnings} lines={earnings} />
      )}
      {deductions.length > 0 && (
        <LinesSection title={t.myPayslips.deductionsTitle} lines={deductions} />
      )}
    </>
  );
}

function SummaryCard({ label, amount, variant }: { label: string; amount: string; variant?: 'success' | 'danger' }) {
  const colorClass = variant === 'success' ? 'text-emerald-400' : variant === 'danger' ? 'text-red-400' : 'text-white';
  return (
    <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <CurrencyDisplay amount={amount} className={`text-lg font-semibold ${colorClass}`} />
    </div>
  );
}

function LinesSection({ title, lines }: { title: string; lines: { conceptName: string; amount: string }[] }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-300">{line.conceptName}</span>
            <CurrencyDisplay amount={line.amount} className="text-sm font-mono text-white" />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
