# Silent Port — Sistema de Gestion de Nomina

SaaS multi-tenant para gestion completa de nomina. Next.js 16 + React 19 + NestJS backend.

## Quick Start

```bash
npm install          # Instalar dependencias
npm run dev          # Dev server (http://localhost:3001)
npm run build        # Build de produccion
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

Requiere el backend NestJS corriendo en `http://localhost:3000/api`.

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 16 + Turbopack | Framework + dev server |
| React 19 | UI library |
| TypeScript 5 | Tipado estatico |
| Tailwind CSS v4 | Estilos utility-first |
| shadcn/ui | Componentes base (dark theme) |
| Zustand 5 | State management (auth, company, ui) |
| React Hook Form 7 + Zod | Formularios + validacion |
| TanStack Table v8 | Tablas con paginacion server-side |
| Lucide React | Iconografia |
| date-fns | Manejo de fechas |

## Estructura del Proyecto

```
src/
  app/
    (auth)/              — Login, registro, recuperar contrasena, confirmar email
    (dashboard)/         — Shell protegido (sidebar + header)
      companies/         — Listado y creacion de empresas
      companies/[companyId]/
        page.tsx         — Dashboard de la empresa
        employees/       — Gestion de empleados
        members/         — Miembros del equipo
        settings/        — Configuracion de la empresa
        attendance/      — Control de asistencia
        overtime/        — Horas extra
        holidays/        — Calendario de feriados
        concepts/        — Conceptos de nomina (haberes/deducciones)
        payroll/         — Periodos, corridas, recibos, CSV/PDF
      profile/           — Perfil del usuario
  components/
    layout/              — Sidebar, header, company-switcher
    shared/              — Componentes reutilizables (ver abajo)
    ui/                  — Primitivos shadcn/ui
  lib/
    api/                 — Cliente HTTP + modulos por recurso
    constants/           — Rutas, endpoints, colores, roles
    hooks/               — use-auth, use-company, use-permissions, use-debounce
    types/               — Tipos TypeScript
    utils/               — cn() y helpers
    validators/          — Schemas Zod
  stores/                — auth-store, company-store, ui-store
  proxy.ts               — Middleware de proteccion de rutas
```

## Componentes Compartidos (`src/components/shared/`)

| Componente | Que hace |
|---|---|
| `DataTable` | Tabla con TanStack Table v8, paginacion server-side |
| `FormField` | Wrapper de React Hook Form Controller con label + error + input shadcn |
| `ConfirmDialog` | Dialog de confirmacion para acciones destructivas |
| `LoadingSkeleton` | Skeleton loader reutilizable |
| `StatusBadge` | Badge de estado (activo, inactivo, pendiente, etc.) |
| `CurrencyDisplay` | Formato de moneda (Gs.) |
| `EmptyState` | Estado vacio con icono y mensaje |
| `StatCard` | Tarjeta de KPI con titulo, valor e icono |
| `PageHeader` | Header de pagina con titulo, descripcion y acciones |
| `RoleGate` | Renderizado condicional por rol del usuario |

## API Client

`src/lib/api/client.ts` expone `apiFetch<T>(path, options)`:
- Conecta con el backend NestJS en `NEXT_PUBLIC_API_URL`
- Desenvuelve automaticamente el envelope `{ success, data, message }` y retorna `data`
- Refresh automatico de JWT en respuestas 401
- Retorna `Blob` para respuestas `text/csv`

Modulos disponibles en `src/lib/api/`: `auth`, `companies`, `employees`, `contracts`, `attendance`, `overtime`, `holidays`, `concepts`, `payroll`.

## Roles y Permisos

Jerarquia: **OWNER > ADMIN > MANAGER > MEMBER**

| Modulo | MEMBER | MANAGER | ADMIN | OWNER |
|---|---|---|---|---|
| Dashboard | Ver | Ver | Ver | Ver |
| Empleados | — | Ver | Todo | Todo |
| Contratos | — | Ver | Todo | Todo |
| Asistencia | — | Ver | Todo | Todo |
| Nomina | — | Ver | Todo | Todo |
| Mis Recibos | Ver/Firmar | — | — | — |
| Miembros | — | — | Gestionar | Todo |
| Configuracion | Ver | Ver | Editar | Todo |

## Ramas

| Rama | Uso |
|---|---|
| `main` | Codigo estable principal |
| `dev` | Desarrollo e integracion |
| `produccion` | Deploy a produccion |

---

## Claude Code Integration

Este proyecto usa [Claude Code](https://claude.ai/code) con configuracion avanzada:

### Agentes (`.claude/agents/`)

| Agente | Rol | Cuando usarlo |
|---|---|---|
| `implementer` | Desarrollador senior | Features complejas (3+ archivos). Sigue orden: types -> validators -> API -> hooks -> page |
| `code-reviewer` | QA especialista | Auditar calidad: dark theme, patterns, permisos, API patterns |
| `researcher` | Investigador tecnico | Evaluar paquetes, verificar APIs, buscar en docs oficiales. Protocolo anti-alucinacion |

### Skills (`.claude/skills/`)

| Skill | Comando | Que hace |
|---|---|---|
| **scaffold-feature** | `/scaffold-feature <name>` | Genera estructura de archivos para una nueva feature (type + validator + API module + page) |
| **new-feature** | `/new-feature <name>` | Pipeline completo: scaffold -> implementar -> review -> commit |
| **commit** | `/commit <msg>` | Verifica calidad (tsc + lint), luego crea commit con Conventional Commits |
| **deploy-check** | `/deploy-check` | Checklist de 9 puntos pre-merge: tsc, lint, build, console.logs, URLs hardcodeadas, file sizes |
| **evaluate** | `/evaluate <req>` | Evalua scope, esfuerzo (LOW/MED/HIGH), riesgos y dependencias de un requerimiento |
| **status** | `/status` | Reporte del proyecto: branch, fases, metricas del codebase, calidad, git status |
| **review** | `/review` | Code review de cambios recientes contra checklist de calidad |

### Task Management (`tasks/`)

| Archivo | Proposito |
|---|---|
| `todo.md` | Plan de tarea activa con checklist verificable |
| `lessons.md` | Loop de auto-mejora: errores -> causa -> regla -> aplica a |

### Settings (`.claude/settings.local.json`)

- **23 allow rules**: git ops, npm scripts, shadcn, herramientas de lectura
- **7 deny rules**: `rm -rf`, force push, hard reset, npm publish, lectura de .env

### CI/CD (`.github/workflows/`)

| Workflow | Trigger | Checks |
|---|---|---|
| `ci.yml` | Pull Request a main/dev/produccion | TypeScript -> ESLint -> Build |

---

## Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api   # URL del backend NestJS
```

Ver `.env.example` para la lista completa.
