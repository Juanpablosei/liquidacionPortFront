# Features — Backend ↔ Frontend Contract

Registro de cada feature con sus endpoints, archivos frontend y estado.
Cuando el backend agrega un endpoint nuevo, documentarlo aca antes de implementar.

---

## Cómo agregar una feature nueva

1. El backend crea los endpoints y los documenta abajo
2. Correr `/evaluate <nombre>` para medir impacto
3. Correr `/scaffold-feature <nombre>` o `/new-feature <nombre>`
4. Verificar que los tipos matchean con la respuesta del backend
5. Marcar status como "Listo"

### Template

```markdown
## Feature: [Nombre]
**Status**: Pendiente | En progreso | Listo
**Rol minimo**: ADMIN
**Backend PR/branch**: [link o nombre]

### Endpoints
| Metodo | Ruta | Body | Response |
|--------|------|------|----------|
| GET | /companies/:cid/recurso | — | PaginatedResponse<Recurso> |
| POST | /companies/:cid/recurso | CreateRecursoInput | Recurso |

### Frontend Files
- `src/lib/types/recurso.ts`
- `src/lib/validators/recurso.ts`
- `src/lib/api/recurso.ts`
- `src/lib/constants/api-endpoints.ts` (agregar endpoints)
- `src/app/(dashboard)/companies/[companyId]/recurso/page.tsx`

### Notas
[Reglas de negocio, edge cases, dependencias]
```

---

## Features Implementadas

---

### 1. Auth
**Status**: Listo
**Rol minimo**: Publico / Autenticado

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/auth/register` | Crear cuenta |
| POST | `/auth/login` | Iniciar sesion |
| POST | `/auth/refresh` | Refrescar JWT |
| POST | `/auth/logout` | Cerrar sesion |
| POST | `/auth/logout-all` | Cerrar todas las sesiones |
| GET | `/auth/me` | Datos del usuario actual |
| GET | `/auth/sessions` | Sesiones activas |
| DELETE | `/auth/sessions/:id` | Cerrar sesion especifica |
| POST | `/auth/forgot-password` | Enviar email de recuperacion |
| POST | `/auth/reset-password` | Restablecer contrasena |
| POST | `/auth/confirm-email` | Confirmar email |
| POST | `/auth/send-confirmation-email` | Reenviar confirmacion |
| PATCH | `/auth/change-password` | Cambiar contrasena |
| PATCH | `/auth/locale` | Cambiar idioma |

#### Frontend Files
- `src/lib/api/auth.ts`
- `src/lib/types/auth.ts`
- `src/lib/validators/auth.ts`
- `src/stores/auth-store.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/confirm-email/page.tsx`

---

### 2. Companies
**Status**: Listo
**Rol minimo**: Autenticado (listar/crear), ADMIN (editar)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies` | Listar empresas del usuario |
| POST | `/companies` | Crear empresa |
| GET | `/companies/:id` | Detalle de empresa |
| PATCH | `/companies/:id` | Actualizar empresa |

#### Frontend Files
- `src/lib/api/companies.ts`
- `src/lib/types/company.ts`
- `src/lib/validators/company.ts`
- `src/stores/company-store.ts`
- `src/app/(dashboard)/companies/page.tsx`
- `src/app/(dashboard)/companies/new/page.tsx`
- `src/app/(dashboard)/companies/[companyId]/page.tsx`
- `src/app/(dashboard)/companies/[companyId]/settings/page.tsx`

---

