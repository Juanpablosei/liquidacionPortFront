'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label:     string;
  name:      string;
  error?:    string;
  required?: boolean;
  hint?:     string;
  children:  React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  name,
  error,
  required,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label
        htmlFor={name}
        className={cn(
          'text-sm font-medium text-slate-300',
          required && "after:content-['*'] after:ml-0.5 after:text-red-400",
        )}
      >
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
