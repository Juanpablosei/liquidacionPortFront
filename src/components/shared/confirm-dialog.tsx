'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  default: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
  danger:  'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  variant      = 'default',
  isLoading    = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F172A] border border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-slate-400">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${CONFIRM_STYLES[variant]}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