### 3. Members
**Status**: Listo
**Rol minimo**: ADMIN (gestionar), OWNER (transferir)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/members` | Listar miembros |
| POST | `/companies/:cid/members` | Agregar miembro |
| PATCH | `/companies/:cid/members/:userId` | Cambiar rol |
| DELETE | `/companies/:cid/members/:userId` | Eliminar miembro |
| DELETE | `/companies/:cid/members/me` | Salir de la empresa |
| POST | `/companies/:cid/transfer-ownership` | Transferir propiedad |

#### Frontend Files
- `src/lib/api/companies.ts` (mismos endpoints)
- `src/lib/types/company.ts` (Member type)
- `src/app/(dashboard)/companies/[companyId]/members/page.tsx`

---

### 4. Employees
**Status**: Listo
**Rol minimo**: MANAGER (ver), ADMIN (CRUD)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/employees` | Listar empleados (paginado) |
| POST | `/companies/:cid/employees` | Crear empleado |
| GET | `/companies/:cid/employees/:eid` | Detalle |
| PATCH | `/companies/:cid/employees/:eid` | Actualizar |
| POST | `/companies/:cid/employees/:eid/terminate` | Dar de baja |
| GET | `/companies/:cid/employees/import/template` | Descargar plantilla Excel |
| POST | `/companies/:cid/employees/import` | Importar desde Excel |

#### Frontend Files
- `src/lib/api/employees.ts`
- `src/lib/types/employee.ts`
- `src/lib/validators/employee.ts`
- `src/app/(dashboard)/companies/[companyId]/employees/page.tsx`
- `src/app/(dashboard)/companies/[companyId]/employees/new/page.tsx`
- `src/app/(dashboard)/companies/[companyId]/employees/[employeeId]/page.tsx`

---

### 5. Contracts
**Status**: Listo
**Rol minimo**: MANAGER (ver), ADMIN (CRUD)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/employees/:eid/contracts` | Listar contratos |
| POST | `/companies/:cid/employees/:eid/contracts` | Crear contrato |
| PATCH | `/companies/:cid/employees/:eid/contracts/:ctid` | Actualizar |
| PUT | `/companies/:cid/employees/:eid/contracts/:ctid/schedule` | Horario laboral |
| GET | `/companies/:cid/employees/:eid/contracts/:ctid/concepts` | Conceptos asignados |
| POST | `/companies/:cid/employees/:eid/contracts/:ctid/concepts` | Asignar concepto |
| DELETE | `/companies/:cid/employees/:eid/contracts/:ctid/concepts/:conId` | Quitar concepto |

#### Frontend Files
- `src/lib/api/contracts.ts`
- `src/lib/types/employee.ts` (Contract type)
- En la pagina de detalle del empleado (no tiene pagina propia)

---

### 6. Attendance
**Status**: Listo
**Rol minimo**: MANAGER (ver/registrar), ADMIN (CRUD)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/attendance` | Listar registros (paginado, filtros) |
| POST | `/companies/:cid/attendance` | Registrar asistencia |
| PATCH | `/companies/:cid/attendance/:id` | Actualizar registro |
| DELETE | `/companies/:cid/attendance/:id` | Eliminar registro |

#### Frontend Files
- `src/lib/api/attendance.ts`
- `src/lib/types/attendance.ts`
- `src/app/(dashboard)/companies/[companyId]/attendance/page.tsx`

---

### 7. Overtime
**Status**: Listo
**Rol minimo**: MANAGER (ver/registrar), ADMIN (CRUD)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/overtime` | Listar horas extra (paginado) |
| POST | `/companies/:cid/overtime` | Registrar hora extra |
| PATCH | `/companies/:cid/overtime/:id` | Actualizar |
| DELETE | `/companies/:cid/overtime/:id` | Eliminar |

#### Frontend Files
- `src/lib/api/overtime.ts`
- `src/lib/types/attendance.ts` (OvertimeRecord type)
- `src/app/(dashboard)/companies/[companyId]/overtime/page.tsx`

---

### 8. Holidays
**Status**: Listo
**Rol minimo**: MEMBER (ver), ADMIN (CRUD)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/holidays` | Listar feriados (filtro por ano) |
| POST | `/companies/:cid/holidays` | Crear feriado |
| PATCH | `/companies/:cid/holidays/:id` | Actualizar |
| DELETE | `/companies/:cid/holidays/:id` | Eliminar |

