'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Hash, TrendingUp, Clock, Sliders, Tags, FunctionSquare } from 'lucide-react';
import { listConcepts, createConcept, updateConcept, deleteConcept } from '@/lib/api/concepts';
import { conceptSchema, type ConceptInput } from '@/lib/validators/concept';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader }    from '@/components/shared/page-header';
import { DataTable }     from '@/components/shared/data-table';
import { FormField }     from '@/components/shared/form-field';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusBadge }   from '@/components/shared/status-badge';
import { RoleGate }      from '@/components/shared/role-gate';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { FormulaEditor } from '@/components/concepts/formula-editor';
import type { PayrollConcept, ConceptCalcType } from '@/lib/types/payroll';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

type ActiveTab = 'EARNING' | 'DEDUCTION';

function formatAmount(concept: PayrollConcept, locale: string): string {
  const nf = new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS' });
  switch (concept.calcType) {
    case 'FIXED':
      return concept.fixedAmount ? nf.format(Number(concept.fixedAmount)) : '—';
    case 'PERCENT':
      return concept.percentValue ? `${concept.percentValue}%` : '—';
    case 'HOURLY':
      return concept.hourlyRate ? `${nf.format(Number(concept.hourlyRate))}/h` : '—';
    case 'MANUAL':
      return '—';
    case 'FORMULA':
      return concept.formula ? `ƒ(x)` : '—';
  }
}

