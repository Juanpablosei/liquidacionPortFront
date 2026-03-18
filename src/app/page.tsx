'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Users, FileText, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleToggle } from '@/components/layout/locale-toggle';

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

function StatCard({ value, suffix = '', label, locale }: { value: number; suffix?: string; label: string; locale?: string | null }) {
  const count = useCountUp(value);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-4xl font-semibold text-foreground tracking-tight tabular-nums">
        {count.toLocaleString(locale === 'en' ? 'en-US' : 'es-AR')}{suffix}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export default function HomePage() {
  const [barsVisible, setBarsVisible] = useState(false);
  const t = useTranslation();
  const locale = useAuthStore((s) => s.user?.locale);

  const FEATURES = [
    { icon: <Users className="w-5 h-5" />,      title: t.landing.featureMulti,      desc: t.landing.featureMultiDesc },
    { icon: <FileText className="w-5 h-5" />,   title: t.landing.featureEngine,     desc: t.landing.featureEngineDesc },
    { icon: <TrendingUp className="w-5 h-5" />,  title: t.landing.featureAttendance, desc: t.landing.featureAttendanceDesc },
    { icon: <Shield className="w-5 h-5" />,      title: t.landing.featureRoles,      desc: t.landing.featureRolesDesc },
    { icon: <Zap className="w-5 h-5" />,         title: t.landing.featureFast,       desc: t.landing.featureFastDesc },
    { icon: <BarChart3 className="w-5 h-5" />,   title: t.landing.featureHistory,    desc: t.landing.featureHistoryDesc },
  ];

  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

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
      <nav className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M2 7h6M2 10.5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Silent Port</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LocaleToggle />
          <Link href={ROUTES.login}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none focus-visible:rounded-lg">
            {t.landing.login}
          </Link>
          <Link href={ROUTES.register}
            className="text-sm bg-white text-gray-950 px-4 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none">
            {t.landing.startFree}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 mb-8"
            style={{ animation: 'fadeUp 0.6s ease both' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
            <span className="text-xs text-brand-text font-medium">{t.landing.metaTitle.replace('Silent Port — ', '')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight mb-6"
            style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}>
            {t.landing.heroTitle1}
            <br />
            <span className="text-brand">{t.landing.heroTitle2}</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl"
            style={{ animation: 'fadeUp 0.6s ease 0.2s both' }}>
            {t.landing.heroDesc}
          </p>

          <div className="flex items-center gap-4" style={{ animation: 'fadeUp 0.6s ease 0.3s both' }}>
            <Link href={ROUTES.register}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-medium text-sm transition-all hover:shadow-[0_0_32px_rgba(37,99,235,0.4)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none">
              {t.landing.heroCta}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={ROUTES.login}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none focus-visible:rounded-lg">
              {t.landing.heroLogin}
            </Link>
          </div>
        </div>

        {/* DASHBOARD PREVIEW */}
        <div className="mt-20 relative overflow-hidden" style={{ animation: 'fadeUp 0.8s ease 0.4s both' }}>
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              <span className="ml-4 text-xs text-muted-foreground">{t.landing.demoTitle}</span>
            </div>

            <div className="grid grid-cols-12 gap-0">
              {/* Sidebar simulado */}
              <div className="col-span-2 border-r border-border py-6 px-3 hidden md:flex flex-col gap-1">
                {(t.landing.demoNav as string[]).map((item: string, i: number) => (
                  <div key={item}
                    className={`text-xs px-3 py-2 rounded-lg ${i === 3 ? 'bg-brand/15 text-brand-text' : 'text-muted-foreground'}`}>
                    {item}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="col-span-12 md:col-span-10 p-6">

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: t.landing.demoActiveEmployees, value: '48', delta: '+3' },
                    { label: t.landing.demoMonthPayroll, value: '$3.1M', delta: '+8.2%' },
                    { label: t.landing.demoLastRun, value: t.landing.demoCompleted, delta: null, status: true },
                    { label: t.landing.demoPayslips, value: '48', delta: null },
                  ].map((s) => (
                    <div key={s.label}
                      className="bg-overlay-subtle border border-border rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                      <p className={`text-sm font-semibold ${s.status ? 'text-emerald-400' : 'text-foreground'} tabular-nums`}>
                        {s.value}
                      </p>
                      {s.delta && (
                        <p className="text-[10px] text-emerald-400 mt-0.5">{s.delta} {t.landing.demoVsLastMonth}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">

                  {/* Bar chart */}
                  <div className="col-span-1 sm:col-span-3 bg-overlay-subtle border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-medium text-foreground">{t.landing.demoMonthlyPayroll}</p>
                      <span className="text-[10px] text-muted-foreground bg-overlay-subtle px-2 py-0.5 rounded">{t.landing.demoLast7Months}</span>
                    </div>
                    <div className="flex items-end gap-2 h-28">
                      {BAR_DATA.map((bar, i) => (
                        <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full relative group cursor-default">
                            <div
                              className="w-full rounded-t-md transition-all duration-300"
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
                          <span className="text-[9px] text-muted-foreground">{bar.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Line chart + table */}
                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-3">

                    {/* Line chart */}
                    <div className="flex-1 bg-overlay-subtle border border-border rounded-xl p-4">
                      <p className="text-xs font-medium text-foreground mb-3">{t.landing.demoCostPerEmployee}</p>
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
                    <div className="bg-overlay-subtle border border-border rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-2">{t.landing.demoLastEmployees}</p>
                      {['García, María', 'López, Juan', 'Pérez, Ana'].map((name) => (
                        <div key={name} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                          <span className="text-[10px] text-muted-foreground">{name}</span>
                          <span className="text-[10px] text-emerald-400">{t.landing.demoActive}</span>
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
      <section className="relative z-10 border-y border-border bg-overlay-subtle">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
          <StatCard value={1200} suffix="+" label={t.landing.statsCompanies} locale={locale} />
          <StatCard value={48000} suffix="+" label={t.landing.statsEmployees} locale={locale} />
          <StatCard value={99} suffix="%" label={t.landing.statsUptime} locale={locale} />
          <StatCard value={3} suffix=" min" label={t.landing.statsTime} locale={locale} />
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-28">
        <div className="mb-14">
          <p className="text-xs font-medium text-brand uppercase tracking-widest mb-3">{t.landing.featuresTitle}</p>
          <h2 className="text-4xl font-semibold tracking-tight">
            {t.landing.featuresSubtitle1}
            <br />
            <span className="text-muted-foreground">{t.landing.featuresSubtitle2}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-overlay rounded-2xl overflow-hidden border border-border">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="bg-background p-7 hover:bg-card transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-5 group-hover:bg-brand/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE / TESTIMONIAL */}
      <section className="relative z-10 border-y border-border bg-overlay-subtle">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20 text-center">
          <div className="text-5xl text-brand/30 font-serif mb-6">&quot;</div>
          <p className="text-xl text-foreground leading-relaxed font-light mb-8">
            {t.landing.testimonial}
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-sm font-semibold text-brand">
              CR
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{t.landing.testimonialAuthor}</p>
              <p className="text-xs text-muted-foreground">{t.landing.testimonialRole}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-28 text-center">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 blur-3xl bg-brand/20 rounded-full" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-5">
          {t.landing.ctaTitle}
          <br />
          <span className="text-muted-foreground">{t.landing.ctaSubtitle}</span>
        </h2>
        <p className="text-muted-foreground mb-10 text-lg max-w-md mx-auto">
          {t.landing.ctaDesc}
        </p>
        <Link href={ROUTES.register}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-xl font-medium text-base transition-all hover:shadow-[0_0_48px_rgba(37,99,235,0.5)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none">
          {t.landing.ctaButton}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border px-5 sm:px-8 py-8 max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-brand flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 2.5h7M1.5 5h4M1.5 7.5h5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-muted-foreground">Silent Port</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t.landing.footer.replace('{year}', String(new Date().getFullYear()))}
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