#### Frontend Files
- `src/lib/api/holidays.ts`
- `src/lib/types/attendance.ts` (Holiday type)
- `src/app/(dashboard)/companies/[companyId]/holidays/page.tsx`

---

### 9. Concepts
**Status**: Listo
**Rol minimo**: MANAGER (ver), ADMIN (CRUD)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/concepts` | Listar conceptos |
| GET | `/companies/:cid/concepts/:id` | Detalle |
| POST | `/companies/:cid/concepts` | Crear concepto |
| PATCH | `/companies/:cid/concepts/:id` | Actualizar |
| DELETE | `/companies/:cid/concepts/:id` | Soft delete |

#### Tipos de calculo
- **FIXED**: monto fijo
- **PERCENTAGE**: % del salario base o bruto
- **PER_HOUR**: tarifa por hora trabajada
- **MANUAL**: se ingresa en cada corrida

#### Frontend Files
- `src/lib/api/concepts.ts`
- `src/lib/types/payroll.ts` (Concept type)
- `src/app/(dashboard)/companies/[companyId]/concepts/page.tsx`

---

### 10. Payroll (Periods + Runs + Payslips)
**Status**: Listo
**Rol minimo**: MANAGER (ver), ADMIN (CRUD)

#### Endpoints — Periods
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/payroll/periods` | Listar periodos |
| POST | `/companies/:cid/payroll/periods` | Crear periodo |
| GET | `/companies/:cid/payroll/periods/:pid` | Detalle |

#### Endpoints — Runs
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/payroll/runs` | Listar corridas |
| POST | `/companies/:cid/payroll/runs` | Crear corrida |
| GET | `/companies/:cid/payroll/runs/:rid` | Detalle |
| POST | `/companies/:cid/payroll/runs/:rid/calculate` | Calcular nomina |
| POST | `/companies/:cid/payroll/runs/:rid/close` | Cerrar corrida (irreversible) |

#### Endpoints — Payslips
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/payroll/runs/:rid/payslips` | Listar recibos |
| GET | `/companies/:cid/payroll/runs/:rid/payslips/:pid` | Detalle recibo |
| PATCH | `/companies/:cid/payroll/runs/:rid/payslips/:pid/lines/:lid` | Editar linea |
| GET | `/companies/:cid/payroll/runs/:rid/payslips/export` | Exportar CSV |
| GET | `/companies/:cid/payroll/runs/:rid/payslips/export-pdf` | Exportar todos PDF |
| GET | `/companies/:cid/payroll/runs/:rid/payslips/:pid/export-pdf` | PDF individual |
| GET | `/companies/:cid/payroll/runs/:rid/payslips/signatures` | Estado de firmas |

#### Frontend Files
- `src/lib/api/payroll.ts`
- `src/lib/types/payroll.ts`
- `src/app/(dashboard)/companies/[companyId]/payroll/page.tsx`
- `src/app/(dashboard)/companies/[companyId]/payroll/runs/[runId]/page.tsx`

---

### 11. My Payslips (Employee Self-Service)
**Status**: Listo
**Rol minimo**: MEMBER (exclusivo)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/my-payslips` | Mis recibos |
| GET | `/companies/:cid/my-payslips/:pid` | Detalle de mi recibo |
| POST | `/companies/:cid/my-payslips/:pid/sign` | Firmar recibo |

#### Frontend Files
- `src/lib/api/payroll.ts` (myPayslips section)
- `src/app/(dashboard)/companies/[companyId]/payroll/my-payslips/page.tsx`

---

### 12. Settlements (Liquidacion)
**Status**: Listo
**Rol minimo**: ADMIN

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/settlement-config` | Config de liquidacion |
| PATCH | `/companies/:cid/settlement-config` | Actualizar config |
| POST | `/companies/:cid/employees/:eid/settlement` | Generar liquidacion |
| GET | `/companies/:cid/employees/:eid/settlement` | Ver liquidacion |

