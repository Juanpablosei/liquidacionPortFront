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
| GET | `/companies` | Listar empresas del usuario. Cada item incluye `myRole`, `isEmployee` (bool), `employeeId` (uuid o null) |
| POST | `/companies` | Crear empresa |
| GET | `/companies/:id` | Detalle de empresa. Incluye `isEmployee` (bool) y `employeeId` (uuid o null) del usuario actual |
| PATCH | `/companies/:id` | Actualizar empresa |

#### Cambio importante (2026-03-18): Employee Context
Los endpoints `GET /companies` y `GET /companies/:id` ahora incluyen:
- `isEmployee: boolean` — si el usuario actual tiene un Employee vinculado en esa empresa
- `employeeId: string | null` — el UUID del Employee vinculado, o null

**Uso en el frontend:** si `isEmployee === true`, mostrar "Mis Recibos" en el sidebar independientemente del rol del usuario. Esto permite que un ADMIN que tambien es empleado pueda ver y firmar sus recibos.

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
| GET | `/companies/:cid/attendance/import/template` | Descargar plantilla Excel para importacion |
| POST | `/companies/:cid/attendance/import` | Importar asistencia desde Excel (multipart, campo `file`) |

#### Reglas de negocio (importacion)
- Columnas requeridas: `documentNumber`, `date`. Opcionales: `clockIn` (HH:mm), `clockOut` (HH:mm), `notes`
- Empleado no encontrado o inactivo → se skipea (no falla toda la importacion)
- Fecha en periodo de nomina cerrado → se skipea
- Registro duplicado (empleado+fecha) → se skipea
- Errores de formato (fecha/hora invalida) → se rechaza todo el archivo con detalle de errores
- Max 2000 filas por importacion
- Response: `{ imported, skipped, errors[], skippedRecords[] }`

#### Frontend Files
- `src/lib/api/attendance.ts`
- `src/lib/types/attendance.ts`
- `src/app/(dashboard)/companies/[companyId]/attendance/page.tsx`
- `src/app/(dashboard)/companies/[companyId]/attendance/import/page.tsx`

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
| POST | `/companies/:cid/payroll/runs/:rid/calculate` | **Async**: encola cálculo en BullMQ → responde 202 con `{ jobId, status: 'QUEUED' }` |
| GET | `/companies/:cid/payroll/runs/:rid/job-status` | Polling del estado del job: `waiting \| active \| completed \| failed` |
| POST | `/companies/:cid/payroll/runs/:rid/close` | Cerrar corrida (irreversible) |

> **Cambio importante (async):** `POST /calculate` ya no bloquea hasta que termina. Responde de inmediato con 202. El frontend debe hacer polling a `/job-status` para saber cuándo terminó. Ver Notas más abajo.

#### Endpoints — Payslips (Cross-Run)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/payroll/payslips` | Listar recibos cross-run (filtros: employeeId, fromDate, toDate). Solo COMPLETED/CLOSED. |

> Incluye info del run y periodo en cada item. Filtros por `fromDate`/`toDate` aplican sobre `period.startDate`.

#### Endpoints — Payslips (por Run)
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

#### Notas — Cálculo async (BullMQ)

El cálculo de nómina es asíncrono via Redis/BullMQ. El flujo recomendado para el frontend:

1. Llamar `POST /calculate` → guardar el `jobId` de la respuesta 202
2. Iniciar polling a `GET /job-status` cada 2-3 segundos
3. Mostrar un indicador de progreso/spinner mientras `status` sea `waiting` o `active`
4. Cuando `status = completed` → recargar el detalle del run y mostrar los payslips
5. Cuando `status = failed` → mostrar `failedReason` como mensaje de error al usuario
6. Detener el polling al llegar a `completed` o `failed`

**Response de `/job-status`:**
```typescript
interface JobStatusResponse {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;       // 0-100 (reservado, siempre 0 por ahora)
  failedReason: string | null;
}
```

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
- POST crear convenio acepta `categories?: CreateCategoryDto[]` opcional para crear categorias inline (atomico). Los codes de categoria deben ser unicos dentro del array

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

