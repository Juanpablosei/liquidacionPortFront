# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js + Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

No test suite is configured.

## Architecture

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

### Auth & Session

- `src/stores/auth-store.ts` — Zustand persisted store; holds `accessToken`, `refreshToken`, `user`
- `src/components/auth-hydrator.tsx` — client component in root layout that calls `hydrate()` to unblock the loading state after localStorage rehydration
- `src/proxy.ts` — Next.js middleware (filename is `proxy.ts`, exported as `config`); guards `/companies/*` and `/profile`; uses the `auth-token` cookie (a presence-only cookie set by the auth store on login/logout)
- Token refresh is handled automatically in `src/lib/api/client.ts` on 401 responses

### API Client

`src/lib/api/client.ts` — `apiFetch<T>(path, options)`:
- Base URL from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000/api`)
- Unwraps the backend envelope `{ success, data, message, timestamp }` → returns `data` directly
- Auto-refreshes JWT on 401; throws `ApiRequestError` on failures
- Supports `skipAuth: true` for public endpoints
- Returns `Blob` for `text/csv` responses

API modules in `src/lib/api/` (`auth`, `companies`, `employees`, `contracts`, `attendance`, `overtime`, `holidays`, `concepts`, `payroll`) use `apiFetch` and the `API` constants from `src/lib/constants/api-endpoints.ts`.

Paginated endpoints return `PaginatedResponse<T> = { items, total, page, limit, pages }`.

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

### Design System

Dark theme. Background `#0A0F1C`, accent `#2563EB`. Tailwind v4 + shadcn/ui primitives in `src/components/ui/`. Utility: `cn()` from `src/lib/utils/cn.ts`. No gradients; 150–200ms CSS transitions.

## Implementation Status

All phases are complete:

- ✅ Phase 1: Auth
- ✅ Phase 2: Companies & members
- ✅ Phase 3: Employees & contracts
- ✅ Phase 4: Attendance, overtime, holidays
- ✅ Phase 5: Payroll concepts
- ✅ Phase 6: Payroll engine (periods → runs → payslips → CSV export)
- ✅ Phase 7: Polish (skeletons, empty states, responsive, profile)