#### Reglas de negocio
- Despido: incluye indemnizacion por preaviso + antiguedad
- Renuncia: solo proporcionales (salario, aguinaldo, vacaciones)
- Al generar: empleado se marca inactivo, contrato se cierra

#### Frontend Files
- `src/lib/api/settlements.ts`
- `src/app/(dashboard)/companies/[companyId]/employees/[employeeId]/page.tsx` (seccion liquidacion)

---

### 13. Convenios (Convenios Colectivos)
**Status**: Listo
**Rol minimo**: MEMBER (ver), ADMIN (CRUD), SUPER_ADMIN (globales)

#### Endpoints — Admin (convenios globales)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/admin/convenios` | Listar convenios globales |
| POST | `/admin/convenios` | Crear convenio global |
| PATCH | `/admin/convenios/:id` | Actualizar convenio global |
| DELETE | `/admin/convenios/:id` | Eliminar convenio global |
| POST | `/admin/convenios/:id/categories` | Agregar categoria a convenio |
| PATCH | `/admin/convenios/categories/:categoryId` | Actualizar categoria |
| DELETE | `/admin/convenios/categories/:categoryId` | Eliminar categoria |

#### Endpoints — Company-scoped
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/convenios` | Listar convenios de la empresa |
| POST | `/companies/:cid/convenios` | Crear convenio de empresa |
| PATCH | `/companies/:cid/convenios/:id` | Actualizar convenio |
| DELETE | `/companies/:cid/convenios/:id` | Eliminar convenio |
| POST | `/companies/:cid/convenios/:id/clone` | Clonar convenio global a la empresa |
| POST | `/companies/:cid/convenios/:id/categories` | Agregar categoria |
| PATCH | `/companies/:cid/convenios/categories/:categoryId` | Actualizar categoria |
| DELETE | `/companies/:cid/convenios/categories/:categoryId` | Eliminar categoria |

#### Reglas de negocio
- Convenios globales son plantillas que se clonan a empresas
- Cada convenio tiene reglas de antiguedad (brackets), vacaciones y licencia
- Las categorias definen escalas salariales dentro del convenio
- Los empleados se asocian a un convenio via su contrato

#### Frontend Files
- `src/lib/api/convenios.ts`
- `src/lib/types/convenio.ts`
- `src/app/(dashboard)/companies/[companyId]/convenios/page.tsx`
- `src/app/(dashboard)/admin/convenios/page.tsx` (panel admin)

---

### 14. Admin Panel (Dashboard, Plans, Subscriptions)
**Status**: Backend listo | Frontend listo
**Rol minimo**: SUPER_ADMIN (CRUD), SUPER_VIEWER (solo lectura)

#### Como detectar si el usuario es SUPER_ADMIN

Al hacer `GET /auth/me`, la respuesta incluye `systemRole`:

```typescript
// Response de GET /auth/me
interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  mustChangePassword: boolean;
  systemRole: 'USER' | 'SUPER_ADMIN' | 'SUPER_VIEWER';  // <-- CLAVE
  locale: string;
  createdAt: Date;
}
```

**Logica de routing en el frontend:**
```
if (systemRole === 'SUPER_ADMIN' || systemRole === 'SUPER_VIEWER')
  → mostrar menu "Admin Panel" en sidebar
  → permitir acceso a /admin/*
else
  → NO mostrar menu admin
  → redirigir a /companies si intenta acceder a /admin/*
```

**SUPER_VIEWER solo puede leer (GET).** El frontend debe:
- Ocultar botones de crear/editar/eliminar si `systemRole === 'SUPER_VIEWER'`
- Los endpoints POST/PATCH/DELETE devuelven 403 para SUPER_VIEWER

#### Endpoints — Dashboard
| Metodo | Ruta | Descripcion | Rol |
|--------|------|-------------|-----|
| GET | `/admin/dashboard` | Metricas globales | SUPER_ADMIN, SUPER_VIEWER |
| GET | `/admin/companies` | Listar empresas (paginado) | SUPER_ADMIN, SUPER_VIEWER |

**Query params de `/admin/companies`:**
- `page` (int, default 1)
- `limit` (int, default 20, max 100)
- `status` (string, filtra por estado de suscripcion)
- `planId` (UUID, filtra por plan)

**Response de `/admin/dashboard`:**
```typescript
interface DashboardMetrics {
  companies: { total: number; active: number; inactive: number };
  employees: { total: number; active: number; inactive: number };
  subscriptions: {
    total: number;
    byStatus: { TRIAL: number; ACTIVE: number; PAST_DUE: number; BLOCKED: number; CANCELLED: number };
    byPlan: Array<{ planCode: string; planName: string; count: number }>;
  };
  revenue: { currentMonth: number; previousMonth: number; growth: number };
  recentPayments: Payment[];      // ultimos 10 pagos
  expiringSoon: Subscription[];   // vencen en < 7 dias
}
```

#### Endpoints — Plans
| Metodo | Ruta | Descripcion | Rol |
|--------|------|-------------|-----|
| GET | `/admin/plans` | Listar planes | SUPER_ADMIN, SUPER_VIEWER |
| GET | `/admin/plans/:id` | Detalle de plan | SUPER_ADMIN, SUPER_VIEWER |
| POST | `/admin/plans` | Crear plan | SUPER_ADMIN |
| PATCH | `/admin/plans/:id` | Actualizar plan | SUPER_ADMIN |
| DELETE | `/admin/plans/:id` | Eliminar plan (solo si no tiene suscripciones) | SUPER_ADMIN |

**Body de POST/PATCH `/admin/plans`:**
```typescript
interface CreatePlanInput {
  code: string;           // unico, ej: 'STARTER'
  name: string;           // ej: 'Plan Starter'
  maxEmployees: number;   // >= 1
  monthlyPrice: number;   // >= 0, 2 decimales
  annualPrice: number;    // >= 0, 2 decimales
  trialDays?: number;     // default 14
  gracePeriodDays?: number; // default 7
  isCustom?: boolean;     // default false
}
```

#### Endpoints — Subscriptions
| Metodo | Ruta | Descripcion | Rol |
|--------|------|-------------|-----|
| GET | `/admin/subscriptions` | Listar suscripciones (paginado) | SUPER_ADMIN, SUPER_VIEWER |
| GET | `/admin/subscriptions/:id` | Detalle con pagos | SUPER_ADMIN, SUPER_VIEWER |
| POST | `/admin/subscriptions` | Crear suscripcion | SUPER_ADMIN |
| PATCH | `/admin/subscriptions/:id` | Actualizar (cambiar plan, status, precio) | SUPER_ADMIN |
| POST | `/admin/subscriptions/:id/payments` | Registrar pago | SUPER_ADMIN |
| GET | `/admin/subscriptions/:id/payments` | Listar pagos | SUPER_ADMIN, SUPER_VIEWER |
| DELETE | `/admin/subscriptions/:id/payments/:paymentId` | Eliminar pago | SUPER_ADMIN |

**Body de POST `/admin/subscriptions`:**
```typescript
interface CreateSubscriptionInput {
  companyId: string;       // UUID de la empresa
  planId: string;          // UUID del plan
  billingCycle?: 'MONTHLY' | 'ANNUAL';  // default MONTHLY
  effectivePrice?: number; // precio negociado (si difiere del plan)
  notes?: string;
}
```

**Body de PATCH `/admin/subscriptions/:id`:**
```typescript
interface UpdateSubscriptionInput {
  planId?: string;
  billingCycle?: 'MONTHLY' | 'ANNUAL';
  status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'BLOCKED' | 'CANCELLED';
  effectivePrice?: number;
  notes?: string;
}
```

**Body de POST `/admin/subscriptions/:id/payments`:**
```typescript
interface CreatePaymentInput {
  amount: number;        // >= 0.01
  periodStart: string;   // ISO date, ej: '2026-03-01'
  periodEnd: string;     // ISO date, ej: '2026-03-31'
  notes?: string;
}
```

#### Estados de suscripcion (importante para UI)

| Estado | Color sugerido | Significado |
|--------|---------------|-------------|
| `TRIAL` | azul | Periodo de prueba (14 dias default) |
| `ACTIVE` | verde | Pago al dia |
| `PAST_DUE` | amarillo | Vencida hace <7 dias, aun funciona |
| `BLOCKED` | rojo | Vencida hace >7 dias, solo lectura |
| `CANCELLED` | gris | Cancelada, sin acceso |

**Transiciones automaticas (el backend las hace solo):**
```
TRIAL/ACTIVE → vence → PAST_DUE (grace period 7 dias)
PAST_DUE → pasan 7 dias → BLOCKED
```

**Transiciones manuales (admin las hace via PATCH):**
```
Cualquier estado → ACTIVE (reactivar)
Cualquier estado → BLOCKED (bloquear)
Cualquier estado → CANCELLED (cancelar)
```

#### Reglas de negocio
- Una empresa tiene maximo UNA suscripcion
- Al registrar un pago, la suscripcion pasa a ACTIVE automaticamente
- Dashboard tiene cache de 60 segundos
- No se puede eliminar un plan que tenga suscripciones vinculadas
- SUPER_VIEWER puede ver todo pero no modificar nada

#### Frontend Files
- `src/lib/api/admin.ts` — funciones fetch para todos los endpoints admin
- `src/lib/types/admin.ts` — interfaces: Plan, Subscription, Payment, DashboardMetrics
- `src/app/(dashboard)/admin/page.tsx` — dashboard con metricas y graficos
- `src/app/(dashboard)/admin/plans/page.tsx` — CRUD de planes
- `src/app/(dashboard)/admin/subscriptions/page.tsx` — lista de suscripciones
- `src/app/(dashboard)/admin/subscriptions/[subscriptionId]/page.tsx` — detalle + pagos
- `src/app/(dashboard)/admin/companies/page.tsx` — lista de empresas con filtros
- `src/components/admin/admin-guard.tsx` — wrapper que verifica systemRole
- `src/components/admin/subscription-badge.tsx` — badge de color segun status

#### Credenciales de prueba (seed)
```
superadmin@nomina.app / Password123!  → SUPER_ADMIN (todo)
viewer@nomina.app / Password123!      → SUPER_VIEWER (solo lectura)
```

---

### 15. Company Subscription (Self-Service)
**Status**: Backend listo | Frontend sin implementar
**Rol minimo**: OWNER, ADMIN

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/subscription` | Ver mi suscripcion (plan, estado, uso) |
| GET | `/companies/:cid/subscription/payments` | Historial de pagos de mi empresa |

#### Reglas de negocio
- Solo lectura: la empresa NO puede cambiar su plan ni pagar desde aca
- Si la suscripcion esta BLOCKED, el backend devuelve header `X-Subscription-Warning: PAST_DUE` o bloquea escrituras
- El frontend debe mostrar un banner de advertencia si el status es PAST_DUE o BLOCKED

#### Frontend Files
- `src/lib/api/companies.ts` (seccion subscription)
- `src/app/(dashboard)/companies/[companyId]/settings/page.tsx` (seccion suscripcion)
- `src/components/subscription-warning-banner.tsx` — banner si PAST_DUE/BLOCKED

---

## Features Futuras (Pendientes de Backend)

<!-- Cuando el backend implemente algo nuevo, agregar aca con el template -->

### Notificaciones
**Status**: Pendiente
**Endpoints esperados**: TBD
**Frontend Files**: TBD

### Auditoria / Logs (viewer)
**Status**: Pendiente
**Nota**: El backend ya registra audit logs internamente (tabla AuditLog). Falta crear endpoints para consultarlos.
**Endpoints esperados**: TBD
**Frontend Files**: TBD

### Documentos
**Status**: Pendiente
**Endpoints esperados**: TBD
**Frontend Files**: TBD
