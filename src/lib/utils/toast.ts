type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastItem[]) => void;

let nextId = 0;
let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

function add(message: string, type: ToastType) {
  const id = ++nextId;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => remove(id), 5000);
  return id;
}

function remove(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export const toast = Object.assign(
  (message: string) => add(message, 'info'),
  {
    success: (message: string) => add(message, 'success'),
    error:   (message: string) => add(message, 'error'),
    dismiss: (id?: number)     => { if (id) remove(id); else { toasts = []; notify(); } },
  },
);

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getToasts() {
  return toasts;
}

export { type ToastItem };
