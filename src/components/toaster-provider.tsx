'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

export function ToasterProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'var(--font-geist-sans)',
        },
      }}
    />
  );
}