export default function ConceptsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { isManager, canEdit, canDelete } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const calcTypeConfig: Record<ConceptCalcType, { label: string; icon: React.ReactNode; color: string }> = {
    FIXED:   { label: t.concepts.fixed,    icon: <Hash   className="w-3 h-3" />, color: 'text-blue-400' },
    PERCENT: { label: t.concepts.percent,  icon: <TrendingUp className="w-3 h-3" />, color: 'text-violet-400' },
    HOURLY:  { label: t.concepts.hourly,   icon: <Clock  className="w-3 h-3" />, color: 'text-cyan-400' },
    MANUAL:  { label: t.concepts.manual,   icon: <Sliders className="w-3 h-3" />, color: 'text-muted-foreground' },
    FORMULA: { label: t.concepts.formula,  icon: <FunctionSquare className="w-3 h-3" />, color: 'text-amber-400' },
  };

  const [concepts,    setConcepts]    = useState<PayrollConcept[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [activeTab,   setActiveTab]   = useState<ActiveTab>('EARNING');
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editItem,    setEditItem]    = useState<PayrollConcept | null>(null);
  const [deleteItem,  setDeleteItem]  = useState<PayrollConcept | null>(null);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ConceptInput>({
    resolver: zodResolver(conceptSchema(t.validators)),
    defaultValues: { category: 'EARNING', calcType: 'FIXED', percentBase: 'BASIC', sortOrder: '0' },
  });

  const watchedCalcType = watch('calcType');

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    listConcepts(companyId)
      .then(setConcepts)
      .catch((err: Error) => toast.error(err.message ?? t.concepts.loadError))
      .finally(() => setIsLoading(false));
  }, [companyId, t.concepts.loadError]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditItem(null);
    reset({
      code:         '',
      name:         '',
      category:     activeTab,
      calcType:     'FIXED',
      fixedAmount:  '',
      percentValue: '',
      percentBase:  'BASIC',
      hourlyRate:   '',
      formula:      '',
      sortOrder:    '0',
    });
    setSheetOpen(true);
  }

  function openEdit(item: PayrollConcept) {
    setEditItem(item);
    reset({
      code:         item.code,
      name:         item.name,
      category:     item.category,
      calcType:     item.calcType,
      fixedAmount:  item.fixedAmount  ?? '',
      percentValue: item.percentValue ?? '',
      percentBase:  item.percentBase,
      hourlyRate:   item.hourlyRate   ?? '',
      formula:      item.formula      ?? '',
      sortOrder:    String(item.sortOrder),
    });
    setSheetOpen(true);
  }

  async function onSubmit(data: ConceptInput) {
    setIsSaving(true);
    try {
      const payload = {
        code:         data.code,
        name:         data.name,
        category:     data.category,
        calcType:     data.calcType,
        sortOrder:    data.sortOrder !== undefined && data.sortOrder !== '' ? Number(data.sortOrder) : undefined,
        fixedAmount:  data.calcType === 'FIXED'   ? data.fixedAmount  || undefined : undefined,
        percentValue: data.calcType === 'PERCENT' ? data.percentValue || undefined : undefined,
        percentBase:  data.calcType === 'PERCENT' ? data.percentBase              : undefined,
        hourlyRate:   data.calcType === 'HOURLY'  ? data.hourlyRate   || undefined : undefined,
        formula:      data.calcType === 'FORMULA' ? data.formula       || undefined : undefined,
      };

      if (editItem) {
        await updateConcept(companyId, editItem.id, payload);
        toast.success(t.concepts.updated);
      } else {
        await createConcept(companyId, payload);
        toast.success(t.concepts.created);
      }
      setSheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.concepts.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(item: PayrollConcept) {
    try {
      await updateConcept(companyId, item.id, { isActive: !item.isActive });
      toast.success(item.isActive ? t.concepts.deactivated : t.concepts.activated);
      load();
    } catch {
      toast.error(t.concepts.statusError);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteConcept(companyId, deleteItem.id);
      toast.success(t.concepts.deleted);
      setDeleteItem(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.concepts.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  const filtered = concepts.filter((c) => c.category === activeTab);

  const earningsCount   = concepts.filter((c) => c.category === 'EARNING').length;
  const deductionsCount = concepts.filter((c) => c.category === 'DEDUCTION').length;

  const columns: ColumnDef<PayrollConcept>[] = [
    {
      header: t.concepts.code,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground bg-overlay-subtle px-2 py-0.5 rounded border border-border">
          {row.original.code}
        </span>
      ),
    },
    {
      header: t.concepts.name,
      cell: ({ row }) => (
        <span className="text-sm text-foreground font-medium">{row.original.name}</span>
      ),
    },
    {
      header: t.concepts.calcType,
      cell: ({ row }) => {
        const cfg = calcTypeConfig[row.original.calcType];
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: t.concepts.value,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">{formatAmount(row.original, localeId)}</span>
      ),
    },
    {
      header: t.concepts.status,
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      header: t.concepts.order,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">{row.original.sortOrder}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          {canEdit() && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleActive(row.original); }}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  row.original.isActive
                    ? 'text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.06]'
                    : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/[0.06]'
                }`}
                title={row.original.isActive ? t.concepts.deactivate : t.concepts.activate}
              >
                {row.original.isActive ? t.concepts.deactivate : t.concepts.activate}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(row.original); }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-overlay transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                aria-label={t.common.edit}
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
          {canDelete() && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteItem(row.original); }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              aria-label={t.common.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">{t.common.noPermission}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t.concepts.title}
        description={t.concepts.description}
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.concepts.newConcept}
            </button>
          </RoleGate>
        }
      />

      {/* Tabs Haberes / Deducciones */}
      <div className="flex items-center gap-1 mb-5 bg-overlay-subtle border border-border rounded-xl p-1 w-fit">
        {([
          { key: 'EARNING',   label: t.concepts.earnings,   count: earningsCount,   color: 'text-emerald-400' },
          { key: 'DEDUCTION', label: t.concepts.deductions, count: deductionsCount, color: 'text-red-400' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-overlay-strong text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-muted-foreground'
            }`}
          >
            {tab.label}
            <span className={`text-xs font-mono ${activeTab === tab.key ? tab.color : 'text-muted-foreground'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        total={filtered.length}
        page={1}
        limit={filtered.length || 1}
        isLoading={isLoading}
        onPageChange={() => {}}
        emptyMessage={activeTab === 'EARNING' ? t.concepts.noEarnings : t.concepts.noDeductions}
        emptyIcon={<Tags className="w-6 h-6" />}
        emptyDescription={
          activeTab === 'EARNING'
            ? t.concepts.earningsEmpty
            : t.concepts.deductionsEmpty
        }
        emptyAction={
          canEdit() ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.concepts.newConcept}
            </button>
          ) : undefined
        }
      />

      {/* Sheet crear/editar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className="bg-sidebar border-l border-border text-foreground overflow-y-auto"
          style={{ width: 440, maxWidth: '100vw' }}
        >
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-foreground">
              {editItem ? t.concepts.editTitle : t.concepts.createTitle}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">

            {/* Codigo + Orden */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.concepts.code} name="code" error={errors.code?.message} required>
                <Input
                  {...register('code')}
                  maxLength={20}
                  placeholder={t.concepts.codePlaceholder}
                  className={`${INPUT_CLASS} font-mono uppercase`}
                />
              </FormField>
              <FormField label={t.concepts.order} name="sortOrder" error={errors.sortOrder?.message}>
                <Input
                  type="number"
                  min={0}
                  {...register('sortOrder')}
                  className={`${INPUT_CLASS} font-mono`}
                />
              </FormField>
            </div>

            <FormField label={t.concepts.name} name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                maxLength={100}
                placeholder={t.concepts.namePlaceholder}
                className={INPUT_CLASS}
              />
            </FormField>

            {/* Categoria */}
            <FormField label={t.concepts.category} name="category" error={errors.category?.message} required>
              <div className="grid grid-cols-2 gap-2">
                {(['EARNING', 'DEDUCTION'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                      watch('category') === cat
                        ? cat === 'EARNING'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-red-500/20 border-red-500/40 text-red-300'
                        : 'bg-overlay-subtle border-border text-muted-foreground hover:border-border'
                    }`}
                  >
                    {cat === 'EARNING' ? t.concepts.categoryEarning : t.concepts.categoryDeduction}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Tipo de calculo */}
            <FormField label={t.concepts.calcTypeLabel} name="calcType" error={errors.calcType?.message} required>
              <div className="grid grid-cols-2 gap-2">
                {(['FIXED', 'PERCENT', 'HOURLY', 'MANUAL', 'FORMULA'] as const).map((type) => {
                  const cfg = calcTypeConfig[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('calcType', type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                        watchedCalcType === type
                          ? 'bg-brand/20 border-brand/40 text-brand-text'
                          : 'bg-overlay-subtle border-border text-muted-foreground hover:border-border'
                      }`}
                    >
                      <span className={watchedCalcType === type ? 'text-brand-text' : cfg.color}>
                        {cfg.icon}
                      </span>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Campos dinamicos segun calcType */}
            {watchedCalcType === 'FIXED' && (
              <FormField label={t.concepts.fixedAmount} name="fixedAmount" error={errors.fixedAmount?.message}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('fixedAmount')}
                  placeholder="0.00"
                  className={`${INPUT_CLASS} font-mono`}
                />
              </FormField>
            )}

            {watchedCalcType === 'PERCENT' && (
              <>
                <FormField label={t.concepts.percentAmount} name="percentValue" error={errors.percentValue?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('percentValue')}
                    placeholder="0.00"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </FormField>
                <FormField label={t.concepts.calcBase} name="percentBase" error={errors.percentBase?.message}>
                  <div className="grid grid-cols-2 gap-2">
                    {(['BASIC', 'GROSS'] as const).map((base) => (
                      <button
                        key={base}
                        type="button"
                        onClick={() => setValue('percentBase', base)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                          watch('percentBase') === base
                            ? 'bg-brand/20 border-brand/40 text-brand-text'
                            : 'bg-overlay-subtle border-border text-muted-foreground hover:border-border'
                        }`}
                      >
                        {base === 'BASIC' ? t.concepts.calcBaseBasic : t.concepts.calcBaseGross}
                      </button>
                    ))}
                  </div>
                </FormField>
              </>
            )}

            {watchedCalcType === 'HOURLY' && (
              <FormField label={t.concepts.hourlyAmount} name="hourlyRate" error={errors.hourlyRate?.message}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('hourlyRate')}
                  placeholder="0.00"
                  className={`${INPUT_CLASS} font-mono`}
                />
              </FormField>
            )}

            {watchedCalcType === 'MANUAL' && (
              <div className="rounded-lg bg-overlay-subtle border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.concepts.manualNote}
                </p>
              </div>
            )}

            {watchedCalcType === 'FORMULA' && (
              <FormField label={t.concepts.formulaLabel} name="formula" error={errors.formula?.message} required>
                <FormulaEditor
                  companyId={companyId}
                  value={watch('formula') ?? ''}
                  onChange={(v) => setValue('formula', v, { shouldValidate: true })}
                  error={errors.formula?.message}
                />
              </FormField>
            )}

            <SheetFooter className="px-0 mt-2 flex-row gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand hover:bg-brand-hover text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? t.common.saving : t.common.save}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        onConfirm={handleDelete}
        title={t.concepts.deleteTitle}
        description={t.concepts.deleteDesc.replace('{name}', deleteItem?.name ?? '')}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
