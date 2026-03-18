import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthHydrator } from '@/components/auth-hydrator';
import { ThemeProvider } from '@/components/theme-provider';
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
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('ui-storage')||'{}');var t=(s.state&&s.state.theme)||'dark';if(t==='system'){t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TooltipProvider>
          <AuthHydrator />
          <ThemeProvider />
          {children}
        </TooltipProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
