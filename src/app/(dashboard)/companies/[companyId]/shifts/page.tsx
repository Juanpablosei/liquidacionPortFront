'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Plus, Pencil, Trash2, CalendarClock } from 'lucide-react';
import { listShifts, createShift, updateShift, deleteShift } from '@/lib/api/shifts';
import { shiftSchema, type ShiftInput } from '@/lib/validators/attendance';
import { useTranslation } from '@/lib/i18n';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { RoleGate } from '@/components/shared/role-gate';
import { FormField } from '@/components/shared/form-field';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Shift } from '@/lib/types/shift';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';


export default function ShiftsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { canEdit, canDelete } = usePermissions();
  const t = useTranslation();
  const ts = t.shifts;

  const [shifts,     setShifts]     = useState<Shift[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [editItem,   setEditItem]   = useState<Shift | null>(null);
  const [deleteItem, setDeleteItem] = useState<Shift | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);

  const schema = useMemo(() => shiftSchema(t.validators), [t.validators]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShiftInput>({
    resolver: zodResolver(schema),
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listShifts(companyId);
      setShifts(Array.isArray(data) ? data : []);
    } catch {
      toast.error(ts.saveError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, ts.saveError]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditItem(null);
    reset({ name: '', description: '' });
    setSheetOpen(true);
  }

  function openEdit(s: Shift) {
    setEditItem(s);
    reset({ name: s.name, description: s.description ?? '' });
    setSheetOpen(true);
  }

  async function onSubmit(data: ShiftInput) {
    setIsSaving(true);
    try {
      if (editItem) {
        await updateShift(companyId, editItem.id, data);
        toast.success(ts.updated);
      } else {
        await createShift(companyId, data);
        toast.success(ts.created);
      }
      setSheetOpen(false);
      load();
    } catch {
      toast.error(ts.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteShift(companyId, deleteItem.id);
      toast.success(ts.deleted);
      setDeleteItem(null);
      load();
    } catch {
      toast.error(ts.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  const DAY_LABEL: Record<string, string> = {
    MONDAY: ts.monday, TUESDAY: ts.tuesday, WEDNESDAY: ts.wednesday,
    THURSDAY: ts.thursday, FRIDAY: ts.friday, SATURDAY: ts.saturday, SUNDAY: ts.sunday,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ts.title}
        description={ts.description}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <Button onClick={openCreate} size="sm" className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer">
              <Plus className="w-4 h-4" />
              {ts.addShift}
            </Button>
          </RoleGate>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-8 h-8 text-muted-foreground" />}
          title={ts.emptyTitle}
          description={ts.emptyDesc}
          action={
            canEdit() ? (
              <Button onClick={openCreate} size="sm" className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer">
                <Plus className="w-4 h-4" />
                {ts.emptyAction}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shifts.map((s) => (
            <div key={s.id} className="rounded-xl bg-card border border-border p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                  )}
                </div>
                <Badge variant={s.isActive ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
                  {s.isActive ? ts.active : ts.inactive}
                </Badge>
              </div>

              {s.schedule && s.schedule.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {s.schedule.map((entry) => (
                    <span key={entry.day} className="text-[10px] font-medium bg-brand/10 text-brand-text px-1.5 py-0.5 rounded">
                      {DAY_LABEL[entry.day] ?? entry.day}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{ts.noDays}</p>
              )}

              {(canEdit() || canDelete()) && (
                <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                  {canEdit() && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="gap-1.5 text-xs h-7 cursor-pointer">
                      <Pencil className="w-3 h-3" /> {t.common?.edit ?? 'Editar'}
                    </Button>
                  )}
                  {canDelete() && (
                    <Button variant="ghost" size="sm" onClick={() => setDeleteItem(s)} className="gap-1.5 text-xs h-7 text-red-400 hover:text-red-400 hover:bg-red-500/[0.06] cursor-pointer">
                      <Trash2 className="w-3 h-3" /> {t.common?.delete ?? 'Eliminar'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-sidebar border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">
              {editItem ? ts.editTitle : ts.createTitle}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
            <FormField name="name" label={ts.name} error={errors.name?.message}>
              <Input
                {...register('name')}
                placeholder={ts.namePlaceholder}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField name="description" label={ts.descriptionField} error={errors.description?.message}>
              <Input
                {...register('description')}
                placeholder={ts.descPlaceholder}
                className={INPUT_CLASS}
              />
            </FormField>
            <SheetFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                className="border-border cursor-pointer"
              >
                {t.common?.cancel ?? 'Cancelar'}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-brand hover:bg-brand/90 text-white cursor-pointer"
              >
                {isSaving ? '...' : (t.common?.save ?? 'Guardar')}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => { if (!o) setDeleteItem(null); }}
        title={ts.deleteTitle}
        description={ts.deleteDesc}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
