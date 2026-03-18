import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    template: '%s | Silent Port',
    default:  'Acceder — Silent Port',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden">

      {/* Grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow blobs */}
      <div className="fixed top-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-100px] right-[-50px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,163,74,0.06) 0%, transparent 70%)' }} />

      {/* Left panel — visible en pantallas grandes */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative z-10 border-r border-border p-10">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M2 7h6M2 10.5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Silent Port</span>
        </Link>

        {/* Center content */}
        <div>
          <p className="text-xs font-medium text-brand uppercase tracking-widest mb-4">
            Sistema de gestión
          </p>
          <h2 className="text-3xl font-semibold tracking-tight leading-snug mb-5">
            Tu nómina,<br />
            <span className="text-muted-foreground">bajo control.</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[320px]">
            Liquidaciones, contratos, asistencia y más.
            Todo en un mismo lugar.
          </p>

          {/* Mini stats */}
          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              { n: '1200+', label: 'Empresas' },
              { n: '48K+',  label: 'Empleados' },
              { n: '3 min', label: 'Por liquidación' },
              { n: '99%',   label: 'Uptime' },
            ].map((s) => (
              <div key={s.label}
                className="bg-overlay-subtle border border-border rounded-xl p-4">
                <p className="text-lg font-semibold text-foreground tabular-nums">{s.n}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className="border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            &quot;Antes tardábamos 4 horas en cerrar la nómina.
            Ahora son <span className="text-foreground font-medium">20 minutos</span>.&quot;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-xs font-semibold text-brand">
              CR
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Carmen Rodríguez</p>
              <p className="text-[11px] text-muted-foreground">RRHH — Construye S.A.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 lg:p-12">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5h10M2 7h6M2 10.5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Silent Port</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
