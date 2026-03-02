'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Users, FileText, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';

const BAR_DATA = [
  { month: 'Ago', value: 68, amount: '$2.1M' },
  { month: 'Sep', value: 75, amount: '$2.3M' },
  { month: 'Oct', value: 72, amount: '$2.2M' },
  { month: 'Nov', value: 88, amount: '$2.7M' },
  { month: 'Dic', value: 95, amount: '$2.9M' },
  { month: 'Ene', value: 82, amount: '$2.5M' },
  { month: 'Feb', value: 100, amount: '$3.1M' },
];

const LINE_POINTS = [
  [0, 70], [16, 62], [32, 68], [48, 55], [64, 45], [80, 38], [96, 30], [100, 28],
];

function toSvgPath(pts: number[][]): string {
  return pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');
}

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

function StatCard({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const count = useCountUp(value);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-4xl font-semibold text-white tracking-tight tabular-nums">
        {count.toLocaleString('es-AR')}{suffix}
      </span>
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}

const FEATURES = [
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Multi-empresa',
    desc: 'Gestioná múltiples empresas desde una sola cuenta con roles y permisos granulares.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Motor de liquidación',
    desc: 'Cálculo automático de haberes, deducciones y conceptos. Exportá en CSV con un clic.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Asistencia y overtime',
    desc: 'Registrá entradas, salidas y horas extra. El motor las incorpora en cada liquidación.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Roles y seguridad',
    desc: 'OWNER, ADMIN, MANAGER y MEMBER. Cada rol ve y hace exactamente lo que debe.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Liquidación en segundos',
    desc: 'Creá un período, ejecutá el run y revisá los recibos. El proceso completo en minutos.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Historial completo',
    desc: 'Contratos, asistencias y payslips nunca se borran. Trazabilidad total del empleado.',
  },
];

