'use client';

import { Check, ClipboardCheck } from 'lucide-react';
import { RoleGate } from '@/components/shared/role-gate';
import type { SignaturesSummary } from '@/lib/types/payroll';

function formatDateTime(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface SignaturesDashboardProps {
  signatures: SignaturesSummary;
  localeId: string;
  labels: {
    signatures: string;
    signaturesProg: string;
    employee: string;
    status: string;
    notes: string;
    signedLabel: string;
    pendingLabel: string;
    noComment: string;
  };
}

export function SignaturesDashboard({ signatures, localeId, labels }: SignaturesDashboardProps) {
  return (
    <RoleGate roles={['OWNER', 'ADMIN']}>
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardCheck className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white">{labels.signatures}</h3>
          <span className="text-xs text-slate-500 ml-auto">
            {labels.signaturesProg
              .replace('{signed}', String(signatures.signed))
              .replace('{total}', String(signatures.total))}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(signatures.signed / signatures.total) * 100}%` }}
          />
        </div>

        {/* Employee signatures table */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">{labels.employee}</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">{labels.status}</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">{labels.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {signatures.details.map((d) => (
                <tr key={d.employeeId} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-white">
                    {d.lastName}, {d.firstName}
                  </td>
                  <td className="px-4 py-2.5">
                    {d.signed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="w-3 h-3" />
                        {labels.signedLabel}
                        {d.signedAt && (
                          <span className="text-slate-500 ml-1">
                            — {formatDateTime(d.signedAt, localeId)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400">{labels.pendingLabel}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {d.comment || labels.noComment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RoleGate>
  );
}
