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
          <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{labels.signatures}</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {labels.signaturesProg
              .replace('{signed}', String(signatures.signed))
              .replace('{total}', String(signatures.total))}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-overlay mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(signatures.signed / signatures.total) * 100}%` }}
          />
        </div>

        {/* Employee signatures table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-overlay-subtle">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{labels.employee}</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{labels.status}</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{labels.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {signatures.details.map((d) => (
                <tr key={d.employeeId} className="hover:bg-overlay-subtle">
                  <td className="px-4 py-2.5 text-foreground">
                    {d.lastName}, {d.firstName}
                  </td>
                  <td className="px-4 py-2.5">
                    {d.signed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="w-3 h-3" />
                        {labels.signedLabel}
                        {d.signedAt && (
                          <span className="text-muted-foreground ml-1">
                            — {formatDateTime(d.signedAt, localeId)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400">{labels.pendingLabel}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
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
