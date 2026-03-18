# CLAUDE.md — Silent Port v1.0
# ═══════════════════════════════════════
# Next.js 16 + React 19 + NestJS Backend
# Este archivo es la fuente de verdad. Se carga en cada sesion.

## SCOPE DE TRABAJO
- **SOLO trabajar en este repositorio frontend** (`C:\Users\Pablo\Desktop\Front`).
- **NUNCA modificar archivos del backend** (`C:\Users\Pablo\Desktop\Back`). Solo lectura para consultar endpoints o tipos.
- Si se detectan issues en el backend, documentarlos en `tasks/todo.md` del front como referencia, pero NO corregirlos.

## IDIOMA Y COMUNICACION
- Responder SIEMPRE en espanol.
- Codigo, variables, nombres de archivos, commits y branches en ingles.
- Mensajes de error y logs en ingles.
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.

## GESTION DE OUTPUT — EVITAR TRUNCAMIENTO (CRITICAL)

### Regla: NUNCA exceder el limite de tokens de respuesta
Claude Code tiene un limite de ~32K tokens por respuesta. Excederlo causa error fatal y se pierde TODO el trabajo.

### Estrategias OBLIGATORIAS
1. **UN archivo por tool call**: NUNCA generar multiples archivos completos en un solo mensaje.
2. **Archivos > 80 lineas**: escribir con `Write` tool directamente al disco. NUNCA mostrar contenido completo en chat.
3. **Iterar, no acumular**: crear archivo -> verificar -> siguiente archivo.
4. **Reportes concisos**: resumenes en bullets cortos, NO texto extenso.
5. **Codigo en archivos, NO en chat**: si el codigo tiene mas de 20 lineas, escribirlo a un archivo.
6. **Listas de archivos**: al crear multiples archivos, reportar solo `path -> descripcion (N lineas)`. NO mostrar contenido.
7. **Dividir tareas grandes**: si una tarea requiere >5 archivos, dividir en sub-tareas y ejecutar secuencialmente.

## DIRECTIVAS DE COMPORTAMIENTO

### Principios Fundamentales
- **Simplicidad Primero**: Haz que cada cambio sea lo mas simple posible. Afecta al minimo codigo necesario.
- **Sin Pereza**: Encuentra las causas raiz. Nada de arreglos temporales. Estandares de desarrollador senior.
- **Impacto Minimo**: Los cambios solo deben tocar lo necesario. Evita introducir errores.

### Orquestacion del Flujo de Trabajo

#### 1. Modo Planificacion por Defecto
- Entrar en modo planificacion para CUALQUIER tarea no trivial (mas de 3 pasos o decisiones arquitectonicas).
- Si algo sale mal, PARAR y volver a planificar de inmediato.
- El plan debe incluir: archivos a crear/modificar, dependencias, riesgos.
- Si la tarea es ambigua, hacer MAX 3 preguntas de clarificacion y esperar respuesta.

#### 2. Modo Orquestador (OBLIGATORIO)
- El contexto principal es SOLO para planificar, orquestar y comunicar con el usuario.
- NUNCA ejecutar tareas de implementacion directamente en el contexto principal.
- TODA lectura de codigo, escritura de archivos, busqueda y ejecucion de comandos debe delegarse a subagentes.
- Una tarea por subagente para ejecucion focalizada.
- Lanzar subagentes en paralelo cuando las tareas sean independientes.
- Excepciones permitidas en contexto principal: leer CLAUDE.md, tasks/, memory/, y comunicacion directa con el usuario.

#### 3. Bucle de Automejora
- Tras CUALQUIER correccion del usuario: actualizar `tasks/lessons.md` con el patron.
- Escribir reglas para ti mismo que eviten el mismo error.
- Revisar las lecciones al inicio de la sesion.

#### 4. Verificacion antes de Finalizar
- NUNCA marcar una tarea como completada sin demostrar que funciona.
- Preguntate: "Aprobaria esto un ingeniero senior?"
- Despues de editar: `npm run lint` y `npx tsc --noEmit`.