### 15. Audit Logs
**Status**: Listo
**Rol minimo**: OWNER / ADMIN (empresa) | SUPER_ADMIN / SUPER_VIEWER (admin)

#### Endpoints
| Metodo | Ruta | Body | Response |
|--------|------|------|----------|
| GET | `/companies/:cid/audit-logs` | — | PaginatedResponse\<AuditLog\> |
| GET | `/admin/audit-logs` | — | PaginatedResponse\<AuditLog\> |

#### Query params
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `page` | number | Pagina (default: 1) |
| `limit` | number | Items por pagina (default: 20, max: 100) |
| `action` | string | Filtrar por accion (e.g. `ROLE_CHANGE`, `EMPLOYEE_TERMINATE`) |
| `entity` | string | Filtrar por entidad (e.g. `Employee`, `CompanyUser`) |
| `userId` | UUID | Filtrar por usuario que realizo la accion |
| `fromDate` | date | Fecha desde (inclusive) |
| `toDate` | date | Fecha hasta (inclusive) |

#### Reglas de negocio
- El endpoint company-scoped solo devuelve logs de esa empresa
- El endpoint admin devuelve logs de todas las empresas
- Cada log incluye: id, userId, companyId, action, entity, entityId, details (JSON), ip, userAgent, createdAt
- Los logs se generan automaticamente al ejecutar acciones sensibles (cambio de rol, baja de empleado, liquidacion, payroll, etc.)

#### Frontend Files
- `src/lib/types/audit-log.ts`
- `src/lib/api/audit-logs.ts`
- `src/app/(dashboard)/companies/[companyId]/audit-logs/page.tsx`

---

---

### 16. Sindicatos (Unions)
**Status**: Backend listo | Frontend pendiente
**Rol minimo**: MEMBER (ver), OWNER/ADMIN (CRUD)

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/unions/dashboard` | Dashboard: totales, costos, distribución por sindicato |
| GET | `/companies/:cid/unions` | Listar sindicatos (paginado, filtros: search, isActive) |
| GET | `/companies/:cid/unions/:id` | Detalle con conteo de miembros activos |
| POST | `/companies/:cid/unions` | Crear sindicato |
| PATCH | `/companies/:cid/unions/:id` | Editar sindicato |
| DELETE | `/companies/:cid/unions/:id` | Soft delete (isActive=false) |
| GET | `/companies/:cid/unions/:id/members` | Listar afiliados (paginado, filtro: activeOnly) |
| POST | `/companies/:cid/unions/:id/members` | Afiliar empleado |
| PATCH | `/companies/:cid/unions/:id/members/:mid` | Desafiliar miembro (setear endDate) |

#### Reglas de negocio
- Las cuotas se descuentan automáticamente en cada liquidación
- `PERCENTAGE`: `básico × duesValue / 100`; `FIXED_AMOUNT`: monto fijo
- El `conceptCode` en el payslip tiene formato `CUOTA_SINDICAL_{union.code}`
- Un empleado puede estar afiliado a más de un sindicato simultáneamente
- Soft delete de sindicato previene descuentos futuros pero conserva historial

#### Frontend Files sugeridos
- `src/lib/api/unions.ts`
- `src/lib/types/union.ts`
- `src/app/(dashboard)/companies/[companyId]/unions/page.tsx`
- `src/app/(dashboard)/companies/[companyId]/unions/[unionId]/page.tsx`
- `src/app/(dashboard)/companies/[companyId]/unions/[unionId]/members/page.tsx`

---

### 17. Convenios — Subida con IA
**Status**: Backend listo | Frontend pendiente
**Rol minimo**: OWNER/ADMIN

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/companies/:cid/convenios/upload` | Subir PDF → extracción con IA → devuelve items (no crea convenio) |
| POST | `/companies/:cid/convenios/confirm-upload` | Confirmar items revisados → crea convenio definitivo |
| DELETE | `/companies/:cid/convenios/uploaded-file/:filename` | Borrar PDF si el contador cancela |

