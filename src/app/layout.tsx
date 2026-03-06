import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthHydrator } from '@/components/auth-hydrator';
import { ToasterProvider } from '@/components/toaster-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Silent Port',
    default: 'Silent Port — Gestión de Nómina',
  },
  description: 'Sistema de gestión de nómina multi-tenant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TooltipProvider>
          <AuthHydrator />
          {children}
        </TooltipProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
