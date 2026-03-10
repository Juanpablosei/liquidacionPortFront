'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { Scale, Plus } from 'lucide-react';
import {
  listCompanyConvenios,
  cloneConvenio,
  createConvenio,
  updateConvenio,
  deleteConvenio,
  addCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api/convenios';
import { PageHeader }      from '@/components/shared/page-header';
import { EmptyState }      from '@/components/shared/empty-state';
import { LoadingSkeleton }  from '@/components/shared/loading-skeleton';
import { RoleGate }        from '@/components/shared/role-gate';
import { ConfirmDialog }   from '@/components/shared/confirm-dialog';
import { usePermissions }  from '@/lib/hooks/use-permissions';
import { useTranslation }  from '@/lib/i18n';
import { ConvenioSection } from './_components/convenio-section';
import { ConvenioFormSheet } from './convenio-form-sheet';
import { CategoryFormSheet } from './category-form-sheet';
import type { Convenio, ConvenioCategory, CompanyConveniosResponse } from '@/lib/types/convenio';
import type { CreateConvenioInput, CreateCategoryInput } from '@/lib/validators/convenio';

export default function ConveniosPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const t = useTranslation();
  const { canEdit } = usePermissions();

  const [data, setData] = useState<CompanyConveniosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  // Convenio CRUD state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editConvenio, setEditConvenio] = useState<Convenio | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Convenio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category CRUD state
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [catConvenioId, setCatConvenioId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<ConvenioCategory | null>(null);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<{ cat: ConvenioCategory; convenioId: string } | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listCompanyConvenios(companyId);
      setData(res);
    } catch {
      toast.error(t.convenios.loadError);
    } finally {
      setLoading(false);
    }
  }, [companyId, t.convenios.loadError]);

  useEffect(() => { load(); }, [load]);

  // ─── Convenio handlers ────────────────────────────────────────────────────

  function openCreateConvenio() {
    setEditConvenio(null);
    setSheetOpen(true);
  }

  function openEditConvenio(conv: Convenio) {
    setEditConvenio(conv);
    setSheetOpen(true);
  }

  async function handleConvenioSubmit(formData: CreateConvenioInput) {
    setIsSaving(true);
    try {
      if (editConvenio) {
        await updateConvenio(companyId, editConvenio.id, formData);
        toast.success(t.convenios.updated);
      } else {
        await createConvenio(companyId, formData);
        toast.success(t.convenios.created);
      }
      setSheetOpen(false);
      load();
    } catch {
      toast.error(t.convenios.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteConvenio() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteConvenio(companyId, deleteTarget.id);
      toast.success(t.convenios.deleted);
      setDeleteTarget(null);
      load();
    } catch {
      toast.error(t.convenios.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleClone(id: string) {
    try {
      setCloning(id);
      await cloneConvenio(companyId, id);
      toast.success(t.convenios.cloned);
      load();
    } catch {
      toast.error(t.convenios.cloneError);
    } finally {
      setCloning(null);
    }
  }

  // ─── Category handlers ────────────────────────────────────────────────────

  function openCreateCategory(convenioId: string) {
    setCatConvenioId(convenioId);
    setEditCategory(null);
    setCatSheetOpen(true);
  }

  function openEditCategory(convenioId: string, cat: ConvenioCategory) {
    setCatConvenioId(convenioId);
    setEditCategory(cat);
    setCatSheetOpen(true);
  }

  async function handleCategorySubmit(formData: CreateCategoryInput) {
    if (!catConvenioId) return;
    setIsSavingCat(true);
    try {
      if (editCategory) {
        await updateCategory(companyId, editCategory.id, formData);
        toast.success(t.convenios.categoryUpdated);
      } else {
        await addCategory(companyId, catConvenioId, formData);
        toast.success(t.convenios.categoryCreated);
      }
      setCatSheetOpen(false);
      load();
    } catch {
      toast.error(t.convenios.categoryError);
    } finally {
      setIsSavingCat(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCatTarget) return;
    setIsDeletingCat(true);
    try {
      await deleteCategory(companyId, deleteCatTarget.cat.id);
      toast.success(t.convenios.categoryDeleted);
      setDeleteCatTarget(null);
      load();
    } catch {
      toast.error(t.convenios.categoryError);
    } finally {
      setIsDeletingCat(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (loading) return <LoadingSkeleton variant="cards" />;

  const hasData = data && (data.own.length > 0 || data.global.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.convenios.title}
        description={t.convenios.description}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={openCreateConvenio}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563EB]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.convenios.newConvenio}
            </button>
          </RoleGate>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={<Scale className="w-6 h-6" />}
          title={t.convenios.emptyTitle}
          description={t.convenios.emptyDesc}
        />
      ) : (
        <div className="space-y-8">
          {data.own.length > 0 && (
            <ConvenioSection
              title={t.convenios.ownConvenios}
              convenios={data.own}
              expandedId={expandedId}
              onToggle={toggleExpand}
              t={t}
              badgeVariant="own"
              canEdit={canEdit()}
              onEdit={openEditConvenio}
              onDelete={setDeleteTarget}
              onAddCategory={openCreateCategory}
              onEditCategory={openEditCategory}
              onDeleteCategory={(convenioId, cat) => setDeleteCatTarget({ cat, convenioId })}
            />
          )}

          {data.global.length > 0 && (
            <ConvenioSection
              title={t.convenios.globalConvenios}
              convenios={data.global}
              expandedId={expandedId}
              onToggle={toggleExpand}
              t={t}
              badgeVariant="global"
              onClone={canEdit() ? handleClone : undefined}
              cloningId={cloning}
              canEdit={false}
            />
          )}
        </div>
      )}

      <ConvenioFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={handleConvenioSubmit}
        editItem={editConvenio}
        isSaving={isSaving}
      />

      <CategoryFormSheet
        open={catSheetOpen}
        onOpenChange={setCatSheetOpen}
        onSubmit={handleCategorySubmit}
        editItem={editCategory}
        isSaving={isSavingCat}
      />

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

      <ConfirmDialog
        open={!!deleteCatTarget}
        onOpenChange={(open) => { if (!open) setDeleteCatTarget(null); }}
        onConfirm={handleDeleteCategory}
        title={t.convenios.deleteCategory}
        description={t.convenios.deleteCategoryDesc}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isDeletingCat}
      />
    </div>
  );
}
