'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

interface ConfirmDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onConfirm:     () => void | Promise<void>;
  title:         string;
  description:   string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:      'default' | 'danger' | 'warning';
  isLoading?:    boolean;
}

const CONFIRM_STYLES: Record<string, string> = {
  default: 'bg-brand hover:bg-brand-hover text-white',
  danger:  'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant      = 'default',
  isLoading    = false,
}: ConfirmDialogProps) {
  const t = useTranslation();

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          >
            {cancelLabel ?? t.confirmDialog.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none ${CONFIRM_STYLES[variant]}`}
          >
            {isLoading ? t.confirmDialog.processing : (confirmLabel ?? t.confirmDialog.confirm)}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