#### 5. Exige Elegancia (Equilibrado)
- Para cambios no triviales: hacer una pausa y preguntar "hay una forma mas elegante?"
- Omitir esto para arreglos simples y obvios; no hacer sobreingenieria.

#### 6. Correccion de Errores Autonoma
- Cuando recibas un informe de error: simplemente arreglalo. No pidas que te lleven de la mano.
- Identificar logs, errores o tests que fallan y luego resuelve.

### Gestion de Tareas
1. **Planificar Primero**: Escribir el plan en `tasks/todo.md` con elementos verificables.
2. **Seguir el Progreso**: Marcar los elementos como completados a medida que avances.
3. **Documentar Resultados**: Anadir seccion de revision a `tasks/todo.md`.
4. **Capturar Lecciones**: Actualizar `tasks/lessons.md` despues de las correcciones.

### Uso de Agentes y Skills
- Para features nuevas: skill `/scaffold-feature` -> agente `implementer` -> agente `code-reviewer`.
- Para UI y layouts: consultar skill `ui-ux-pro-max`.
- Para investigar: agente `researcher` ANTES de elegir paquetes o patrones.
- NUNCA improvisar patrones; SIEMPRE consultar el skill correspondiente.

### Generacion de Codigo — Explicito y Limpio
- TypeScript estricto: `strict: true`, NUNCA `any`, NUNCA `as` sin justificacion.
- Cada funcion con tipado explicito de parametros Y retorno.
- Componentes < 300 lineas. Hooks < 100 lineas. API modules < 80 lineas.
- Un archivo = una responsabilidad. Separar UI / logica / datos.
- Imports con alias `@/` para rutas internas.
- `'use client'` solo cuando necesario (hooks, event handlers, browser APIs).
- Nombrar explicitamente: `getUserById` > `getUser` > `get`.
- Preferir claridad sobre brevedad. Codigo autodocumentado > comentarios.
- NO dejar TODOs sin descripcion. Formato: `// TODO: que falta y por que`.

### Proteccion del Codigo Existente
- ANTES de modificar: leer contenido completo con Read. Entender dependencias.
- Identificar y preservar: tipos exportados, barrel exports, contratos de API.
- Cambios minimos y focalizados. PROHIBIDO refactorizar codigo no solicitado.
- Si un cambio puede romper otros archivos: listarlos ANTES con impacto estimado.
- Despues de editar: `npm run lint` y `npx tsc --noEmit`.

### Gestion de Contexto y Memoria
- Usar `tasks/todo.md` para rastrear progreso de tareas multi-paso.
- Usar `tasks/lessons.md` para capturar lecciones aprendidas de errores.
- Cuando el contexto supere ~60%, avisar PROACTIVAMENTE y sugerir `/compact` o `/clear`.
- Para tareas largas (>30 min estimado), crear plan escrito en `tasks/todo.md`.

---

## ESTILO VISUAL — Tailwind + shadcn/ui

### Stack UI
- **Tailwind CSS v4** — utility-first.
- **shadcn/ui** — componentes base en `src/components/ui/`. ANTES de usar, verificar que esta instalado con `ls src/components/ui/`.
- **Lucide React** — iconos. NUNCA instalar otra libreria de iconos.

### Design System (OBLIGATORIO)
- **Dark theme**: Background `#0A0F1C`, accent `#2563EB`.
- **NO gradientes** decorativos. Transiciones CSS-only 150-200ms.
- **Card bg**: `bg-card` o `bg-[#111827]`. Border: `border-border`.
- **Text**: `text-foreground` (primary), `text-muted-foreground` (secondary).
- **Spacing**: page `p-6`, card `p-4`, gap `gap-4` o `gap-6`.
- Todos los elementos interactivos necesitan hover states.

