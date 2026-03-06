'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { subscribe, getToasts, toast, type ToastItem } from '@/lib/utils/toast';
import { CircleCheck, CircleX, Info, X } from 'lucide-react';

const icons: Record<ToastItem['type'], React.ReactNode> = {
  success: <CircleCheck className="w-4 h-4 text-green-400 shrink-0" />,
  error:   <CircleX className="w-4 h-4 text-red-400 shrink-0" />,
  info:    <Info className="w-4 h-4 text-blue-400 shrink-0" />,
};

const borderColors: Record<ToastItem['type'], string> = {
  success: 'border-green-500/20',
  error:   'border-red-500/20',
  info:    'border-blue-500/20',
};

export function ToasterProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setToasts(getToasts());
    return subscribe(setToasts);
  }, []);

  const handleDismiss = useCallback((id: number) => {
    toast.dismiss(id);
  }, []);

  if (!mounted) return null;

  return createPortal(
    toasts.length > 0 ? (
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 bg-slate-800 border ${borderColors[t.type]} rounded-xl px-4 py-3 shadow-lg`}
            style={{ animation: 'slideIn 200ms ease-out' }}
          >
            {icons[t.type]}
            <p className="text-sm text-slate-200 flex-1">{t.message}</p>
            <button
              onClick={() => handleDismiss(t.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    ) : null,
    document.body,
  );
}