#### Flujo
1. Usuario sube PDF → el servidor llama a Claude API → devuelve datos extraídos con `confidence` (0-1)
2. Contador revisa/edita los datos en el frontend
3. Contador aprueba → se llama confirm-upload → convenio creado
4. Si cancela → DELETE para limpiar el PDF del servidor

#### Reglas de negocio
- `confidence < 0.7`: mostrar advertencia de baja confianza en la extracción
- `sourceFile` retornado por el upload debe enviarse exactamente igual en confirm-upload
- El convenio se crea con `status: ACTIVE` y los campos `validFrom`/`validTo` opcionales
- `rawNotes`: mostrar en sección colapsable con observaciones adicionales de la IA

#### Frontend Files sugeridos
- `src/lib/api/convenios.ts` (agregar uploadConvenio, confirmUpload, deleteUploadedFile)
- `src/app/(dashboard)/companies/[companyId]/convenios/upload/page.tsx`

---

### 18. Convenios — Alertas de Vencimiento
**Status**: Backend listo | Frontend pendiente
**Rol minimo**: OWNER/ADMIN

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/convenios/expiring` | Convenios que vencen en los próximos 30 días |
| GET | `/companies/:cid/convenios?includeExpired=true` | Listado incluyendo convenios EXPIRED |

#### Reglas de negocio
- Cron automático (8 AM diario) envía emails a OWNER/ADMIN en ventanas de 30, 15 y 7 días antes del vencimiento
- `daysRemaining` viene calculado en cada item del endpoint `/expiring`
- Convenios con `validTo < hoy` se marcan automáticamente `EXPIRED`
- El listado general solo devuelve `ACTIVE` por defecto (usar `?includeExpired=true` para ver todos)

#### Frontend Files sugeridos
- `src/lib/api/convenios.ts` (agregar getExpiringConvenios)
- `src/app/(dashboard)/companies/[companyId]/convenios/page.tsx` (panel de alertas de vencimiento)

---

### 19. Conceptos — Fórmulas Personalizadas (FORMULA)
**Status**: Backend listo | Frontend pendiente
**Rol minimo**: OWNER/ADMIN

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/companies/:cid/concepts/validate-formula` | Validar y previsualizar una fórmula antes de guardarla |
| POST | `/companies/:cid/concepts` (con `calcType: 'FORMULA'`) | Crear concepto tipo fórmula |
| PATCH | `/companies/:cid/concepts/:id` | Editar fórmula de un concepto |

#### Variables disponibles
`BASICO`, `BRUTO`, `HORAS_TRABAJADAS`, `VALOR_HORA`, `ANTIGUEDAD_ANOS`, `DIAS_TRABAJADOS`, `PRESENTISMO`, `HORAS_EXTRA_50`, `HORAS_EXTRA_100`

#### Reglas de negocio
- El endpoint `validate-formula` siempre devuelve HTTP 200; la validez se determina por el campo `valid` del body
- Si `valid: true`, el campo `preview` contiene el resultado con valores de prueba
- Si `valid: false`, el campo `error` describe el problema (variable no permitida, sintaxis inválida, etc.)
- Fórmulas vacías o con variables fuera de whitelist son rechazadas al guardar el concepto
- Máximo 500 caracteres por fórmula

#### Frontend Files sugeridos
- `src/lib/api/concepts.ts` (agregar validateFormula)
- `src/app/(dashboard)/companies/[companyId]/concepts/page.tsx` (editor de fórmulas con preview en tiempo real)
- `src/components/concepts/formula-editor.tsx`

---

### 20. Auditoría Global (AuditInterceptor)
**Status**: Backend listo | Frontend sin cambios requeridos
**Rol minimo**: OWNER/ADMIN (empresa), SUPER_ADMIN/SUPER_VIEWER (admin)

#### Endpoints (sin cambios)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/companies/:cid/audit-logs` | Logs de la empresa (paginado) |
| GET | `/admin/audit-logs` | Logs de todas las empresas (paginado) |

