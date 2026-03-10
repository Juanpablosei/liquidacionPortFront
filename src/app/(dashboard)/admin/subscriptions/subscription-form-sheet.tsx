'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import { createSubscription, updateSubscription, listPlans, listAdminCompanies } from '@/lib/api/admin';
import { createSubscriptionSchema, updateSubscriptionSchema } from '@/lib/validators/admin';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '@/lib/validators/admin';
import type { Subscription, SubscriptionPlan } from '@/lib/types/admin';

const INPUT_CLASS =
  'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';
const SELECT_CLASS =
  'w-full h-9 rounded-md border border-white/[0.1] bg-white/[0.05] px-3 text-sm text-white focus:border-[#2563EB]/50 focus:outline-none';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
  onSuccess: () => void;
}

export function SubscriptionFormSheet({ open, onOpenChange, subscription, onSuccess }: Props) {
  const t = useTranslation();
  const isEdit = !!subscription;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const createForm = useForm<CreateSubscriptionInput>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: { companyId: '', planId: '', billingCycle: 'MONTHLY', notes: '' },
  });

  const editForm = useForm<UpdateSubscriptionInput>({
    resolver: zodResolver(updateSubscriptionSchema),
  });

  useEffect(() => {
    if (!open) return;
    listPlans().then(setPlans).catch(() => {});
    if (!isEdit) {
      listAdminCompanies({ limit: 100 }).then((r) => setCompanies(r.items)).catch(() => {});
    }
  }, [open, isEdit]);

  useEffect(() => {
    if (open && subscription) {
      editForm.reset({
        planId: subscription.planId,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
        effectivePrice: Number(subscription.effectivePrice),
        notes: subscription.notes ?? '',
      });
    }
    if (open && !subscription) {
      createForm.reset({ companyId: '', planId: '', billingCycle: 'MONTHLY', notes: '' });
    }
  }, [open, subscription, editForm, createForm]);

  async function handleCreate(data: CreateSubscriptionInput) {
    try {
      await createSubscription(data);
      toast.success(t.admin.subscriptionCreated);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.admin.saveError);
    }
  }

  async function handleUpdate(data: UpdateSubscriptionInput) {
    if (!subscription) return;
    try {
      await updateSubscription(subscription.id, data);
      toast.success(t.admin.subscriptionUpdated);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.admin.saveError);
    }
  }

  const statusOptions = [
    { value: 'TRIAL', label: t.admin.statusTrial },
    { value: 'ACTIVE', label: t.admin.statusActive },
    { value: 'PAST_DUE', label: t.admin.statusPastDue },
    { value: 'BLOCKED', label: t.admin.statusBlocked },
    { value: 'CANCELLED', label: t.admin.statusCancelled },
  ];

  const cycleOptions = [
    { value: 'MONTHLY', label: t.admin.cycleMonthly },
    { value: 'ANNUAL', label: t.admin.cycleAnnual },
  ];

  if (isEdit) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = editForm;
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="bg-[#0A0F1C] border-l border-white/[0.08] text-white overflow-y-auto w-[420px] max-w-[100vw]">
          <SheetHeader className="pb-4 border-b border-white/[0.06]">
            <SheetTitle className="text-white">{t.admin.editSubscription}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(handleUpdate)} className="flex flex-col gap-5 p-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">{t.admin.company}</p>
              <p className="text-sm text-white font-medium">{subscription?.company?.name ?? '—'}</p>
            </div>

            <FormField label={t.admin.plan} name="planId" error={errors.planId?.message}>
              <select {...register('planId')} className={SELECT_CLASS}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label={t.admin.billingCycle} name="billingCycle" error={errors.billingCycle?.message}>
              <select {...register('billingCycle')} className={SELECT_CLASS}>
                {cycleOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label={t.admin.changeStatus} name="status" error={errors.status?.message}>
              <select {...register('status')} className={SELECT_CLASS}>
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label={t.admin.effectivePrice} name="effectivePrice" error={errors.effectivePrice?.message}>
              <Input
                {...register('effectivePrice', { valueAsNumber: true })}
                type="number"
                min={0}
                step="0.01"
                className={cn(INPUT_CLASS, 'font-mono')}
              />
            </FormField>

            <FormField label={t.admin.notes} name="notes">
              <Input {...register('notes')} className={INPUT_CLASS} />
            </FormField>

            <SheetFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? '...' : t.common.save}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  // Create mode
  const { register, handleSubmit, formState: { errors, isSubmitting } } = createForm;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#0A0F1C] border-l border-white/[0.08] text-white overflow-y-auto w-[420px] max-w-[100vw]">
        <SheetHeader className="pb-4 border-b border-white/[0.06]">
          <SheetTitle className="text-white">{t.admin.newSubscription}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-5 p-4">
          <FormField label={t.admin.selectCompany} name="companyId" error={errors.companyId?.message} required>
            <select {...register('companyId')} className={SELECT_CLASS}>
              <option value="">—</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label={t.admin.selectPlan} name="planId" error={errors.planId?.message} required>
            <select {...register('planId')} className={SELECT_CLASS}>
              <option value="">—</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </FormField>

          <FormField label={t.admin.billingCycle} name="billingCycle">
            <select {...register('billingCycle')} className={SELECT_CLASS}>
              {cycleOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label={t.admin.notes} name="notes">
            <Input {...register('notes')} className={INPUT_CLASS} />
          </FormField>

          <SheetFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '...' : t.common.save}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
