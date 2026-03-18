'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/utils/toast';
import { CheckCircle2, XCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';
import {
  listPaymentProofs as fetchProofs,
  approvePaymentProof,
  rejectPaymentProof,
} from '@/lib/api/admin';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@/lib/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { AdminPaymentProof } from '@/lib/types/admin';

type StatusFilter = '' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminPaymentProofsPage() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.systemRole === 'SUPER_ADMIN';

  const [proofs, setProofs] = useState<AdminPaymentProof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<AdminPaymentProof | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchProofs({ status: filter || undefined, page, limit });
      setProofs(res.items);
      setTotal(res.total);
    } catch {
      toast.error(t.admin.paymentProofs.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, t.admin.paymentProofs.loadError]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filter]);

  async function handleApprove(proof: AdminPaymentProof) {
    setIsProcessing(true);
    try {
      await approvePaymentProof(proof.id);
      toast.success(t.admin.paymentProofs.approved_toast);
      load();
    } catch {
      toast.error(t.admin.paymentProofs.error);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      await rejectPaymentProof(rejectTarget.id, rejectReason.trim());
      toast.success(t.admin.paymentProofs.rejected_toast);
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch {
      toast.error(t.admin.paymentProofs.error);
    } finally {
      setIsProcessing(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
      APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20',
    };
    const labels: Record<string, string> = {
      PENDING: t.admin.paymentProofs.pending,
      APPROVED: t.admin.paymentProofs.approved,
      REJECTED: t.admin.paymentProofs.rejected,
    };
    return (
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', styles[status] ?? '')}>
        {labels[status] ?? status}
      </span>
    );
  };

  const filters: { label: string; value: StatusFilter }[] = [
    { label: t.admin.paymentProofs.filterAll, value: '' },
    { label: t.admin.paymentProofs.filterPending, value: 'PENDING' },
    { label: t.admin.paymentProofs.filterApproved, value: 'APPROVED' },
    { label: t.admin.paymentProofs.filterRejected, value: 'REJECTED' },
  ];

  if (isLoading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.admin.paymentProofs.title}
        description={t.admin.paymentProofs.description}
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-brand/15 text-brand-text'
                : 'text-muted-foreground hover:text-foreground hover:bg-overlay-subtle',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {proofs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title={t.admin.paymentProofs.noProofs}
          description={t.admin.paymentProofs.noProofsDesc}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-secondary overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                  <th className="text-left px-4 py-3 font-medium">{t.admin.paymentProofs.company}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.admin.paymentProofs.plan}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.admin.paymentProofs.fileName}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.admin.paymentProofs.date}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.admin.paymentProofs.status}</th>
                  {canWrite && <th className="px-4 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proofs.map((proof) => (
                  <tr key={proof.id} className="text-muted-foreground">
                    <td className="px-4 py-3 font-medium text-foreground">{proof.company.name}</td>
                    <td className="px-4 py-3">{proof.subscription?.plan?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-text hover:underline"
                      >
                        {proof.fileName}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(proof.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{statusBadge(proof.status)}</td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        {proof.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleApprove(proof)}
                              disabled={isProcessing}
                              className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                              title={t.admin.paymentProofs.approve}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setRejectTarget(proof); setRejectReason(''); }}
                              disabled={isProcessing}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              title={t.admin.paymentProofs.reject}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span>{total} {total === 1 ? t.dataTable.record : t.dataTable.records}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg bg-overlay-subtle hover:bg-overlay-strong disabled:opacity-30 transition-colors"
                  >
                    {t.dataTable.prevPage}
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-lg bg-overlay-subtle hover:bg-overlay-strong disabled:opacity-30 transition-colors"
                  >
                    {t.dataTable.nextPage}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) setRejectTarget(null); }}>
        <DialogContent className="bg-sidebar border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t.admin.paymentProofs.rejectConfirm}</DialogTitle>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t.admin.paymentProofs.rejectReasonPlaceholder}
            rows={3}
            className="w-full px-3 py-2 bg-overlay border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/50 transition-colors resize-none"
          />
          <DialogFooter className="flex-row gap-2">
            <button
              onClick={() => setRejectTarget(null)}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors"
            >
              {t.common?.cancel ?? 'Cancelar'}
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim() || isProcessing}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.admin.paymentProofs.reject}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