#### Cambio importante en backend
Antes solo 9 endpoints generaban logs. Ahora el `AuditInterceptor` global registra **todas** las mutaciones automáticamente (POST, PATCH, PUT, DELETE). Los logs ahora cubren:
- Sindicatos (unions)
- Afiliaciones (memberships)
- Convenios (subida, confirmación, categorías)
- Conceptos (incluyendo fórmulas)
- Liquidaciones, nómina, empleados, miembros (ampliado)

El visor de logs del frontend puede mostrar las nuevas entidades: `unions`, `convenios`, `concepts`, `members`.

#### Nuevas entidades disponibles como filtro `entity`
`unions`, `convenio-categories`, `concepts`, `attendance`, `overtime`, `holidays`

---

### 21. Redis / BullMQ — Infraestructura async
**Status**: Backend listo | Frontend requiere cambios en Payroll
**Rol minimo**: N/A (infraestructura)

#### Cambios que impactan al frontend

| Area | Cambio | Accion requerida |
|------|--------|-----------------|
| Nómina: calcular | `POST /calculate` ahora devuelve 202 en lugar de 200 | Implementar polling con `/job-status` |
| Nómina: estado | Nuevo endpoint `GET /job-status` | Ver sección 10 (Payroll) para el flujo completo |
| Health check | `GET /health` ahora incluye `redis: { status: 'up' \| 'down' }` | Opcional: mostrar en panel de estado |

#### Comportamiento si Redis no está disponible

Si el backend no tiene Redis configurado o Redis cae:
- `POST /calculate` devuelve **503 Service Unavailable** (en lugar de 202)
- El frontend debe manejar el 503 y mostrar un mensaje: "El servicio de cálculo no está disponible temporalmente. Intentá de nuevo en unos minutos."

#### Frontend Files a modificar
- `src/lib/api/payroll.ts` — actualizar `calculatePayroll` para manejar 202 + agregar `getJobStatus`
- `src/lib/types/payroll.ts` — agregar `JobStatusResponse`
- `src/app/(dashboard)/companies/[companyId]/payroll/runs/[runId]/page.tsx` — implementar polling con indicador de progreso

---

### 21. Backups (Admin Panel)
**Status**: Backend listo | Frontend pendiente
**Rol minimo**: SUPER_ADMIN

#### Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/admin/backups` | Listar todos los backups en S3 |
| POST | `/admin/backups` | Crear backup manual |

#### Reglas de negocio
- Solo SUPER_ADMIN puede crear backups manuales (SUPER_VIEWER solo lectura)
- Backups automáticos: semanales (domingo 3AM) + mensuales (1ro de cada mes 3AM)
- Response de GET: array de `{ filename, size, lastModified }`
- Response de POST: `{ filename, size }`

#### Frontend Files sugeridos
- `src/lib/api/admin.ts` (agregar listBackups, createManualBackup)
- `src/lib/types/admin.ts` (agregar BackupFile interface)
- `src/app/(dashboard)/admin/backups/page.tsx`

---

### 22. Planes y Suscripciones — Selección de Plan + Comprobantes de Pago
**Status**: Backend listo | Frontend pendiente
**Rol minimo**: Autenticado (planes), OWNER/ADMIN (comprobantes)

#### Cambios en endpoints existentes

| Metodo | Ruta | Cambio |
|--------|------|--------|
| POST | `/companies` | Ahora acepta `planCode` opcional (default: `FREE`). Retorna `subscriptionStatus` y `planCode` |

#### Endpoints nuevos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/plans` | Listar planes activos con limites y features (autenticado, no admin) |

#### Nuevo estado: `PENDING_PAYMENT`
Cuando el usuario elige un plan pago al crear empresa, la suscripcion queda en `PENDING_PAYMENT`:
- Bloquea todo excepto: ver empresa (`GET /companies/:cid`), ver suscripcion (`GET /subscription`), subir comprobante (`POST /subscription/payment-proof`)
- El admin aprueba → pasa a `ACTIVE`
- El admin rechaza → el usuario puede reintentar

#### Planes disponibles

