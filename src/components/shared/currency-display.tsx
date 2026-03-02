import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount:    string | number | null;
  currency?: string;
  hidden?:   boolean;
  className?: string;
}

const formatter = new Intl.NumberFormat('es-AR', {
  style:    'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

export function CurrencyDisplay({
  amount,
  currency = 'ARS',
  hidden   = false,
  className,
}: CurrencyDisplayProps) {
  if (hidden) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('text-slate-600 font-mono cursor-default', className)}>—</span>
        </TooltipTrigger>
        <TooltipContent>Sin acceso</TooltipContent>
      </Tooltip>
    );
  }

  if (amount === null || amount === undefined) {
    return <span className={cn('text-slate-500', className)}>—</span>;
  }

  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numeric)) {
    return <span className={cn('text-slate-500', className)}>—</span>;
  }

  const customFormatter = currency !== 'ARS'
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 })
    : formatter;

  return (
    <span className={cn('font-mono tabular-nums text-white', className)}>
      {customFormatter.format(numeric)}
    </span>
  );
}
