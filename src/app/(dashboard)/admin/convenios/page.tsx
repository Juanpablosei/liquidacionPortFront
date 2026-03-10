'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, ScrollText } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ROUTES } from '@/lib/constants/routes';
import {
  listAdminConvenios,
  createAdminConvenio,
  updateAdminConvenio,
  deleteAdminConvenio,
  addAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '@/lib/api/convenios';
import type { Convenio, ConvenioCategory } from '@/lib/types/convenio';
import type { CreateConvenioInput, CreateCategoryInput } from '@/lib/validators/convenio';
import { ConvenioCard } from './_components/convenio-card';
import { ConvenioSheet } from './_components/convenio-sheet';
import { CategorySheet } from './_components/category-sheet';

export default function AdminConveniosPage() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.systemRole === 'SUPER_ADMIN';

  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convenio CRUD state
  const [convenioSheetOpen, setConvenioSheetOpen] = useState(false);
  const [editConvenio, setEditConvenio] = useState<Convenio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Convenio | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category CRUD state
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [categoryParent, setCategoryParent] = useState<Convenio | null>(null);
  const [editCategory, setEditCategory] = useState<ConvenioCategory | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<ConvenioCategory | null>(null);
  const [isCatSaving, setIsCatSaving] = useState(false);
  const [isCatDeleting, setIsCatDeleting] = useState(false);

  // ─── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(() => {
    setIsLoading(true);
    listAdminConvenios()
      .then(setConvenios)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : String(err)))
      .finally(() => setIsLoading(false));
  }, [t.convenios.loadError]);

  useEffect(() => { load(); }, [load]);

  // ─── Convenio handlers ───────────────────────────────────────────────────

  function openCreateConvenio() {
    setEditConvenio(null);
    setConvenioSheetOpen(true);
  }

  function openEditConvenio(c: Convenio) {
    setEditConvenio(c);
    setConvenioSheetOpen(true);
  }

  async function handleConvenioSubmit(data: CreateConvenioInput) {
    setIsSaving(true);
    try {
      if (editConvenio) {
        await updateAdminConvenio(editConvenio.id, data);
        toast.success(t.convenios.updated);
      } else {
        await createAdminConvenio(data);
        toast.success(t.convenios.created);
      }
      setConvenioSheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteConvenio() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminConvenio(deleteTarget.id);
      toast.success(t.convenios.deleted);
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeleting(false);
    }
  }

  // ─── Category handlers ───────────────────────────────────────────────────

  function openAddCategory(convenio: Convenio) {
    setCategoryParent(convenio);
    setEditCategory(null);
    setCategorySheetOpen(true);
  }

  function openEditCategory(cat: ConvenioCategory) {
    setCategoryParent(null); // not needed for edit; we use cat.convenioId
    setEditCategory(cat);
    setCategorySheetOpen(true);
  }

  async function handleCategorySubmit(data: CreateCategoryInput) {
    setIsCatSaving(true);
    try {
      if (editCategory) {
        await updateAdminCategory(editCategory.id, data);
        toast.success(t.convenios.categoryUpdated);
      } else if (categoryParent) {
        await addAdminCategory(categoryParent.id, data);
        toast.success(t.convenios.categoryCreated);
      }
      setCategorySheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCatSaving(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCatTarget) return;
    setIsCatDeleting(true);
    try {
      await deleteAdminCategory(deleteCatTarget.id);
      toast.success(t.convenios.categoryDeleted);
      setDeleteCatTarget(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCatDeleting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title={t.admin.convenios}
        description={t.admin.conveniosDesc}
        backHref={ROUTES.companies}
        actions={
          canWrite ? (
            <button
              onClick={openCreateConvenio}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.convenios.newConvenio}
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingSkeleton variant="cards" rows={4} />
      ) : convenios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">{t.convenios.emptyTitle}</p>
          {canWrite && (
            <button
              onClick={openCreateConvenio}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.convenios.newConvenio}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {convenios.map((c) => (
            <ConvenioCard
              key={c.id}
              convenio={c}
              canWrite={canWrite}
              onEditConvenio={openEditConvenio}
              onDeleteConvenio={setDeleteTarget}
              onAddCategory={openAddCategory}
              onEditCategory={openEditCategory}
              onDeleteCategory={setDeleteCatTarget}
            />
          ))}
        </div>
      )}

      {/* Convenio Sheet */}
      <ConvenioSheet
        open={convenioSheetOpen}
        onOpenChange={setConvenioSheetOpen}
        onSubmit={handleConvenioSubmit}
        editItem={editConvenio}
        isSaving={isSaving}
      />

      {/* Category Sheet */}
      <CategorySheet
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        onSubmit={handleCategorySubmit}
        editItem={editCategory}
        isSaving={isCatSaving}
      />

      {/* Delete Convenio dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConvenio}
        title={t.convenios.deleteTitle}
        description={t.convenios.deleteDesc.replace('{name}', deleteTarget?.name ?? '')}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Delete Category dialog */}
      <ConfirmDialog
        open={!!deleteCatTarget}
        onOpenChange={(open) => { if (!open) setDeleteCatTarget(null); }}
        onConfirm={handleDeleteCategory}
        title={t.convenios.deleteCategory}
        description={t.convenios.deleteCategoryDesc}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isCatDeleting}
      />
    </>
  );
}
