'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Hash, TrendingUp, Clock, Sliders, Tags } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import type { PayrollConcept, ConceptCalcType } from '@/lib/types/payroll';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

type ActiveTab = 'EARNING' | 'DEDUCTION';

const CALC_TYPE_CONFIG: Record<ConceptCalcType, { label: string; icon: React.ReactNode; color: string }> = {
  FIXED:   { label: 'Fijo',        icon: <Hash   className="w-3 h-3" />, color: 'text-blue-400' },
  PERCENT: { label: 'Porcentaje',  icon: <TrendingUp className="w-3 h-3" />, color: 'text-violet-400' },
  HOURLY:  { label: 'Por hora',    icon: <Clock  className="w-3 h-3" />, color: 'text-cyan-400' },
  MANUAL:  { label: 'Manual',      icon: <Sliders className="w-3 h-3" />, color: 'text-slate-400' },
};

function formatAmount(concept: PayrollConcept): string {
  switch (concept.calcType) {
    case 'FIXED':
      return concept.fixedAmount
        ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(concept.fixedAmount))
        : '—';
    case 'PERCENT':
      return concept.percentValue ? `${concept.percentValue}%` : '—';
    case 'HOURLY':
      return concept.hourlyRate
        ? `${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(concept.hourlyRate))}/h`
        : '—';
    case 'MANUAL':
      return '—';
  }
}