### Convenciones Tailwind
- NUNCA usar `@apply` en CSS. Todo inline con clases de Tailwind.
- NUNCA usar `style={{}}` inline excepto para valores dinamicos calculados.
- Orden de clases: layout -> spacing -> sizing -> typography -> colors -> effects.
- Usar `cn()` de `src/lib/utils/cn.ts` para clases condicionales.
- NUNCA colores hardcodeados fuera de los tokens del design system.

---

## FORMULARIOS Y VALIDACION

### Stack
- **React Hook Form** — manejo de estado del form. NUNCA usar `useState` para forms.
- **Zod** — schemas de validacion. NUNCA validar manualmente con `if/else`.
- **FormField** (`src/components/shared/form-field.tsx`) — wrapper de RHF Controller con label, error y shadcn input.

### Convenciones
- Schemas Zod en `src/lib/validators/{resource}.ts`.
- SIEMPRE exportar tanto el schema como el tipo inferido (`z.infer<typeof schema>`).
- Naming: `create[Entity]Schema`, `Create[Entity]Input`, `update[Entity]Schema`, `Update[Entity]Input`.
- Reutilizar schemas: `updateSchema = createSchema.partial()` para updates parciales.

---

## ANTI-ALUCINACION — PROTOCOLO ESTRICTO

### Verificacion de APIs (OBLIGATORIO)
1. **React 19**: Verificar hooks y APIs contra https://react.dev. React 19 tiene cambios breaking.
2. **Next.js 16**: Verificar contra https://nextjs.org/docs. App Router patterns.
3. **Tailwind CSS v4**: Verificar clases contra https://tailwindcss.com/docs. NUNCA inventar clases.
4. **shadcn/ui**: Verificar con `ls src/components/ui/`. NUNCA asumir que un componente esta instalado.

### Verificacion de Estructura (OBLIGATORIO)
- ANTES de importar un archivo, verificar que existe con `Glob` o `Read`.
- ANTES de usar un tipo, verificar que esta definido en `src/lib/types/`.
- NUNCA asumir la estructura de carpetas; siempre verificar con `Glob`.

### Protocolo de Honestidad
- Si no sabes algo: **DECIRLO** explicitamente. "No estoy seguro de X, dejame verificar."
- Si una busqueda no arroja resultados claros: reportarlo, no inventar.
- NUNCA decir "esto deberia funcionar" sin haberlo verificado contra documentacion.
- Preferir "segun la documentacion de [fuente]..." sobre afirmaciones sin respaldo.

---

## ARQUITECTURA

Multi-tenant payroll SaaS frontend (Next.js 16 + React 19). All data is scoped to a **company** — most API routes are `/companies/:companyId/...`. The active company is selected via the company switcher in the sidebar and persisted in Zustand + localStorage.

Backend is a NestJS REST API at `c:\Users\Pablo\Desktop\Back`. Full spec at `SPEC.md`.

### Route Structure

```
src/app/
  (auth)/         — login, register, forgot/reset-password, confirm-email
  (dashboard)/    — protected shell with sidebar + header
    companies/    — company list, new company
    companies/[companyId]/
      layout.tsx  — company-scoped layout; loads companyId from params
      page.tsx    — overview/stats
      employees/  — list, new, [employeeId]
      members/    — company members
      settings/   — company settings
      attendance/ — attendance tracking
      overtime/   — overtime management
      holidays/   — holiday calendar
      concepts/   — payroll concepts (earnings/deductions)
      payroll/    — payroll periods, runs/[runId] (payslips + CSV export)
    profile/      — user profile
```

### Project Structure

```
src/
  app/              — Next.js App Router pages
  components/
    layout/         — sidebar, header, company-switcher
    shared/         — data-table, form-field, confirm-dialog, etc.
    ui/             — shadcn/ui primitives
  lib/
    api/            — client.ts + per-resource API modules
    constants/      — routes, api-endpoints, colors, roles
    hooks/          — use-auth, use-company, use-permissions, use-debounce
    types/          — TypeScript types
    utils/          — cn.ts and helpers
    validators/     — Zod schemas
  stores/           — auth-store, company-store, ui-store
  proxy.ts          — route protection middleware
```

