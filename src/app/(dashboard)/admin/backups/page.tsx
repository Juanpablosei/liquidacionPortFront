'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/lib/utils/toast';
import { Database, Plus, HardDrive, Loader2 } from 'lucide-react';
import { listBackups, createManualBackup } from '@/lib/api/admin';
import { PageHeader }     from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState }      from '@/components/shared/empty-state';
import { useTranslation }  from '@/lib/i18n';
import { useAuthStore }    from '@/stores/auth-store';
import type { BackupFile } from '@/lib/types/admin';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function BackupsPage() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.systemRole === 'SUPER_ADMIN';

  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listBackups();
      setBackups(data);
    } catch {
      toast.error(t.admin.backups.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.admin.backups.loadError]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    try {
      setCreating(true);
      await createManualBackup();
      toast.success(t.admin.backups.created);
      await load();
    } catch {
      toast.error(t.admin.backups.createError);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.admin.backups.title}
        description={t.admin.backups.description}
        actions={
          canWrite ? (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {creating ? t.admin.backups.creating : t.admin.backups.createManual}
            </button>
          ) : undefined
        }
      />

      {backups.length === 0 ? (
        <EmptyState
          icon={<HardDrive className="w-6 h-6" />}
          title={t.admin.backups.noBackups}
          description={t.admin.backups.noBackupsDesc}
        />
      ) : (
        <div className="rounded-xl border border-border bg-secondary overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                <th className="text-left px-4 py-3 font-medium">{t.admin.backups.filename}</th>
                <th className="text-right px-4 py-3 font-medium">{t.admin.backups.size}</th>
                <th className="text-right px-4 py-3 font-medium">{t.admin.backups.lastModified}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {backups.map((backup) => (
                <tr key={backup.filename} className="text-muted-foreground">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs">{backup.filename}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatFileSize(backup.size)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {new Date(backup.lastModified).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
