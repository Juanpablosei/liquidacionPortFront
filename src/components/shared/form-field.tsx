'use client';

import { Children, cloneElement, isValidElement } from 'react';
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
  const describedBy = [
    hint && !error ? `${name}-hint` : null,
    error ? `${name}-error` : null,
  ].filter(Boolean).join(' ') || undefined;

  // Inject id + aria-describedby into the first child element (Input/Select/etc.)
  const enhanced = Children.map(children, (child, i) => {
    if (i === 0 && isValidElement<Record<string, unknown>>(child)) {
      return cloneElement(child, {
        id: (child.props.id as string) ?? name,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      });
    }
    return child;
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label
        htmlFor={name}
        className={cn(
          'text-sm font-medium text-muted-foreground',
          required && "after:content-['*'] after:ml-0.5 after:text-red-400",
        )}
      >
        {label}
      </Label>
      {enhanced}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}