### Auth & Session

- `src/stores/auth-store.ts` — Zustand persisted store; holds `accessToken`, `refreshToken`, `user`
- `src/components/auth-hydrator.tsx` — client component in root layout that calls `hydrate()` to unblock the loading state after localStorage rehydration
- `src/proxy.ts` — Next.js middleware; guards `/companies/*` and `/profile`; uses the `auth-token` cookie
- Token refresh is handled automatically in `src/lib/api/client.ts` on 401 responses

### API Client

`src/lib/api/client.ts` — `apiFetch<T>(path, options)`:
- Base URL from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000/api`)
- Unwraps the backend envelope `{ success, data, message, timestamp }` -> returns `data` directly
- Auto-refreshes JWT on 401; throws `ApiRequestError` on failures
- Supports `skipAuth: true` for public endpoints
- Returns `Blob` for `text/csv` responses

API modules in `src/lib/api/` use `apiFetch` and the `API` constants from `src/lib/constants/api-endpoints.ts`.

Paginated endpoints return `PaginatedResponse<T> = { items, total, page, limit, pages }`.

### API Patterns for New Modules
- Create file in `src/lib/api/{resource}.ts`
- Use API constants from `src/lib/constants/api-endpoints.ts`
- Company-scoped URLs: `/companies/${companyId}/{resource}`
- Always handle loading + error + empty states in pages

### State Management

- `auth-store` — user + tokens, persisted to `localStorage`
- `company-store` — `activeCompany`, `role`, `companies[]`, persisted (only `activeCompany` + `role`)
- `ui-store` — sidebar collapse state (not persisted)

### Permissions

`src/lib/hooks/use-permissions.ts` — reads `role` from company-store and exposes helpers like `canEdit()`, `canManagePayroll()`, etc. Role hierarchy: `OWNER > ADMIN > MANAGER > MEMBER`.

Use `<RoleGate minRole="ADMIN">` (`src/components/shared/role-gate.tsx`) to conditionally render UI.

### Shared Components

All in `src/components/shared/`:
- `DataTable` — TanStack Table v8 with server-side pagination; takes `columns`, `data`, `total`, `page`, `limit`, `onPageChange`
- `FormField` — wraps React Hook Form `Controller` with label, error, and shadcn input
- `ConfirmDialog` — generic destructive-action dialog
- `LoadingSkeleton` — reusable skeleton loader
- `StatusBadge`, `CurrencyDisplay`, `EmptyState`, `StatCard`, `PageHeader`

---

## COMANDOS

```bash
npm run dev      # Dev server (Next.js + Turbopack)
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type check (no test suite configured)
```

---

## DIRECTIVAS ESPECIFICAS DEL PROYECTO

### Nombre: Silent Port
### Descripcion: SaaS multi-tenant de gestion de nomina
### Dominio: HR / Payroll
### Backend: NestJS REST API en `c:\Users\Pablo\Desktop\Back`
### Spec: `SPEC.md` (70KB, muy detallado)
### Ramas: main, dev, produccion

### Reglas de Negocio Criticas
- Todo dato esta scoped a una company (companyId en la URL)
- Solo OWNER puede transferir propiedad
- Corrida cerrada es irreversible (no se puede modificar ningun recibo)
- Liquidacion marca empleado como inactivo automaticamente
- Un solo contrato activo por empleado a la vez

### Implementation Status

All phases are complete:

- Phase 1: Auth
- Phase 2: Companies & members
- Phase 3: Employees & contracts
- Phase 4: Attendance, overtime, holidays
- Phase 5: Payroll concepts
- Phase 6: Payroll engine (periods -> runs -> payslips -> CSV export)
- Phase 7: Polish (skeletons, empty states, responsive, profile)