| Plan | Max empleados | Max empresas | Max miembros | Runs/mes | Export | Sindicatos | Formulas | IA Upload | Precio mensual |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| FREE | 10 | 1 | 1 | 2 | ❌ | ❌ | ❌ | ❌ | $0 |
| STARTER | 50 | 3 | 5 | ∞ | ✅ | ✅ | ✅ | ❌ | $15,000 |
| PRO | 100 | 10 | 15 | ∞ | ✅ | ✅ | ✅ | ✅ | $35,000 |
| ENTERPRISE | 500 | ∞ | ∞ | ∞ | ✅ | ✅ | ✅ | ✅ | $75,000 |

#### Reglas de negocio
- Al crear empresa sin `planCode` → se asigna FREE con status ACTIVE (sin vencimiento)
- Al crear empresa con plan pago → se asigna con status PENDING_PAYMENT
- `0` en limites numericos = ilimitado
- Feature flags: `featureExportPdf`, `featureUnions`, `featureFormulas`, `featureAiUpload`
- Validacion de `maxCompanies` al crear empresa (cuenta empresas donde el user es OWNER)

#### Frontend Files sugeridos
- `src/lib/api/plans.ts` — `getPlans()`
- `src/lib/types/plan.ts` — `SubscriptionPlan` con limites y features
- `src/app/(dashboard)/companies/new/page.tsx` — refactorizar: paso 1 datos + paso 2 elegir plan

---

### 23. Comprobantes de Pago (Payment Proofs)
**Status**: Backend listo | Frontend pendiente
**Rol minimo**: OWNER/ADMIN (empresa), SUPER_ADMIN/SUPER_VIEWER (admin)

#### Endpoints — Usuario (empresa)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/companies/:cid/subscription/payment-proof` | Subir comprobante (multipart, campo `file`, max 5MB, JPG/PNG/WebP/PDF) |
| GET | `/companies/:cid/subscription/payment-proof` | Listar mis comprobantes (historial con status) |

#### Endpoints — Admin
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/admin/payment-proofs` | Listar todos los comprobantes (paginado, filtro `?status=PENDING`) |
| GET | `/admin/payment-proofs/:id` | Detalle del comprobante con info de empresa y plan |
| GET | `/admin/payment-proofs/:id/file` | Descargar/ver el archivo del comprobante |
| POST | `/admin/payment-proofs/:id/approve` | Aprobar → suscripcion pasa a ACTIVE (o TRIAL si plan tiene trialDays) |
| POST | `/admin/payment-proofs/:id/reject` | Rechazar con razon `{reason}` → email al usuario |

#### Reglas de negocio
- Solo se puede subir comprobante si la suscripcion esta en `PENDING_PAYMENT`
- No se puede subir si ya hay un comprobante `PENDING` (debe esperar revision)
- Al aprobar: suscripcion → ACTIVE/TRIAL, se setean currentPeriodStart/End
- Al rechazar: suscripcion sigue en PENDING_PAYMENT, usuario puede subir otro
- Emails automaticos: al subir (notifica admins), al aprobar (notifica owner), al rechazar (notifica owner con razon)
- Archivos se guardan en filesystem local: `uploads/payment-proofs/{companyId}/`

#### Estados del comprobante (PaymentProofStatus)
| Estado | Significado |
|--------|------------|
| `PENDING` | Esperando revision del admin |
| `APPROVED` | Aprobado, suscripcion activada |
| `REJECTED` | Rechazado con razon |

#### Frontend Files sugeridos
- `src/lib/api/payment-proofs.ts`
- `src/lib/types/payment-proof.ts`
- `src/app/(dashboard)/companies/[companyId]/subscription/payment-proof/page.tsx`
- `src/app/(dashboard)/admin/payment-proofs/page.tsx`
- `src/app/(dashboard)/admin/payment-proofs/[proofId]/page.tsx`

---

## Features Futuras (Pendientes de Backend)

<!-- Cuando el backend implemente algo nuevo, agregar aca con el template -->

### Notificaciones
**Status**: Pendiente
**Endpoints esperados**: TBD
**Frontend Files**: TBD


### Documentos
**Status**: Pendiente
**Endpoints esperados**: TBD
**Frontend Files**: TBD
