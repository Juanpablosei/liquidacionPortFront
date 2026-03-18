'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import { createPayment } from '@/lib/api/admin';
import { createPaymentSchema } from '@/lib/validators/admin';
import type { CreatePaymentInput } from '@/lib/validators/admin';

const INPUT_CLASS =
  'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  onSuccess: () => void;
}

export function PaymentFormSheet({ open, onOpenChange, subscriptionId, onSuccess }: Props) {
  const t = useTranslation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: { amount: 0, periodStart: '', periodEnd: '', notes: '' },
  });

  async function onSubmit(data: CreatePaymentInput) {
    try {
      await createPayment(subscriptionId, data);
      toast.success(t.admin.paymentCreated);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.admin.saveError);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background border-l border-border text-foreground w-[400px] max-w-[100vw]">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-foreground">{t.admin.newPayment}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-4">
          <FormField label={t.admin.paymentAmount} name="amount" error={errors.amount?.message} required>
            <Input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              min={0.01}
              step="0.01"
              className={cn(INPUT_CLASS, 'font-mono')}
            />
          </FormField>

          <FormField label={t.admin.periodStart} name="periodStart" error={errors.periodStart?.message} required>
            <Input {...register('periodStart')} type="date" className={INPUT_CLASS} />
          </FormField>

          <FormField label={t.admin.periodEnd} name="periodEnd" error={errors.periodEnd?.message} required>
            <Input {...register('periodEnd')} type="date" className={INPUT_CLASS} />
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