export default function ConceptsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { isManager, canEdit, canDelete } = usePermissions();

  const [concepts,    setConcepts]    = useState<PayrollConcept[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [activeTab,   setActiveTab]   = useState<ActiveTab>('EARNING');
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editItem,    setEditItem]    = useState<PayrollConcept | null>(null);
  const [deleteItem,  setDeleteItem]  = useState<PayrollConcept | null>(null);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ConceptInput>({
    resolver: zodResolver(conceptSchema),
    defaultValues: { category: 'EARNING', calcType: 'FIXED', percentBase: 'BASIC', sortOrder: '0' },
  });

  const watchedCalcType = watch('calcType');

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    listConcepts(companyId)
      .then(setConcepts)
      .catch((err: Error) => toast.error(err.message ?? 'Error al cargar conceptos'))
      .finally(() => setIsLoading(false));
  }, [companyId]);

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
      };

      if (editItem) {
        await updateConcept(companyId, editItem.id, payload);
        toast.success('Concepto actualizado');
      } else {
        await createConcept(companyId, payload);
        toast.success('Concepto creado');
      }
      setSheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(item: PayrollConcept) {
    try {
      await updateConcept(companyId, item.id, { isActive: !item.isActive });
      toast.success(item.isActive ? 'Concepto desactivado' : 'Concepto activado');
      load();
    } catch {
      toast.error('Error al cambiar estado');
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteConcept(companyId, deleteItem.id);
      toast.success('Concepto eliminado');
      setDeleteItem(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  }

  const filtered = concepts.filter((c) => c.category === activeTab);

  const earningsCount   = concepts.filter((c) => c.category === 'EARNING').length;
  const deductionsCount = concepts.filter((c) => c.category === 'DEDUCTION').length;

  const columns: ColumnDef<PayrollConcept>[] = [
    {
      header: 'Código',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
          {row.original.code}
        </span>
      ),
    },
    {
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="text-sm text-white font-medium">{row.original.name}</span>
      ),
    },
    {
      header: 'Tipo cálculo',
      cell: ({ row }) => {
        const cfg = CALC_TYPE_CONFIG[row.original.calcType];
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: 'Valor',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-300">{formatAmount(row.original)}</span>
      ),
    },
    {
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      header: 'Orden',
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 font-mono">{row.original.sortOrder}</span>
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
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  row.original.isActive
                    ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06]'
                    : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/[0.06]'
                }`}
                title={row.original.isActive ? 'Desactivar' : 'Activar'}
              >
                {row.original.isActive ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(row.original); }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Editar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {canDelete() && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteItem(row.original); }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">No tenés permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Conceptos de nómina"
        description="Haberes y deducciones que componen la liquidación."
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo concepto
            </button>
          </RoleGate>
        }
      />

      {/* Tabs Haberes / Deducciones */}
      <div className="flex items-center gap-1 mb-5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
        {([
          { key: 'EARNING',   label: 'Haberes',     count: earningsCount,   color: 'text-emerald-400' },
          { key: 'DEDUCTION', label: 'Deducciones', count: deductionsCount, color: 'text-red-400' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
            <span className={`text-xs font-mono ${activeTab === tab.key ? tab.color : 'text-slate-600'}`}>
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
        emptyMessage={`Sin ${activeTab === 'EARNING' ? 'haberes' : 'deducciones'}`}
        emptyIcon={<Tags className="w-6 h-6" />}
        emptyDescription={
          activeTab === 'EARNING'
            ? 'Los haberes son los componentes que suman al sueldo bruto. Creá el primero para empezar.'
            : 'Las deducciones se restan del bruto. Ej: IPS, impuestos, anticipos.'
        }
        emptyAction={
          canEdit() ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo concepto
            </button>
          ) : undefined
        }
      />

      {/* Sheet crear/editar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className="bg-[#060B16] border-l border-white/[0.08] text-white overflow-y-auto"
          style={{ width: 440, maxWidth: '100vw' }}
        >
          <SheetHeader className="pb-4 border-b border-white/[0.06]">
            <SheetTitle className="text-white">
              {editItem ? 'Editar concepto' : 'Nuevo concepto'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">

            {/* Código + Nombre */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Código" name="code" error={errors.code?.message} required>
                <Input
                  {...register('code')}
                  placeholder="ej. BASICO"
                  className={`${INPUT_CLASS} font-mono uppercase`}
                />
              </FormField>
              <FormField label="Orden" name="sortOrder" error={errors.sortOrder?.message}>
                <Input
                  type="number"
                  min={0}
                  {...register('sortOrder')}
                  className={`${INPUT_CLASS} font-mono`}
                />
              </FormField>
            </div>

            <FormField label="Nombre" name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                placeholder="ej. Sueldo básico"
                className={INPUT_CLASS}
              />
            </FormField>

            {/* Categoría */}
            <FormField label="Categoría" name="category" error={errors.category?.message} required>
              <div className="grid grid-cols-2 gap-2">
                {(['EARNING', 'DEDUCTION'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                      watch('category') === cat
                        ? cat === 'EARNING'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-red-500/20 border-red-500/40 text-red-300'
                        : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                    }`}
                  >
                    {cat === 'EARNING' ? 'Haber' : 'Deducción'}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Tipo de cálculo */}
            <FormField label="Tipo de cálculo" name="calcType" error={errors.calcType?.message} required>
              <div className="grid grid-cols-2 gap-2">
                {(['FIXED', 'PERCENT', 'HOURLY', 'MANUAL'] as const).map((type) => {
                  const cfg = CALC_TYPE_CONFIG[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('calcType', type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        watchedCalcType === type
                          ? 'bg-[#2563EB]/20 border-[#2563EB]/40 text-[#93BBFC]'
                          : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                      }`}
                    >
                      <span className={watchedCalcType === type ? 'text-[#93BBFC]' : cfg.color}>
                        {cfg.icon}
                      </span>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Campos dinámicos según calcType */}
            {watchedCalcType === 'FIXED' && (
              <FormField label="Monto fijo (ARS)" name="fixedAmount" error={errors.fixedAmount?.message}>
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
                <FormField label="Porcentaje (%)" name="percentValue" error={errors.percentValue?.message}>
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
                <FormField label="Base de cálculo" name="percentBase" error={errors.percentBase?.message}>
                  <div className="grid grid-cols-2 gap-2">
                    {(['BASIC', 'GROSS'] as const).map((base) => (
                      <button
                        key={base}
                        type="button"
                        onClick={() => setValue('percentBase', base)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                          watch('percentBase') === base
                            ? 'bg-[#2563EB]/20 border-[#2563EB]/40 text-[#93BBFC]'
                            : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                        }`}
                      >
                        {base === 'BASIC' ? 'Básico' : 'Bruto'}
                      </button>
                    ))}
                  </div>
                </FormField>
              </>
            )}

            {watchedCalcType === 'HOURLY' && (
              <FormField label="Valor por hora (ARS)" name="hourlyRate" error={errors.hourlyRate?.message}>
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
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  El monto se ingresa manualmente en cada recibo de sueldo al momento de liquidar.
                </p>
              </div>
            )}

            <SheetFooter className="px-0 mt-2 flex-row gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        onConfirm={handleDelete}
        title="Eliminar concepto"
        description={`¿Estás seguro de que querés eliminar "${deleteItem?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