export default function HomePage() {
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white font-sans overflow-x-hidden">

      {/* Grid pattern overlay */}
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
      <div className="fixed top-[-200px] left-[10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-200px] right-[5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,163,74,0.07) 0%, transparent 70%)' }} />

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M2 7h6M2 10.5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Silent Port</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href={ROUTES.login}
            className="text-sm text-slate-400 hover:text-white transition-colors">
            Ingresar
          </Link>
          <Link href={ROUTES.register}
            className="text-sm bg-white text-[#0A0F1C] px-4 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors">
            Comenzar gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-full px-4 py-1.5 mb-8"
            style={{ animation: 'fadeUp 0.6s ease both' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            <span className="text-xs text-[#93BBFC] font-medium">Sistema de gestión de nómina</span>
          </div>

          <h1 className="text-6xl font-semibold leading-[1.08] tracking-tight mb-6"
            style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}>
            Liquidá sueldos
            <br />
            <span className="text-[#2563EB]">sin fricción.</span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl"
            style={{ animation: 'fadeUp 0.6s ease 0.2s both' }}>
            Gestión de empleados, contratos, asistencia y liquidación de nómina
            para equipos que no tienen tiempo que perder.
          </p>

          <div className="flex items-center gap-4" style={{ animation: 'fadeUp 0.6s ease 0.3s both' }}>
            <Link href={ROUTES.register}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl font-medium text-sm transition-all hover:shadow-[0_0_32px_rgba(37,99,235,0.4)] active:scale-[0.98]">
              Comenzar
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={ROUTES.login}
              className="text-sm text-slate-400 hover:text-white transition-colors">
              Ya tengo cuenta →
            </Link>
          </div>
        </div>

        {/* DASHBOARD PREVIEW */}
        <div className="mt-20 relative" style={{ animation: 'fadeUp 0.8s ease 0.4s both' }}>
          <div className="rounded-2xl border border-white/[0.06] bg-[#0F172A]/80 backdrop-blur overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              <span className="ml-4 text-xs text-slate-500">Panel de nómina — Empresa Ejemplo S.A.</span>
            </div>

            <div className="grid grid-cols-12 gap-0">
              {/* Sidebar simulado */}
              <div className="col-span-2 border-r border-white/[0.05] py-6 px-3 hidden md:flex flex-col gap-1">
                {['Dashboard', 'Empleados', 'Asistencia', 'Nómina', 'Conceptos'].map((item, i) => (
                  <div key={item}
                    className={`text-xs px-3 py-2 rounded-lg ${i === 3 ? 'bg-[#2563EB]/15 text-[#93BBFC]' : 'text-slate-500'}`}>
                    {item}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="col-span-12 md:col-span-10 p-6">

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Empleados activos', value: '48', delta: '+3' },
                    { label: 'Nómina del mes', value: '$3.1M', delta: '+8.2%' },
                    { label: 'Último run', value: 'COMPLETADO', delta: null, status: true },
                    { label: 'Payslips emitidos', value: '48', delta: null },
                  ].map((s) => (
                    <div key={s.label}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
                      <p className={`text-sm font-semibold ${s.status ? 'text-[#4ADE80]' : 'text-white'} tabular-nums`}>
                        {s.value}
                      </p>
                      {s.delta && (
                        <p className="text-[10px] text-[#4ADE80] mt-0.5">{s.delta} vs mes ant.</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-5 gap-3">

                  {/* Bar chart */}
                  <div className="col-span-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-medium text-white">Nómina mensual</p>
                      <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded">últimos 7 meses</span>
                    </div>
                    <div className="flex items-end gap-2 h-28">
                      {BAR_DATA.map((bar, i) => (
                        <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full relative group cursor-default">
                            <div
                              className="w-full rounded-t-md transition-all duration-700"
                              style={{
                                height: barsVisible ? `${bar.value * 0.92}px` : '0px',
                                background: i === BAR_DATA.length - 1
                                  ? 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)'
                                  : 'rgba(255,255,255,0.08)',
                                transitionDelay: `${i * 60}ms`,
                                boxShadow: i === BAR_DATA.length - 1 ? '0 0 12px rgba(37,99,235,0.5)' : 'none',
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-600">{bar.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Line chart + table */}
                  <div className="col-span-2 flex flex-col gap-3">

                    {/* Line chart */}
                    <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <p className="text-xs font-medium text-white mb-3">Costo por empleado</p>
                      <svg viewBox="0 0 100 80" className="w-full h-16" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <path
                          d={`${toSvgPath(LINE_POINTS)} L 100 80 L 0 80 Z`}
                          fill="url(#lineGrad)"
                        />
                        <path
                          d={toSvgPath(LINE_POINTS)}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* Mini table */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 mb-2">Últimos empleados</p>
                      {['García, María', 'López, Juan', 'Pérez, Ana'].map((name) => (
                        <div key={name} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                          <span className="text-[10px] text-slate-300">{name}</span>
                          <span className="text-[10px] text-[#4ADE80]">Activo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating glow under preview */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)' }} />
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatCard value={1200} suffix="+" label="Empresas usando la plataforma" />
          <StatCard value={48000} suffix="+" label="Empleados liquidados" />
          <StatCard value={99} suffix="%" label="Uptime garantizado" />
          <StatCard value={3} suffix=" min" label="Para completar una liquidación" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-28">
        <div className="mb-14">
          <p className="text-xs font-medium text-[#2563EB] uppercase tracking-widest mb-3">Funcionalidades</p>
          <h2 className="text-4xl font-semibold tracking-tight">
            Todo lo que necesitás,
            <br />
            <span className="text-slate-400">sin lo que no.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05]">
          {FEATURES.map((f, i) => (
            <div key={f.title}
              className="bg-[#0A0F1C] p-7 hover:bg-[#0F172A] transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] mb-5 group-hover:bg-[#2563EB]/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE / TESTIMONIAL */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-8 py-20 text-center">
          <div className="text-5xl text-[#2563EB]/30 font-serif mb-6">"</div>
          <p className="text-xl text-white leading-relaxed font-light mb-8">
            Antes tardábamos <span className="text-white font-semibold">4 horas</span> en cerrar la nómina.
            Ahora son <span className="text-[#2563EB] font-semibold">20 minutos</span>.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-sm font-semibold text-[#2563EB]">
              CR
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Carmen Rodríguez</p>
              <p className="text-xs text-slate-500">RRHH — Construye S.A.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-28 text-center">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 blur-3xl bg-[#2563EB]/20 rounded-full" />
        </div>
        <h2 className="text-5xl font-semibold tracking-tight mb-5">
          Empezá hoy.
          <br />
          <span className="text-slate-400">Es gratis.</span>
        </h2>
        <p className="text-slate-400 mb-10 text-lg max-w-md mx-auto">
          Sin tarjeta de crédito. Sin contrato. Creá tu empresa y liquidá tu primera nómina en minutos.
        </p>
        <Link href={ROUTES.register}
          className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-4 rounded-xl font-medium text-base transition-all hover:shadow-[0_0_48px_rgba(37,99,235,0.5)] active:scale-[0.98]">
          Comenzar gratis
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.06] px-8 py-8 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#2563EB] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 2.5h7M1.5 5h4M1.5 7.5h5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-400">Silent Port</span>
        </div>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} — Sistema de gestión de nómina
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
