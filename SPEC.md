# Sistema de Nómina — Especificación Técnica Frontend

## Tabla de contenidos

1. [Resumen del sistema](#1-resumen-del-sistema)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Principios de diseño y reglas de Cursor](#3-principios-de-diseño-y-reglas-de-cursor)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Zustand stores](#5-zustand-stores)
6. [Autenticación y sesiones](#6-autenticación-y-sesiones)
7. [Mapa completo de rutas y páginas](#7-mapa-completo-de-rutas-y-páginas)
8. [Modelo de datos (TypeScript types)](#8-modelo-de-datos-typescript-types)
9. [Capa de API — cliente HTTP](#9-capa-de-api--cliente-http)
10. [Catálogo de componentes reutilizables](#10-catálogo-de-componentes-reutilizables)
11. [Roles y permisos en UI](#11-roles-y-permisos-en-ui)
12. [Flujos de negocio críticos](#12-flujos-de-negocio-críticos)
13. [Variables de entorno](#13-variables-de-entorno)
14. [Orden de implementación](#14-orden-de-implementación)
15. [Referencias](#15-referencias)

---

## 1. Resumen del sistema

Frontend React/Next.js 16 para el sistema de nómina multi-tenant. Consume la API REST del backend (`c:\Users\Pablo\Desktop\Back`) y provee una interfaz moderna y minimalista para:

- Gestionar múltiples empresas con sus miembros y roles.
- Administrar empleados, contratos mensuales/por hora y horarios semanales.
- Registrar asistencia diaria, horas extra y feriados.
- Definir conceptos de liquidación (haberes y deducciones).
- Ejecutar el motor de liquidación: períodos → runs → payslips → export CSV.

### Relación con el backend

```
Frontend (Next.js 16)                Backend (NestJS)
  └── fetch wrapper tipado ──────────► API REST /api
        ├── lib/api/client.ts            ├── /auth/*
        ├── lib/api/auth.ts              ├── /companies/*
        ├── lib/api/companies.ts         ├── /companies/:id/employees/*
        ├── lib/api/employees.ts         ├── /companies/:id/attendance/*
        ├── lib/api/payroll.ts           ├── /companies/:id/payroll/*
        └── ...                          └── ...
```

**Base URL:** `NEXT_PUBLIC_API_URL` (ej. `http://localhost:3000/api`)

**Formato de respuesta del backend (sobre unificado):**
```json
{
  "success": true,
  "data": { },
  "message": "OK",
  "timestamp": "2026-03-01T12:00:00.000Z"
}
```

El cliente HTTP desenvuelve el sobre y retorna directamente `data`. Ver sección 9.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16 |
| Lenguaje | TypeScript | 5+ |
| Runtime | React | 19.2 |
| Estilos | Tailwind CSS | v4 |
| Componentes | shadcn/ui | latest |
| Estado global | Zustand + `persist` middleware | 5 |
| Formularios | React Hook Form | 7 |
| Validación | Zod | 3 |
| Tablas | TanStack Table | v8 |
| Iconos | Lucide React | latest |
| Notificaciones | Sonner | latest |
| Fuentes | `next/font` (Geist Sans + Geist Mono) | — |
| HTTP Client | fetch nativo + wrapper custom | — |
| Node.js | — | 20.9+ |
| Bundler | Turbopack (default en Next.js 16) | — |

### Dependencias `package.json`

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@tanstack/react-table": "^8.0.0",
    "lucide-react": "latest",
    "sonner": "latest",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.1.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
```

---

## 3. Principios de diseño y reglas de Cursor

### 3.1 Estética minimalista (skill: `frontend-design`)

La interfaz sigue una estética **refinada y utilitaria**: sin decoración innecesaria, densidad de información controlada, espacio negativo generoso. Apropiada para software de gestión empresarial de uso diario.

**Tipografía:**
- **Body / UI:** Geist Sans — limpia, legible, diseñada para pantallas.
- **Datos numéricos / código:** Geist Mono — monoespaciada para alinear cifras (salarios, fechas, códigos).
- Escala de tamaños: 12 / 14 / 16 / 20 / 24 / 32px.
- Pesos usados: 400 (body), 500 (labels), 600 (headings, valores importantes).

**Color:**
- Fondo dominante neutro claro (`#F8FAFC`), superficie de cards `#FFFFFF`.
- Texto principal `#0F172A`, texto secundario `#64748B`.
- Acento único: azul `#2563EB` para CTAs, links y estados activos.
- Estados semánticos: verde éxito, amarillo advertencia, rojo peligro.
- Sin gradientes decorativos; los colores de acento se usan con moderación.

**Composición:**
- Layout de dos columnas: sidebar fijo (240px) + área de contenido.
- Sidebar colapsable a 56px (iconos solamente) en pantallas medianas.
- Cards con borde `#E2E8F0`, radio `8px`, sin sombras excesivas.
- Padding interno de cards: `24px`. Espaciado entre secciones: `32px`.
- Tablas con filas alternadas sutiles y hover state de fila.

**Motion:**
- Transiciones CSS únicamente: `transition-colors 150ms`, `transition-opacity 200ms`.
- Sidebar collapse: `transition-width 200ms ease-in-out`.
- Sin animaciones de página (sin flicker ni layout shift).
- Feedback de carga: skeleton animado con `animate-pulse`.

### 3.2 Constantes de colores (`lib/constants/colors.ts`)

```typescript
export const COLORS = {
  primary: {
    DEFAULT: '#0F172A',
    light:   '#334155',
    lighter: '#64748B',
  },
  accent: {
    DEFAULT: '#2563EB',
    hover:   '#1D4ED8',
    light:   '#DBEAFE',
    lighter: '#EFF6FF',
  },
  success: {
    DEFAULT: '#16A34A',
    light:   '#DCFCE7',
  },
  warning: {
    DEFAULT: '#D97706',
    light:   '#FEF3C7',
  },
  danger: {
    DEFAULT: '#DC2626',
    light:   '#FEE2E2',
  },
  neutral: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A',
  },
  background: {
    DEFAULT:   '#FFFFFF',
    secondary: '#F8FAFC',
    dark:      '#0F172A',
  },
  border: {
    DEFAULT: '#E2E8F0',
    focus:   '#2563EB',
    strong:  '#CBD5E1',
  },
  text: {
    primary:   '#0F172A',
    secondary: '#64748B',
    disabled:  '#94A3B8',
    inverse:   '#FFFFFF',
  },
} as const;

export type ColorKey = keyof typeof COLORS;
```

**Integración con Tailwind CSS v4 (`tailwind.config.ts`):**

```typescript
import type { Config } from 'tailwindcss';
import { COLORS } from './src/lib/constants/colors';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:    COLORS.primary,
        accent:     COLORS.accent,
        success:    COLORS.success,
        warning:    COLORS.warning,
        danger:     COLORS.danger,
        neutral:    COLORS.neutral,
        background: COLORS.background,
        border:     COLORS.border,
        text:       COLORS.text,
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        sm:  '4px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
      },
    },
  },
  plugins: [],
};

export default config;
```

**CSS variables de shadcn/ui (`globals.css`):**

```css
@layer base {
  :root {
    --background:       0 0% 100%;
    --foreground:       222 47% 11%;
    --card:             0 0% 100%;
    --card-foreground:  222 47% 11%;
    --primary:          221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary:        210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted:            210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent:           221 83% 53%;
    --accent-foreground: 0 0% 100%;
    --destructive:      0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border:           214 32% 91%;
    --input:            214 32% 91%;
    --ring:             221 83% 53%;
    --radius:           0.5rem;
  }
}
```

### 3.3 Reglas de rendimiento (skill: `vercel-react-best-practices`)

Las siguientes reglas son **obligatorias** en toda implementación:

#### Críticas — Eliminar waterfalls

| Regla | Aplicación concreta |
|-------|-------------------|
| `async-parallel` | En Server Components que necesiten múltiples datos: `await Promise.all([fetchEmployees(), fetchCompany()])` |
| `async-suspense-boundaries` | Envolver secciones asíncronas en `<Suspense fallback={<LoadingSkeleton />}>` |
| `async-defer-await` | En route handlers y server actions: iniciar fetches antes del `await` |
| `bundle-dynamic-imports` | `DataTable`, `PayrollRunDetail`, gráficos → `next/dynamic` con `{ ssr: false }` si son pesados |
| `bundle-barrel-imports` | Nunca `import { X } from '@/components'`. Siempre imports directos: `import { X } from '@/components/shared/x'` |
| `bundle-defer-third-party` | Analytics y herramientas de debug: cargar después de hydration |

#### Altas — Server-side performance

| Regla | Aplicación concreta |
|-------|-------------------|
| `server-parallel-fetching` | RSC de páginas: reestructurar componentes para que los fetches ocurran en paralelo |
| `server-serialization` | Minimizar datos pasados como props a Client Components. Pasar solo los IDs necesarios |
| `server-cache-react` | Usar `React.cache()` para deduplicar llamadas a la API dentro del mismo request |
| `server-auth-actions` | Verificar autenticación en cada Server Action igual que en un API route |

#### Medias — Re-renders

| Regla | Aplicación concreta |
|-------|-------------------|
| `rerender-memo` | Extraer subcomponentes costosos (ej. filas de tabla complejas) en `memo()` |
| `rerender-derived-state-no-effect` | No usar `useEffect` para derivar estado; calcular durante render |
| `rerender-functional-setstate` | Siempre `setState(prev => ...)` cuando el nuevo estado depende del anterior |
| `rerender-dependencies` | Usar valores primitivos como deps de `useEffect` en vez de objetos |
| `rendering-conditional-render` | Usar ternario `{condition ? <A /> : <B />}` en vez de `{condition && <A />}` |
| `rendering-hoist-jsx` | JSX estático fuera del componente cuando no depende de props/state |

#### Regla general de componentes

> Todo componente que recibe `children` o callbacks debe ser `'use client'` solo si necesita interactividad. Preferir Server Components por defecto.

---

## 4. Estructura del proyecto

```
c:\Users\Pablo\Desktop\Front\
├── src/
│   ├── app/
│   │   ├── (auth)/                          → grupo de rutas públicas
│   │   │   ├── layout.tsx                   → layout centrado, sin sidebar
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── confirm-email/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/                     → grupo de rutas protegidas
│   │   │   ├── layout.tsx                   → sidebar + header + company-switcher
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx                 → lista de mis empresas
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx             → crear empresa
│   │   │   │   └── [companyId]/
│   │   │   │       ├── page.tsx             → dashboard de empresa (KPIs)
│   │   │   │       ├── employees/
│   │   │   │       │   ├── page.tsx         → lista de empleados
│   │   │   │       │   ├── new/
│   │   │   │       │   │   └── page.tsx     → crear empleado
│   │   │   │       │   └── [employeeId]/
│   │   │   │       │       └── page.tsx     → detalle + contratos + horario
│   │   │   │       ├── attendance/
│   │   │   │       │   └── page.tsx         → registro de asistencia
│   │   │   │       ├── overtime/
│   │   │   │       │   └── page.tsx         → horas extra
│   │   │   │       ├── holidays/
│   │   │   │       │   └── page.tsx         → feriados
│   │   │   │       ├── concepts/
│   │   │   │       │   └── page.tsx         → conceptos de nómina
│   │   │   │       ├── payroll/
│   │   │   │       │   ├── page.tsx         → períodos y runs
│   │   │   │       │   └── runs/
│   │   │   │       │       └── [runId]/
│   │   │   │       │           └── page.tsx → detalle run + payslips + CSV
│   │   │   │       ├── members/
│   │   │   │       │   └── page.tsx         → miembros de empresa
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx         → configuración empresa
│   │   │   └── profile/
│   │   │       └── page.tsx                 → perfil de usuario
│   │   ├── proxy.ts                         → protección de rutas (reemplaza middleware.ts)
│   │   ├── layout.tsx                       → root layout (fuentes, providers, Toaster)
│   │   ├── not-found.tsx
│   │   └── global-error.tsx
│   ├── components/
│   │   ├── ui/                              → shadcn/ui (NO modificar)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── avatar.tsx
│   │   │   └── ...
│   │   ├── layout/                          → componentes de layout
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── company-switcher.tsx
│   │   └── shared/                          → componentes reutilizables de negocio
│   │       ├── data-table.tsx
│   │       ├── form-field.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       ├── stat-card.tsx
│   │       ├── status-badge.tsx
│   │       ├── role-gate.tsx
│   │       ├── page-header.tsx
│   │       └── currency-display.tsx
│   ├── lib/
│   │   ├── constants/
│   │   │   ├── colors.ts                    → paleta centralizada (ver sección 3.2)
│   │   │   ├── routes.ts                    → constantes de rutas
│   │   │   ├── api-endpoints.ts             → URLs del backend
│   │   │   └── roles.ts                     → enum de roles y jerarquía
│   │   ├── api/
│   │   │   ├── client.ts                    → fetch wrapper + refresh interceptor
│   │   │   ├── auth.ts
│   │   │   ├── companies.ts
│   │   │   ├── employees.ts
│   │   │   ├── contracts.ts
│   │   │   ├── attendance.ts
│   │   │   ├── overtime.ts
│   │   │   ├── holidays.ts
│   │   │   ├── concepts.ts
│   │   │   └── payroll.ts
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-company.ts
│   │   │   ├── use-permissions.ts
│   │   │   └── use-debounce.ts
│   │   ├── validators/
│   │   │   ├── auth.ts
│   │   │   ├── employee.ts
│   │   │   ├── contract.ts
│   │   │   ├── attendance.ts
│   │   │   ├── holiday.ts
│   │   │   ├── concept.ts
│   │   │   └── payroll.ts
│   │   ├── types/
│   │   │   ├── index.ts                     → re-exports
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── company.ts
│   │   │   ├── employee.ts
│   │   │   ├── attendance.ts
│   │   │   └── payroll.ts
│   │   └── utils/
│   │       ├── cn.ts                        → clsx + tailwind-merge
│   │       └── format.ts                    → moneda, fecha, números
│   └── stores/
│       ├── auth-store.ts
│       ├── company-store.ts
│       └── ui-store.ts
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local
└── .env.example
```

---

## 5. Zustand stores

Zustand es el **único** gestor de estado del cliente. No se usa TanStack Query ni Context API para estado global.

### 5.1 `stores/auth-store.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/lib/types/auth';

interface AuthState {
  // Estado
  user:            User | null;
  accessToken:     string | null;
  refreshToken:    string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;

  // Acciones
  login:     (user: User, accessToken: string, refreshToken: string) => void;
  logout:    () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser:   (user: User) => void;
  hydrate:   () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,
      isLoading:       true,

      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) =>
        set({ user }),

      hydrate: () =>
        set({ isLoading: false }),
    }),
    {
      name:    'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir refreshToken; accessToken se renueva en memoria
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user:         state.user,
      }),
    },
  ),
);
```

> **Seguridad:** el `accessToken` NO se persiste en localStorage. Solo el `refreshToken` se guarda. Al iniciar la app, si hay `refreshToken` almacenado, se realiza un `/auth/refresh` automático para obtener un nuevo `accessToken` (en el `hydrate()` del root layout).

### 5.2 `stores/company-store.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Company, CompanyUser, CompanyRole } from '@/lib/types/company';

interface CompanyState {
  // Estado
  activeCompany:  Company | null;
  membership:     CompanyUser | null;
  role:           CompanyRole | null;
  companies:      Company[];

  // Acciones
  setActiveCompany: (company: Company, membership: CompanyUser) => void;
  setCompanies:     (companies: Company[]) => void;
  clearCompany:     () => void;
  updateCompany:    (data: Partial<Company>) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompany: null,
      membership:    null,
      role:          null,
      companies:     [],

      setActiveCompany: (company, membership) =>
        set({ activeCompany: company, membership, role: membership.role }),

      setCompanies: (companies) =>
        set({ companies }),

      clearCompany: () =>
        set({ activeCompany: null, membership: null, role: null }),

      updateCompany: (data) =>
        set((state) => ({
          activeCompany: state.activeCompany
            ? { ...state.activeCompany, ...data }
            : null,
        })),
    }),
    {
      name:    'company-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeCompany: state.activeCompany,
        membership:    state.membership,
        role:          state.role,
      }),
    },
  ),
);
```

### 5.3 `stores/ui-store.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiState {
  // Estado
  sidebarCollapsed: boolean;
  theme:            'light' | 'dark' | 'system';

  // Acciones
  toggleSidebar: () => void;
  setSidebar:    (collapsed: boolean) => void;
  setTheme:      (theme: 'light' | 'dark' | 'system') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme:            'light',

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebar: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) =>
        set({ theme }),
    }),
    {
      name:    'ui-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

---

## 6. Autenticación y sesiones

### 6.1 Estrategia de tokens

| Token | Almacenamiento | Duración | Propósito |
|-------|---------------|----------|-----------|
| `accessToken` | Zustand (memoria) | 15 min | Autorizar requests a la API |
| `refreshToken` | localStorage (via Zustand persist) | 7 días | Renovar el accessToken |

### 6.2 Flujo de inicio de sesión

```
Usuario               Frontend                   Backend
  │                      │                           │
  │── POST /login ───────►│                           │
  │  { email, password }  │── POST /auth/login ──────►│
  │                       │                           │── validar credenciales
  │                       │◄── { accessToken,         │
  │                       │     refreshToken,         │
  │                       │     user } ───────────────│
  │                       │── authStore.login()       │
  │                       │── redirect /companies     │
  │◄── dashboard ─────────│                           │
```

### 6.3 Refresh automático

El `fetch wrapper` (`lib/api/client.ts`) intercepta respuestas `401`:

```
Request ──► API (401 Unauthorized)
              │
              ├── refreshToken existe? ──NO──► logout() + redirect /login
              │
              YES
              │
              ├── POST /auth/refresh { refreshToken }
              │      │
              │      ├── OK: setTokens(new accessToken, new refreshToken)
              │      │         retry original request
              │      │
              │      └── FAIL (401): logout() + redirect /login
```

### 6.4 Protección de rutas — `proxy.ts`

```typescript
// src/app/proxy.ts  (reemplaza middleware.ts en Next.js 16)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/confirm-email'];
const AUTH_ROUTES   = ['/login', '/register'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic     = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Leer preferencia de sesión (solo refreshToken en cookie httpOnly si se implementa)
  // Por simplicidad con localStorage: la protección real es client-side con redirect en layout
  // proxy.ts redirige si no hay token en cookie (opcional: setear cookie al login)

  if (!isPublic) {
    const authCookie = request.cookies.get('auth-token');
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (AUTH_ROUTES.includes(pathname)) {
    const authCookie = request.cookies.get('auth-token');
    if (authCookie) {
      return NextResponse.redirect(new URL('/companies', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
```

> **Alternativa client-side:** si no se usa cookie httpOnly, el dashboard layout verifica `useAuthStore().isAuthenticated` y redirige con `useRouter().push('/login')` si es falso.

### 6.5 Hydration al inicio

En el `root layout` (`app/layout.tsx`), un componente `AuthHydrator` (Client Component) ejecuta al montar:

1. Lee `refreshToken` del localStorage (via Zustand persist).
2. Si existe: llama `POST /auth/refresh` para obtener un nuevo `accessToken`.
3. Si el refresh falla: limpia el store y deja al usuario en la ruta pública.
4. Llama `hydrate()` para marcar `isLoading: false`.

### 6.6 Páginas de autenticación

| Página | Ruta | Endpoint backend | Descripción |
|--------|------|-----------------|-------------|
| Login | `/login` | `POST /auth/login` | Email + contraseña. Redirect `/companies` al éxito. |
| Registro | `/register` | `POST /auth/register` | Email, contraseña, nombre. Auto-login al éxito. |
| Olvidé contraseña | `/forgot-password` | `POST /auth/forgot-password` | Email → envío de link. Mensaje: "Si el email existe, recibirás instrucciones." |
| Resetear contraseña | `/reset-password?token=...` | `POST /auth/reset-password` | Lee token de query param, envía en body. |
| Confirmar email | `/confirm-email?token=...` | `POST /auth/confirm-email` | Lee token de query param, confirma y redirige a login. |

---

## 7. Mapa completo de rutas y páginas

### Leyenda de acceso mínimo

- **Público** = sin autenticación
- **JWT** = autenticado (cualquier rol)
- **M+** = MANAGER, ADMIN o OWNER
- **A+** = ADMIN o OWNER
- **O** = solo OWNER

---

### 7.1 Grupo `(auth)` — Rutas públicas

#### `/login`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(auth)/login/page.tsx` |
| Acceso | Público (redirige a `/companies` si ya está autenticado) |
| Endpoints | `POST /auth/login` |
| Componentes | `FormField`, `Button` |
| Acciones | Iniciar sesión, link a `/register`, link a `/forgot-password` |
| Validación Zod | `email: z.string().email()`, `password: z.string().min(1)` |
| Errores | 401 → "Credenciales inválidas". 403 → "Debés confirmar tu email" (link a reenviar). |

#### `/register`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(auth)/register/page.tsx` |
| Acceso | Público |
| Endpoints | `POST /auth/register` |
| Componentes | `FormField`, `Button` |
| Acciones | Crear cuenta. Al éxito: login automático + redirect `/companies`. |
| Validación Zod | `email`, `password` (min 8, mayúscula, minúscula, número), `name` (2–100 chars, opcional) |
| Errores | 409 → "El email ya está registrado." |

#### `/forgot-password`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(auth)/forgot-password/page.tsx` |
| Endpoints | `POST /auth/forgot-password` |
| Acciones | Ingresa email → muestra mensaje de éxito genérico (202). |
| Validación | `email: z.string().email()` |

#### `/reset-password`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(auth)/reset-password/page.tsx` |
| Query params | `?token=...` (leído en el componente con `useSearchParams()`) |
| Endpoints | `POST /auth/reset-password` |
| Acciones | Nueva contraseña + confirmación → redirect a `/login`. |
| Validación | `newPassword` (min 8, regex), `confirmPassword` (debe coincidir) |
| Errores | 400 → "El enlace es inválido o ya expiró." |

#### `/confirm-email`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(auth)/confirm-email/page.tsx` |
| Query params | `?token=...` |
| Endpoints | `POST /auth/confirm-email` |
| Acciones | Ejecuta confirmación automáticamente al montar. Muestra estado (cargando / éxito / error). |
| Errores | 400 → "El enlace es inválido, ya fue usado o expiró." |

---

### 7.2 Grupo `(dashboard)` — Rutas protegidas

#### `/companies`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/page.tsx` |
| Acceso | JWT |
| Endpoints | `GET /companies` |
| Componentes | `PageHeader`, `StatCard` (cantidad de empresas), grid de cards de empresa |
| Acciones | Ver lista de empresas del usuario, click → ir a `/companies/[companyId]`, botón "Nueva empresa" |
| Notas | Si el usuario no tiene empresas, muestra `EmptyState` con CTA "Crear mi primera empresa" |

#### `/companies/new`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/new/page.tsx` |
| Acceso | JWT |
| Endpoints | `POST /companies` |
| Componentes | `PageHeader`, `FormField`, `Button` |
| Campos | `name` (requerido), `taxId` (CUIT, opcional), `address` (opcional), `phone` (opcional) |
| Acciones | Crear empresa → redirect a `/companies/[newId]`. Al crear queda como OWNER. |

#### `/companies/[companyId]` — Dashboard de empresa

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/page.tsx` |
| Acceso | JWT + Membership |
| Endpoints | `GET /companies/:id`, `GET /companies/:id/members`, `GET /companies/:id/employees?limit=5`, `GET /companies/:id/payroll/periods?limit=3` |
| Componentes | `PageHeader`, `StatCard` ×4, `DataTable` (empleados recientes), `StatusBadge` (último run) |
| Stats mostrados | Total empleados activos, miembros, último período (estado), total payslips del último run |
| Acciones | Navegación rápida a secciones. Links a empleados, nómina, miembros. |
| Performance | RSC con `Promise.all()` para los 4 fetches en paralelo |

#### `/companies/[companyId]/employees`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/employees/page.tsx` |
| Acceso | M+ |
| Endpoints | `GET /companies/:companyId/employees?page=&limit=&search=` |
| Componentes | `PageHeader`, `DataTable`, `StatusBadge` (activo/inactivo), `RoleGate` (botón crear = A+) |
| Columnas tabla | Nombre completo, Documento, Tipo contrato, Fecha ingreso, Estado, Acciones |
| Acciones | Buscar por nombre/documento, paginar, click fila → detalle, "Nuevo empleado" (A+) |
| Filtros | `isActive` (todos / activos / inactivos), búsqueda libre |

#### `/companies/[companyId]/employees/new`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/employees/new/page.tsx` |
| Acceso | A+ |
| Endpoints | `POST /companies/:companyId/employees` |
| Campos | `documentType`, `documentNumber`, `firstName`, `lastName`, `email?`, `phone?`, `birthDate?`, `hireDate` |
| Acciones | Crear empleado → redirect a `/employees/[newId]` |
| Validación | `hireDate` requerida, `documentNumber` único en empresa (error 409 del servidor) |

#### `/companies/[companyId]/employees/[employeeId]`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/employees/[employeeId]/page.tsx` |
| Acceso | M+ |
| Endpoints | `GET /employees/:id`, `GET /employees/:id/contracts`, `GET /employees/:id/contracts/:contractId/schedule` |
| Secciones | Datos personales (editar A+), Historial de contratos (tabla), Horario semanal del contrato activo |
| Componentes | `PageHeader`, `FormField`, `DataTable` (contratos), tabla de horario semanal, `RoleGate` |
| Acciones | Editar empleado (A+), crear contrato (A+), setear horario (A+), dar de baja (A+, modal confirm danger) |
| Sensibilidad | `salaryAmount` visible solo para A+. Para M+ se muestra "—" con tooltip "Sin acceso" |

#### `/companies/[companyId]/attendance`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/attendance/page.tsx` |
| Acceso | M+ |
| Endpoints | `GET /companies/:id/attendance?employeeId=&fromDate=&toDate=`, `POST`, `PATCH /:id`, `DELETE /:id` (A+) |
| Componentes | `PageHeader`, filtros (date range + selector empleado), `DataTable`, `ConfirmDialog` (borrar) |
| Columnas | Empleado, Fecha, Entrada, Salida, Minutos trabajados, Notas, Acciones |
| Acciones | Filtrar por empleado y rango de fecha, registrar asistencia, editar, borrar (A+) |

#### `/companies/[companyId]/overtime`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/overtime/page.tsx` |
| Acceso | M+ |
| Endpoints | `GET /companies/:id/overtime?employeeId=&fromDate=&toDate=&type=`, `POST`, `PATCH /:id`, `DELETE /:id` (A+) |
| Componentes | `PageHeader`, filtros, `DataTable`, `StatusBadge` (OT_50 / OT_100) |
| Columnas | Empleado, Fecha, Tipo (50% / 100%), Minutos, Notas, Acciones |
| Acciones | Registrar overtime, editar, borrar (A+) |

#### `/companies/[companyId]/holidays`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/holidays/page.tsx` |
| Acceso | JWT + Membership |
| Endpoints | `GET /companies/:id/holidays?year=`, `POST` (A+), `PATCH /:id` (A+), `DELETE /:id` (A+) |
| Componentes | `PageHeader`, filtro por año, `DataTable` con badge Obligatorio/Optativo |
| Columnas | Fecha, Nombre del feriado, Tipo (Obligatorio / Optativo), Acciones (A+) |
| Acciones | Ver feriados, crear/editar/eliminar (A+) |

#### `/companies/[companyId]/concepts`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/concepts/page.tsx` |
| Acceso | M+ |
| Endpoints | `GET /companies/:id/concepts`, `POST` (A+), `PATCH /:id` (A+), `DELETE /:id` (A+) |
| Componentes | `PageHeader`, tabs Haberes / Deducciones, `DataTable`, `StatusBadge` (activo/inactivo) |
| Columnas | Código, Nombre, Tipo cálculo, Valor, Estado, Orden, Acciones (A+) |
| Acciones | Crear concepto (A+), editar, desactivar (soft delete). Formulario dinámico según `calcType` |
| Formulario dinámico | `FIXED` → `fixedAmount`. `PERCENT` → `percentValue` + `percentBase`. `HOURLY` → `hourlyRate`. `MANUAL` → sin campos extra. |

#### `/companies/[companyId]/payroll`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/payroll/page.tsx` |
| Acceso | M+ |
| Endpoints | `GET /companies/:id/payroll/periods`, `POST` período (A+), `GET /payroll/runs?periodId=`, `POST` run (A+) |
| Componentes | `PageHeader`, lista de períodos con acordeón (expande para ver runs), `StatusBadge` por run |
| Estados de run | `DRAFT` (gris), `RUNNING` (amarillo, animado), `COMPLETED` (verde), `CLOSED` (azul) |
| Acciones | Crear período (A+), crear run para un período (A+), click run → `/payroll/runs/[runId]` |

#### `/companies/[companyId]/payroll/runs/[runId]`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/payroll/runs/[runId]/page.tsx` |
| Acceso | M+ |
| Endpoints | `GET /runs/:id`, `POST /runs/:id/calculate` (A+), `POST /runs/:id/close` (A+), `GET /runs/:id/payslips`, `GET /runs/:id/payslips/:payslipId`, `PATCH /payslips/:id/lines/:lineId` (A+), `GET /runs/:id/payslips/export` |
| Componentes | `PageHeader`, `StatusBadge`, botones de acción, `DataTable` payslips, drawer de detalle payslip, `ConfirmDialog` (cerrar run) |
| Acciones | Calcular run (DRAFT/COMPLETED → RUNNING), cerrar run (COMPLETED → CLOSED, irreversible), ver detalle de payslip, editar líneas MANUAL (solo si COMPLETED), exportar CSV |
| Detalles payslip | Nombre empleado, líneas con concepto/categoría/monto, totales (bruto, deducciones, neto) |
| Restricciones UI | Si run = CLOSED: deshabilitar todos los botones de edición. Si run = RUNNING: mostrar spinner, polling cada 3s hasta que cambie estado. |

#### `/companies/[companyId]/members`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/members/page.tsx` |
| Acceso | A+ |
| Endpoints | `GET /companies/:id/members`, `POST /members`, `PATCH /members/:userId`, `DELETE /members/:userId`, `POST /transfer-ownership` |
| Componentes | `PageHeader`, `DataTable`, `RoleGate` (acciones OWNER), `ConfirmDialog` |
| Columnas | Avatar, Nombre, Email, Rol (`StatusBadge`), Fecha de ingreso, Acciones |
| Acciones | Agregar miembro (email + rol), cambiar rol, quitar miembro, transferir ownership (solo OWNER, modal con `ConfirmDialog danger`) |
| Restricciones | ADMIN no puede modificar al OWNER. OWNER no puede dejar la empresa sin transferir. |

#### `/companies/[companyId]/settings`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/companies/[companyId]/settings/page.tsx` |
| Acceso | A+ |
| Endpoints | `PATCH /companies/:id`, `POST /companies/:id/transfer-ownership` |
| Componentes | `PageHeader`, `FormField`, `Button`, sección "Zona de peligro" |
| Acciones | Editar nombre, CUIT, dirección, teléfono. Transferir ownership (solo OWNER, zona de peligro). |

#### `/profile`

| Atributo | Detalle |
|----------|---------|
| Archivo | `app/(dashboard)/profile/page.tsx` |
| Acceso | JWT |
| Endpoints | `GET /auth/me`, `POST /auth/change-password`, `GET /auth/sessions`, `DELETE /auth/sessions/:sessionId`, `POST /auth/logout-all` |
| Secciones | Datos de cuenta (nombre, email, estado verificación), Cambiar contraseña, Sesiones activas |
| Columnas sesiones | Dispositivo (userAgent), IP, Fecha de creación, Botón revocar |
| Acciones | Editar nombre, cambiar contraseña (currentPassword + newPassword), revocar sesión individual, cerrar todas las sesiones |

---

## 8. Modelo de datos (TypeScript types)

### `lib/types/api.ts`

```typescript
export interface ApiResponse<T = unknown> {
  success:   boolean;
  data:      T;
  message:   string;
  timestamp: string;
}

export interface ApiError {
  success:    false;
  statusCode: number;
  message:    string | string[];
  error:      string;
  timestamp:  string;
  path:       string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

export interface PaginationParams {
  page?:  number;
  limit?: number;
}
```

### `lib/types/auth.ts`

```typescript
export interface User {
  id:              string;
  email:           string;
  name:            string | null;
  isActive:        boolean;
  emailVerifiedAt: string | null;
  createdAt:       string;
}

export interface TokenResponse {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}

export interface UserSession {
  id:        string;
  userAgent: string | null;
  ip:        string | null;
  createdAt: string;
  expiresAt: string;
}

// DTOs (alineados con el backend)
export interface LoginDto {
  email:    string;
  password: string;
}

export interface RegisterDto {
  email:     string;
  password:  string;
  name?:     string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword:     string;
}

export interface ResetPasswordDto {
  token:       string;
  newPassword: string;
}
```

### `lib/types/company.ts`

```typescript
export type CompanyRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface Company {
  id:        string;
  name:      string;
  taxId:     string | null;
  address:   string | null;
  phone:     string | null;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id:        string;
  userId:    string;
  companyId: string;
  role:      CompanyRole;
  joinedAt:  string;
  invitedBy: string | null;
  user?:     Pick<import('./auth').User, 'id' | 'email' | 'name'>;
}
```

### `lib/types/employee.ts`

```typescript
export type SalaryType = 'MONTHLY' | 'HOURLY';

export interface Employee {
  id:              string;
  companyId:       string;
  documentType:    string;
  documentNumber:  string;
  firstName:       string;
  lastName:        string;
  email:           string | null;
  phone:           string | null;
  birthDate:       string | null;
  hireDate:        string;
  terminationDate: string | null;
  isActive:        boolean;
  createdAt:       string;
  updatedAt:       string;
}

export interface Contract {
  id:           string;
  employeeId:   string;
  startDate:    string;
  endDate:      string | null;
  salaryType:   SalaryType;
  salaryAmount: string | null; // null si el usuario no tiene permiso (MANAGER)
  createdAt:    string;
  updatedAt:    string;
  weeklySchedule?: ContractScheduleEntry[];
}

export interface ContractScheduleEntry {
  id:           string;
  contractId:   string;
  weekday:      number; // 0=Domingo, 1=Lunes ... 6=Sábado
  startTime:    string; // "HH:mm"
  endTime:      string; // "HH:mm"
  breakMinutes: number;
}
```

### `lib/types/attendance.ts`

```typescript
export type OvertimeType = 'OT_50' | 'OT_100';

export interface Attendance {
  id:            string;
  employeeId:    string;
  date:          string; // "YYYY-MM-DD"
  clockIn:       string | null; // "HH:mm"
  clockOut:      string | null; // "HH:mm"
  workedMinutes: number | null;
  notes:         string | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface OvertimeEntry {
  id:           string;
  employeeId:   string;
  date:         string;
  overtimeType: OvertimeType;
  minutes:      number;
  notes:        string | null;
  createdAt:    string;
  updatedAt:    string;
}

export interface Holiday {
  id:         string;
  companyId:  string;
  date:       string; // "YYYY-MM-DD"
  name:       string;
  isOptional: boolean;
  createdAt:  string;
  updatedAt:  string;
}
```

### `lib/types/payroll.ts`

```typescript
export type ConceptCalcType  = 'FIXED' | 'PERCENT' | 'HOURLY' | 'MANUAL';
export type ConceptCategory  = 'EARNING' | 'DEDUCTION';
export type PercentBase      = 'BASIC' | 'GROSS';
export type PayrollPeriodType = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'CUSTOM';
export type RunStatus        = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'CLOSED';

export interface PayrollConcept {
  id:           string;
  companyId:    string;
  code:         string;
  name:         string;
  category:     ConceptCategory;
  calcType:     ConceptCalcType;
  fixedAmount:  string | null;
  percentValue: string | null;
  percentBase:  PercentBase;
  hourlyRate:   string | null;
  isActive:     boolean;
  sortOrder:    number;
  createdAt:    string;
  updatedAt:    string;
}

export interface PayrollPeriod {
  id:         string;
  companyId:  string;
  periodType: PayrollPeriodType;
  startDate:  string;
  endDate:    string;
  name:       string | null;
  closedAt:   string | null;
  createdAt:  string;
  updatedAt:  string;
  runs?:      PayrollRun[];
}

export interface PayrollRun {
  id:        string;
  periodId:  string;
  status:    RunStatus;
  runAt:     string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id:              string;
  runId:           string;
  employeeId:      string;
  grossPay:        string;
  totalDeductions: string;
  netPay:          string;
  createdAt:       string;
  updatedAt:       string;
  employee?:       Pick<import('./employee').Employee, 'id' | 'firstName' | 'lastName' | 'documentNumber'>;
  lines?:          PayslipLine[];
}

export interface PayslipLine {
  id:          string;
  payslipId:   string;
  conceptCode: string;
  conceptName: string;
  category:    ConceptCategory;
  amount:      string;
}
```

---

## 9. Capa de API — cliente HTTP

### 9.1 `lib/api/client.ts` — Fetch wrapper

```typescript
import { useAuthStore } from '@/stores/auth-store';
import type { ApiResponse, ApiError } from '@/lib/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// Bandera para evitar múltiples refreshes simultáneos
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');

    const json = await res.json();
    const { accessToken: newAccess, refreshToken: newRefresh } = json.data;
    setTokens(newAccess, newRefresh);
    return newAccess;
  } catch {
    logout();
    return null;
  }
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T>(
  path:    string,
  options: FetchOptions = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string> ?? {}),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { headers, ...rest });

  // Manejar 401 con refresh automático
  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) throw new ApiRequestError('Sesión expirada', 401);

    // Retry con nuevo token
    headers['Authorization'] = `Bearer ${newToken}`;
    const retryResponse = await fetch(`${BASE_URL}${path}`, { headers, ...rest });
    return parseResponse<T>(retryResponse);
  }

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  // CSV y otros binarios
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('text/csv')) {
    return response.blob() as unknown as T;
  }

  const json = await response.json();

  if (!response.ok) {
    const err = json as ApiError;
    throw new ApiRequestError(
      Array.isArray(err.message) ? err.message.join(', ') : err.message,
      response.status,
    );
  }

  const envelope = json as ApiResponse<T>;
  return envelope.data;
}

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
```

### 9.2 `lib/constants/api-endpoints.ts`

```typescript
export const API = {
  auth: {
    register:              '/auth/register',
    login:                 '/auth/login',
    refresh:               '/auth/refresh',
    logout:                '/auth/logout',
    logoutAll:             '/auth/logout-all',
    me:                    '/auth/me',
    sessions:              '/auth/sessions',
    session:               (id: string) => `/auth/sessions/${id}`,
    forgotPassword:        '/auth/forgot-password',
    resetPassword:         '/auth/reset-password',
    confirmEmail:          '/auth/confirm-email',
    sendConfirmationEmail: '/auth/send-confirmation-email',
    changePassword:        '/auth/change-password',
  },
  companies: {
    list:              '/companies',
    create:            '/companies',
    detail:            (id: string) => `/companies/${id}`,
    update:            (id: string) => `/companies/${id}`,
    members:           (id: string) => `/companies/${id}/members`,
    member:            (id: string, userId: string) => `/companies/${id}/members/${userId}`,
    transferOwnership: (id: string) => `/companies/${id}/transfer-ownership`,
  },
  employees: {
    list:      (cid: string) => `/companies/${cid}/employees`,
    create:    (cid: string) => `/companies/${cid}/employees`,
    detail:    (cid: string, eid: string) => `/companies/${cid}/employees/${eid}`,
    update:    (cid: string, eid: string) => `/companies/${cid}/employees/${eid}`,
    terminate: (cid: string, eid: string) => `/companies/${cid}/employees/${eid}/terminate`,
  },
  contracts: {
    list:     (cid: string, eid: string) => `/companies/${cid}/employees/${eid}/contracts`,
    create:   (cid: string, eid: string) => `/companies/${cid}/employees/${eid}/contracts`,
    update:   (cid: string, eid: string, ctid: string) => `/companies/${cid}/employees/${eid}/contracts/${ctid}`,
    schedule: (cid: string, eid: string, ctid: string) => `/companies/${cid}/employees/${eid}/contracts/${ctid}/schedule`,
  },
  attendance: {
    list:   (cid: string) => `/companies/${cid}/attendance`,
    create: (cid: string) => `/companies/${cid}/attendance`,
    update: (cid: string, id: string) => `/companies/${cid}/attendance/${id}`,
    delete: (cid: string, id: string) => `/companies/${cid}/attendance/${id}`,
  },
  overtime: {
    list:   (cid: string) => `/companies/${cid}/overtime`,
    create: (cid: string) => `/companies/${cid}/overtime`,
    update: (cid: string, id: string) => `/companies/${cid}/overtime/${id}`,
    delete: (cid: string, id: string) => `/companies/${cid}/overtime/${id}`,
  },
  holidays: {
    list:   (cid: string) => `/companies/${cid}/holidays`,
    create: (cid: string) => `/companies/${cid}/holidays`,
    update: (cid: string, id: string) => `/companies/${cid}/holidays/${id}`,
    delete: (cid: string, id: string) => `/companies/${cid}/holidays/${id}`,
  },
  concepts: {
    list:   (cid: string) => `/companies/${cid}/concepts`,
    detail: (cid: string, id: string) => `/companies/${cid}/concepts/${id}`,
    create: (cid: string) => `/companies/${cid}/concepts`,
    update: (cid: string, id: string) => `/companies/${cid}/concepts/${id}`,
    delete: (cid: string, id: string) => `/companies/${cid}/concepts/${id}`,
  },
  payroll: {
    periods:    (cid: string) => `/companies/${cid}/payroll/periods`,
    period:     (cid: string, pid: string) => `/companies/${cid}/payroll/periods/${pid}`,
    runs:       (cid: string) => `/companies/${cid}/payroll/runs`,
    run:        (cid: string, rid: string) => `/companies/${cid}/payroll/runs/${rid}`,
    calculate:  (cid: string, rid: string) => `/companies/${cid}/payroll/runs/${rid}/calculate`,
    close:      (cid: string, rid: string) => `/companies/${cid}/payroll/runs/${rid}/close`,
    payslips:   (cid: string, rid: string) => `/companies/${cid}/payroll/runs/${rid}/payslips`,
    payslip:    (cid: string, rid: string, pid: string) => `/companies/${cid}/payroll/runs/${rid}/payslips/${pid}`,
    patchLine:  (cid: string, rid: string, pid: string, lid: string) => `/companies/${cid}/payroll/runs/${rid}/payslips/${pid}/lines/${lid}`,
    exportCsv:  (cid: string, rid: string) => `/companies/${cid}/payroll/runs/${rid}/payslips/export`,
  },
} as const;
```

### 9.3 `lib/constants/routes.ts`

```typescript
export const ROUTES = {
  login:          '/login',
  register:       '/register',
  forgotPassword: '/forgot-password',
  resetPassword:  '/reset-password',
  confirmEmail:   '/confirm-email',
  companies:      '/companies',
  newCompany:     '/companies/new',
  profile:        '/profile',

  company:        (id: string) => `/companies/${id}`,
  companyMembers: (id: string) => `/companies/${id}/members`,
  companySettings:(id: string) => `/companies/${id}/settings`,

  employees:      (cid: string) => `/companies/${cid}/employees`,
  newEmployee:    (cid: string) => `/companies/${cid}/employees/new`,
  employee:       (cid: string, eid: string) => `/companies/${cid}/employees/${eid}`,

  attendance:     (cid: string) => `/companies/${cid}/attendance`,
  overtime:       (cid: string) => `/companies/${cid}/overtime`,
  holidays:       (cid: string) => `/companies/${cid}/holidays`,
  concepts:       (cid: string) => `/companies/${cid}/concepts`,
  payroll:        (cid: string) => `/companies/${cid}/payroll`,
  payrollRun:     (cid: string, rid: string) => `/companies/${cid}/payroll/runs/${rid}`,
} as const;
```

---

## 10. Catálogo de componentes reutilizables

Todos los componentes en `components/shared/` son **Client Components** (`'use client'`) salvo indicación. Se importan siempre de forma directa (nunca desde barrel files).

### `DataTable`

Tabla genérica basada en TanStack Table v8 con paginación server-side.

```typescript
// components/shared/data-table.tsx
interface DataTableProps<T> {
  columns:     ColumnDef<T>[];
  data:        T[];
  total:       number;
  page:        number;
  limit:       number;
  isLoading?:  boolean;
  onPageChange:(page: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}
```

**Características:**
- Skeleton de carga (filas fantasma con `animate-pulse`) cuando `isLoading = true`.
- `EmptyState` cuando `data.length === 0` y `!isLoading`.
- Paginación con botones anterior/siguiente y contador "Página X de Y (Z items)".
- Click en fila opcional (con cursor pointer y hover state).
- Ancho de columnas configurable via `ColumnDef`.

### `FormField`

Wrapper de React Hook Form que une `label` + `input` + mensaje de error.

```typescript
// components/shared/form-field.tsx
interface FormFieldProps {
  label:       string;
  name:        string;
  error?:      string;         // mensaje de error de RHF
  required?:   boolean;
  hint?:       string;         // texto de ayuda debajo del campo
  children:    React.ReactNode; // el input real (shadcn Input, Select, etc.)
}
```

### `ConfirmDialog`

Modal de confirmación reutilizable con variantes semánticas.

```typescript
// components/shared/confirm-dialog.tsx
interface ConfirmDialogProps {
  open:        boolean;
  onOpenChange:(open: boolean) => void;
  onConfirm:   () => void | Promise<void>;
  title:       string;
  description: string;
  confirmLabel?: string;     // default: "Confirmar"
  cancelLabel?:  string;     // default: "Cancelar"
  variant?:      'default' | 'danger' | 'warning';
  isLoading?:    boolean;
}
```

**Variantes de color del botón confirmar:**
- `default` → azul accent
- `danger` → rojo (`bg-danger-DEFAULT`)
- `warning` → amarillo (`bg-warning-DEFAULT`)

### `EmptyState`

Placeholder cuando no hay datos.

```typescript
// components/shared/empty-state.tsx
interface EmptyStateProps {
  icon?:       React.ReactNode;  // icono Lucide
  title:       string;
  description?: string;
  action?:     React.ReactNode;  // botón CTA
}
```

### `LoadingSkeleton`

Esqueleto animado adaptable por contexto.

```typescript
// components/shared/loading-skeleton.tsx
interface LoadingSkeletonProps {
  variant: 'table' | 'cards' | 'form' | 'detail';
  rows?:   number;  // para variant="table", default 5
}
```

### `StatCard`

Card de métrica para dashboards.

```typescript
// components/shared/stat-card.tsx
interface StatCardProps {
  title:       string;
  value:       string | number;
  icon:        React.ReactNode;  // icono Lucide
  description?: string;          // texto secundario
  trend?:      { value: number; positive: boolean }; // ej. +12%
  href?:       string;           // si se provee, la card es clickeable
}
```

### `StatusBadge`

Badge coloreado para estados de negocio.

```typescript
// components/shared/status-badge.tsx
type StatusBadgeVariant =
  | 'DRAFT'      // gris
  | 'RUNNING'    // amarillo
  | 'COMPLETED'  // verde
  | 'CLOSED'     // azul
  | 'active'     // verde
  | 'inactive'   // rojo
  | 'EARNING'    // verde
  | 'DEDUCTION'  // rojo
  | 'OT_50'      // naranja
  | 'OT_100'     // rojo
  | 'OWNER'      // violeta
  | 'ADMIN'      // azul
  | 'MANAGER'    // cyan
  | 'MEMBER';    // gris

interface StatusBadgeProps {
  status:  StatusBadgeVariant;
  label?:  string;  // sobreescribe el label por defecto
}
```

### `RoleGate`

Renderiza `children` solo si el usuario tiene el rol mínimo requerido en la empresa activa.

```typescript
// components/shared/role-gate.tsx
interface RoleGateProps {
  roles:    CompanyRole[];       // roles permitidos
  children: React.ReactNode;
  fallback?: React.ReactNode;    // qué renderizar si no tiene permiso (default: null)
}

// Uso:
// <RoleGate roles={['OWNER', 'ADMIN']}>
//   <Button>Crear empleado</Button>
// </RoleGate>
```

Internamente usa `usePermissions().hasRole(roles)`.

### `PageHeader`

Cabecera estándar de página con título, descripción y acciones.

```typescript
// components/shared/page-header.tsx
interface PageHeaderProps {
  title:        string;
  description?: string;
  actions?:     React.ReactNode;  // botones alineados a la derecha
  backHref?:    string;           // flecha de volver
}
```

### `CurrencyDisplay`

Formatea y renderiza montos monetarios de forma consistente.

```typescript
// components/shared/currency-display.tsx
interface CurrencyDisplayProps {
  amount:   string | number | null;
  currency?: string;   // default "ARS"
  hidden?:   boolean;  // para MANAGER: muestra "—" con tooltip
  className?: string;
}
```

Usa `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`.

### `CompanySwitcher`

Dropdown en el sidebar para cambiar la empresa activa.

```typescript
// components/layout/company-switcher.tsx
// Usa companyStore.companies y companyStore.setActiveCompany()
// Muestra avatar/iniciales de empresa, nombre, rol actual
// Al cambiar: redirige a /companies/[newId]
```

---

## 11. Roles y permisos en UI

### 11.1 Jerarquía de roles

```typescript
// lib/constants/roles.ts
export const ROLE_HIERARCHY: Record<CompanyRole, number> = {
  OWNER:   4,
  ADMIN:   3,
  MANAGER: 2,
  MEMBER:  1,
};

export function hasMinRole(
  userRole: CompanyRole,
  minRole:  CompanyRole,
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}
```

### 11.2 Hook `usePermissions`

```typescript
// lib/hooks/use-permissions.ts
import { useCompanyStore } from '@/stores/company-store';
import { hasMinRole } from '@/lib/constants/roles';
import type { CompanyRole } from '@/lib/types/company';

export function usePermissions() {
  const { role } = useCompanyStore();

  return {
    role,

    hasRole: (roles: CompanyRole[]): boolean =>
      role !== null && roles.includes(role),

    isOwner:   () => role === 'OWNER',
    isAdmin:   () => role === 'ADMIN' || role === 'OWNER',
    isManager: () => hasMinRole(role ?? 'MEMBER', 'MANAGER'),

    canEdit:           () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canDelete:         () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canManageMembers:  () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canViewSalary:     () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canManagePayroll:  () => hasMinRole(role ?? 'MEMBER', 'ADMIN'),
    canViewPayroll:    () => hasMinRole(role ?? 'MEMBER', 'MANAGER'),
    canRecordAttendance: () => hasMinRole(role ?? 'MEMBER', 'MANAGER'),
  };
}
```

### 11.3 Matriz de permisos en UI

| Acción | OWNER | ADMIN | MANAGER | MEMBER |
|--------|-------|-------|---------|--------|
| Ver detalle empresa | ✓ | ✓ | ✓ | ✓ |
| Editar empresa | ✓ | ✓ | — | — |
| Ver miembros | ✓ | ✓ | — | — |
| Gestionar miembros | ✓ | ✓* | — | — |
| Transferir ownership | ✓ | — | — | — |
| Ver empleados | ✓ | ✓ | ✓ | — |
| Crear/editar empleados | ✓ | ✓ | — | — |
| Dar de baja empleado | ✓ | ✓ | — | — |
| Ver contratos (sin salario) | ✓ | ✓ | ✓ | — |
| Ver salario | ✓ | ✓ | — | — |
| Crear/editar contratos | ✓ | ✓ | — | — |
| Registrar asistencia | ✓ | ✓ | ✓ | — |
| Borrar asistencia | ✓ | ✓ | — | — |
| Registrar overtime | ✓ | ✓ | ✓ | — |
| Gestionar feriados | ✓ | ✓ | — | — |
| Ver conceptos | ✓ | ✓ | ✓ | — |
| Crear/editar conceptos | ✓ | ✓ | — | — |
| Ver períodos y runs | ✓ | ✓ | ✓ | — |
| Crear período/run | ✓ | ✓ | — | — |
| Calcular/cerrar run | ✓ | ✓ | — | — |
| Ver payslips | ✓ | ✓ | ✓ | — |
| Exportar CSV | ✓ | ✓ | ✓ | — |

> *ADMIN no puede modificar ni quitar al OWNER.

---

## 12. Flujos de negocio críticos

### 12.1 Flujo de liquidación de nómina

```
[1] Crear Período
     └── Página: /payroll
     └── Form: tipo (MONTHLY/BIWEEKLY/WEEKLY/CUSTOM), startDate, endDate, nombre
     └── POST /payroll/periods
     └── Estado: período aparece en lista

[2] Crear Run para el período
     └── Botón "Crear run" en el acordeón del período
     └── POST /payroll/runs { periodId }
     └── Run creado en estado DRAFT

[3] Calcular (ejecutar motor)
     └── Página: /payroll/runs/[runId]
     └── Botón "Calcular" (solo si DRAFT o COMPLETED)
     └── POST /payroll/runs/:id/calculate
     └── Run pasa a RUNNING → polling cada 3s → COMPLETED
     └── DataTable de payslips se actualiza con los recibos generados

[4] Revisar payslips
     └── Tabla con: empleado, bruto, deducciones, neto
     └── Click en fila → drawer con detalle de líneas
     └── Líneas MANUAL: campo editable si run = COMPLETED (A+)
     └── PATCH /payslips/:id/lines/:lineId { amount }

[5] Cerrar run (opcional — irreversible)
     └── Botón "Cerrar nómina" → ConfirmDialog variant="danger"
     └── POST /payroll/runs/:id/close
     └── Run pasa a CLOSED → todos los botones deshabilitados

[6] Exportar CSV
     └── Botón "Exportar CSV" (visible para M+)
     └── GET /payroll/runs/:id/payslips/export
     └── Descarga automática del archivo .csv
```

### 12.2 Gestión de miembros

```
Agregar miembro:
  └── Modal con campo email + selector de rol
  └── POST /companies/:id/members { userId, role }

Cambiar rol:
  └── Dropdown inline en la fila
  └── PATCH /companies/:id/members/:userId { role }
  └── UI bloquea cambiar rol del OWNER (disabled + tooltip)

Quitar miembro:
  └── ConfirmDialog variant="warning"
  └── DELETE /companies/:id/members/:userId
  └── UI bloquea quitar al OWNER si quien actúa es ADMIN

Transferir ownership (solo OWNER):
  └── Sección en /settings o en /members
  └── ConfirmDialog variant="danger"
  └── POST /companies/:id/transfer-ownership { newOwnerUserId }
  └── El OWNER queda como ADMIN
```

### 12.3 Baja lógica de empleado

```
Botón "Dar de baja" (A+) en /employees/[employeeId]
  └── ConfirmDialog variant="danger"
     └── Campo: terminationDate (fecha)
  └── POST /companies/:id/employees/:id/terminate { terminationDate }
  └── Empleado queda con isActive=false, terminationDate seteada
  └── Se mantiene historial: contratos, asistencias, payslips NO se borran
  └── StatusBadge cambia a "Inactivo" (rojo)
```

### 12.4 Export CSV

```
GET /companies/:companyId/payroll/runs/:runId/payslips/export
  └── Respuesta: Content-Type: text/csv (NO envuelto en sobre JSON)
  └── Frontend crea un Blob y dispara descarga:
      const blob = await apiFetch<Blob>(API.payroll.exportCsv(cid, rid));
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `nomina-run-${runId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
```

---

## 13. Variables de entorno

### `.env.local` (desarrollo)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Sistema de Nómina
```

### `.env.example`

```env
# URL base del backend API (sin slash final)
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api

# Nombre de la aplicación (usado en <title> y metadata)
NEXT_PUBLIC_APP_NAME=Sistema de Nómina
```

### `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack es el bundler por defecto en Next.js 16
  // Cache Components (PPR reemplazado)
  cacheComponents: false, // habilitar en producción con análisis previo

  // React Compiler (automemoización)
  reactCompiler: false, // habilitar cuando se mida el impacto

  // Imágenes externas (si se usan avatares de terceros)
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
```

---

## 14. Orden de implementación

```
Fase 0: Setup del proyecto
  ├── npx create-next-app@latest (Next.js 16, TypeScript, Tailwind, App Router)
  ├── Instalar dependencias: zustand, react-hook-form, zod, @tanstack/react-table, lucide-react, sonner
  ├── Configurar shadcn/ui (npx shadcn@latest init)
  ├── Crear lib/constants/colors.ts y configurar tailwind.config.ts
  ├── Crear lib/constants/routes.ts y lib/constants/api-endpoints.ts
  ├── Configurar fuentes Geist en root layout
  └── Crear root layout con Toaster (Sonner)

Fase 1: Autenticación
  ├── stores/auth-store.ts (Zustand + persist)
  ├── lib/api/client.ts (fetch wrapper + refresh interceptor)
  ├── lib/api/auth.ts (todas las funciones de auth)
  ├── proxy.ts (protección de rutas)
  ├── Páginas: login, register, forgot-password, reset-password, confirm-email
  ├── Layout (auth): centrado, formularios con shadcn/ui
  └── AuthHydrator en root layout

Fase 2: Empresas y miembros
  ├── stores/company-store.ts
  ├── stores/ui-store.ts
  ├── components/layout/sidebar.tsx (con company-switcher)
  ├── components/layout/header.tsx
  ├── components/shared/page-header.tsx
  ├── components/shared/role-gate.tsx
  ├── lib/hooks/use-permissions.ts
  ├── Páginas: /companies, /companies/new, /companies/[id]
  └── Páginas: /companies/[id]/members, /companies/[id]/settings

Fase 3: Empleados y contratos
  ├── components/shared/data-table.tsx (tabla genérica)
  ├── components/shared/form-field.tsx
  ├── components/shared/confirm-dialog.tsx
  ├── components/shared/status-badge.tsx
  ├── components/shared/currency-display.tsx
  ├── lib/api/employees.ts + contracts.ts
  └── Páginas: /employees, /employees/new, /employees/[id]

Fase 4: Asistencia, overtime, feriados
  ├── lib/api/attendance.ts + overtime.ts + holidays.ts
  ├── components/shared/empty-state.tsx
  ├── components/shared/loading-skeleton.tsx
  └── Páginas: /attendance, /overtime, /holidays

Fase 5: Conceptos de nómina
  ├── lib/api/concepts.ts
  └── Páginas: /concepts (formulario dinámico por calcType)

Fase 6: Motor de liquidación
  ├── lib/api/payroll.ts
  ├── Páginas: /payroll (períodos y runs)
  ├── Páginas: /payroll/runs/[id] (detalle con payslips, acciones, polling)
  └── Export CSV

Fase 7: Pulido y perfil
  ├── Páginas: /profile (datos usuario, sesiones, cambiar contraseña)
  ├── components/shared/stat-card.tsx (dashboard de empresa)
  ├── Loading skeletons en todas las páginas
  ├── Empty states con CTAs
  ├── Responsive: sidebar colapsable en tablet, drawer en móvil
  └── Metadatos Next.js (title, description por página)
```

---

## 15. Referencias

| Recurso | URL |
|---------|-----|
| Backend SPEC | `c:\Users\Pablo\Desktop\Back\SPEC.md` |
| Backend API Reference | `c:\Users\Pablo\Desktop\Back\docs\API-REFERENCE.md` |
| Backend AUTH docs | `c:\Users\Pablo\Desktop\Back\docs\AUTH.md` |
| Backend Roles docs | `c:\Users\Pablo\Desktop\Back\docs\ROLES-AND-PERMISSIONS.md` |
| Backend Payroll Engine | `c:\Users\Pablo\Desktop\Back\docs\PAYROLL-ENGINE.md` |
| Next.js 16 docs | https://nextjs.org/docs |
| Next.js 16 changelog | https://nextjs.org/blog/next-16 |
| Zustand docs | https://zustand.docs.pmnd.rs |
| shadcn/ui docs | https://ui.shadcn.com |
| TanStack Table | https://tanstack.com/table/v8 |
| React Hook Form | https://react-hook-form.com |
| Zod | https://zod.dev |
| Skill: frontend-design | `C:\Users\Pablo\.agents\skills\frontend-design\SKILL.md` |
| Skill: vercel-react-best-practices | `C:\Users\Pablo\.agents\skills\vercel-react-best-practices\SKILL.md` |
