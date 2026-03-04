# Guia de Integracion Frontend - API de Nomina

## Configuracion Base

| Parametro | Valor |
|-----------|-------|
| **Base URL** | `http://localhost:3000/api/v1` |
| **Content-Type** | `application/json` |
| **Body Size Limit** | `10 KB` |
| **Autenticacion** | Bearer JWT en header `Authorization` |
| **Refresh Token** | Cookie HttpOnly `refresh_token` (automatica) |

---

## Headers Requeridos

```
Content-Type: application/json
Authorization: Bearer <accessToken>       // en rutas protegidas
X-Requested-With: XMLHttpRequest          // en POST, PUT, PATCH, DELETE (CSRF)
```

> **Importante:** Todas las peticiones mutantes (POST/PUT/PATCH/DELETE) a rutas protegidas deben incluir el header `X-Requested-With`. Sin este header, el servidor responde `403 Forbidden`.

---

## Formato de Respuestas

### Respuesta Exitosa (2xx)

```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "timestamp": "2025-03-02T12:00:00.000Z"
}
```

### Respuesta Paginada

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "message": "OK",
  "timestamp": "2025-03-02T12:00:00.000Z"
}
```

### Respuesta de Error (4xx/5xx)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Mensaje descriptivo del error",
  "error": "Bad Request",
  "timestamp": "2025-03-02T12:00:00.000Z",
  "path": "/api/v1/companies"
}
```

### Codigos de Estado Comunes

| Codigo | Significado |
|--------|-------------|
| `200` | OK |
| `201` | Recurso creado |
| `202` | Aceptado (envio de emails) |
| `204` | Sin contenido (DELETE, logout) |
| `400` | Datos invalidos / violacion de regla de negocio |
| `401` | No autenticado / credenciales invalidas |
| `403` | Sin permisos / falta CSRF header |
| `404` | Recurso no encontrado |
| `409` | Conflicto (email duplicado, run en progreso) |
| `429` | Rate limit excedido |

---

## Enums

```typescript
// Roles de empresa
type CompanyRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

// Tipo de salario
type SalaryType = 'MONTHLY' | 'HOURLY';

// Tipo de hora extra
type OvertimeType = 'OT_50' | 'OT_100';

// Tipo de calculo de concepto
type ConceptCalcType = 'FIXED' | 'PERCENT' | 'HOURLY' | 'MANUAL';

// Categoria de concepto
type ConceptCategory = 'EARNING' | 'DEDUCTION';

// Base para calculo porcentual
type PercentBase = 'BASIC' | 'GROSS';

// Tipo de periodo de nomina
type PayrollPeriodType = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'CUSTOM';

// Estado del run de nomina
type PayrollRunStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'CLOSED';
```

---

## Permisos por Rol

| Accion | OWNER | ADMIN | MANAGER | MEMBER |
|--------|:-----:|:-----:|:-------:|:------:|
| Ver empresa | x | x | x | x |
| Editar empresa | x | x | | |
| Gestionar miembros | x | x | | |
| Transferir ownership | x | | | |
| CRUD empleados | x | x | | |
| Ver empleados | x | x | x | |
| Terminar empleados | x | x | | |
| CRUD contratos | x | x | | |
| Ver contratos | x | x | x* | |
| CRUD asistencia | x | x | x | |
| Eliminar asistencia | x | x | | |
| CRUD horas extra | x | x | x | |
| Eliminar horas extra | x | x | | |
| Ver feriados | x | x | x | x |
| CRUD feriados | x | x | | |
| CRUD conceptos | x | x | | |
| Ver conceptos | x | x | x | |
| Crear periodos | x | x | | |
| Ver periodos/runs | x | x | x | |
| Ejecutar nomina | x | x | | |
| Editar lineas payslip | x | x | | |
| Exportar CSV | x | x | x | |

> *MANAGER no puede ver `salaryAmount` en contratos.

---

## Endpoints

### Health Check

```
GET /health
```

Publico, sin envelope. Responde `{ status: "ok", timestamp: "..." }`.

---

### Auth

Todos los endpoints auth usan prefijo `/auth`. Las rutas publicas no requieren JWT.

#### Registro

```
POST /auth/register                       [Publico] [10 req/min]
```

```json
// Request Body
{
  "email": "usuario@email.com",           // requerido, formato email
  "password": "MiPass123",               // requerido, min 8, 1 mayuscula, 1 minuscula, 1 numero
  "name": "Juan Perez"                   // opcional, min 2, max 100
}

// Response 201 - data:
{
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 900                        // 15 minutos en segundos
}
// + Cookie HttpOnly: refresh_token (7 dias)
```

#### Login

```
POST /auth/login                          [Publico] [5 req/min]
```

```json
// Request Body
{
  "email": "usuario@email.com",
  "password": "MiPass123"
}

// Response 200 - data:
{
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 900
}
// + Cookie HttpOnly: refresh_token
```

**Errores:** `401` credenciales invalidas o email no confirmado.

#### Refresh Token

```
POST /auth/refresh                        [Publico] [10 req/min]
```

```json
// Request Body (opcional si la cookie existe)
{
  "refreshToken": "abc123..."             // opcional, se lee de cookie automaticamente
}

// Response 200 - data:
{
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 900
}
// + Nueva cookie refresh_token (rotacion)
```

> **Deteccion de robo:** Si un refresh token ya revocado se reutiliza, TODAS las sesiones del usuario se invalidan por seguridad.

#### Enviar Email de Confirmacion

```
POST /auth/send-confirmation-email        [Publico] [3 req/hora]
```

```json
{ "email": "usuario@email.com" }
// Response 202 - { message: "Si el email esta registrado..." }
```

#### Confirmar Email

```
POST /auth/confirm-email                  [Publico]
```

```json
{ "token": "abc123..." }
// Response 200 - { message: "Email confirmado exitosamente." }
```

#### Forgot Password

```
POST /auth/forgot-password                [Publico] [3 req/hora]
```

```json
{ "email": "usuario@email.com" }
// Response 202 - { message: "Si el email existe..." }
```

#### Reset Password

```
POST /auth/reset-password                 [Publico]
```

```json
{
  "token": "abc123...",
  "newPassword": "NuevoPass456"           // mismas reglas que registro
}
// Response 200 - { message: "Contrasena restablecida exitosamente." }
```

#### Logout

```
POST /auth/logout                         [JWT]
```

```json
{ "refreshToken": "abc123..." }           // opcional, se lee de cookie
// Response 204 (sin body)
// Limpia cookie refresh_token
```

#### Logout All (Cerrar todas las sesiones)

```
POST /auth/logout-all                     [JWT]
// Response 204
```

#### Cambiar Contrasena

```
POST /auth/change-password                [JWT]
```

```json
{
  "currentPassword": "MiPassActual",
  "newPassword": "MiPassNuevo123"         // debe ser diferente a la actual
}
// Response 204
// Revoca TODAS las sesiones
```

#### Mi Perfil

```
GET /auth/me                              [JWT]
```

```json
// Response 200 - data:
{
  "id": "uuid",
  "email": "usuario@email.com",
  "name": "Juan Perez",
  "isActive": true,
  "emailVerifiedAt": "2025-01-15T...",
  "createdAt": "2025-01-01T..."
}
```

#### Sesiones Activas

```
GET /auth/sessions                        [JWT]
```

```json
// Response 200 - data:
[
  {
    "id": "session-uuid",
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1",
    "createdAt": "2025-03-01T...",
    "expiresAt": "2025-03-08T..."
  }
]
```

#### Revocar Sesion

```
DELETE /auth/sessions/:sessionId          [JWT]
// Response 204
```

---

### Companies

Prefijo: `/companies`

#### Crear Empresa

```
POST /companies                           [JWT]
```

```json
// Request Body
{
  "name": "Mi Empresa SRL",              // requerido, max 255
  "taxId": "80012345-6",                 // opcional, max 50
  "address": "Av. Principal 123",        // opcional, max 500
  "phone": "+595 21 123456"              // opcional, max 50
}

// Response 201 - data: Company object
// El creador queda como OWNER automaticamente
```

#### Listar Mis Empresas

```
GET /companies                            [JWT]
```

**Query Params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina (min 1) |
| `limit` | number | 20 | Items por pagina (1-100) |

```json
// Response 200 - data: { items, total, page, limit, pages }
```

#### Ver Empresa

```
GET /companies/:companyId                 [JWT + Miembro]
// Response 200 - data: Company
```

#### Editar Empresa

```
PATCH /companies/:companyId               [JWT + OWNER/ADMIN]
```

```json
{ "name": "Nuevo Nombre" }               // todos los campos opcionales
// Response 200 - data: Company actualizada
```

#### Listar Miembros

```
GET /companies/:companyId/members         [JWT + OWNER/ADMIN]
```

**Query Params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina (min 1) |
| `limit` | number | 20 | Items por pagina (1-100) |

```json
// Response 200 - data: { items, total, page, limit, pages }
// Cada item:
{
  "id": "membership-uuid",
  "userId": "user-uuid",
  "name": "Juan Perez",
  "email": "juan@email.com",
  "role": "ADMIN",
  "joinedAt": "2025-01-01T...",
  "invitedBy": "owner-uuid"
}
```

#### Agregar Miembro

```
POST /companies/:companyId/members        [JWT + OWNER/ADMIN]
```

```json
{
  "userId": "user-uuid",                  // UUID del usuario registrado
  "role": "MANAGER"                       // ADMIN | MANAGER | MEMBER (no OWNER)
}
// Response 201 - data: CompanyUser
```

#### Cambiar Rol de Miembro

```
PATCH /companies/:companyId/members/:userId  [JWT + OWNER/ADMIN]
```

```json
{ "role": "ADMIN" }                       // ADMIN | MANAGER | MEMBER
// Response 200 - data: CompanyUser actualizado
```

> ADMIN no puede cambiar el rol del OWNER.

#### Quitar Miembro

```
DELETE /companies/:companyId/members/:userId  [JWT + OWNER/ADMIN]
// Response 204
```

#### Dejar Empresa (yo mismo)

```
DELETE /companies/:companyId/members/me   [JWT + Miembro]
// Response 204
```

> OWNER no puede dejar la empresa sin transferir ownership primero.

#### Transferir Ownership

```
POST /companies/:companyId/transfer-ownership  [JWT + OWNER]
```

```json
{ "newOwnerUserId": "user-uuid" }
// Response 200 - data: Company
// El OWNER actual pasa a ADMIN
```

---

### Employees

Prefijo: `/companies/:companyId/employees`

#### Listar Empleados

```
GET /companies/:companyId/employees       [JWT + OWNER/ADMIN/MANAGER]
```

**Query Params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina (min 1) |
| `limit` | number | 20 | Items por pagina (1-100) |
| `search` | string | - | Busca en nombre, apellido, nro documento (max 255) |
| `isActive` | boolean | - | Filtrar activos/terminados |

```json
// Response 200 - data: { items, total, page, limit, pages }
```

#### Crear Empleado

```
POST /companies/:companyId/employees      [JWT + OWNER/ADMIN]
```

```json
{
  "firstName": "Maria",                   // requerido
  "lastName": "Garcia",                   // requerido
  "documentType": "CI",                  // requerido
  "documentNumber": "4567890",           // requerido, unico por empresa
  "email": "maria@email.com",            // opcional, formato email
  "phone": "+595 981 123456",            // opcional
  "birthDate": "1990-05-15",             // opcional, ISO date
  "hireDate": "2025-01-01"               // requerido, ISO date
}
// Response 201 - data: Employee
```

#### Ver Empleado

```
GET /companies/:companyId/employees/:id   [JWT + OWNER/ADMIN/MANAGER]
// Response 200 - data: Employee
```

#### Editar Empleado

```
PATCH /companies/:companyId/employees/:id [JWT + OWNER/ADMIN]
```

```json
{ "phone": "+595 981 999888" }            // todos los campos opcionales
// Response 200 - data: Employee actualizado
```

#### Dar de Baja (Soft Delete)

```
POST /companies/:companyId/employees/:id/terminate  [JWT + OWNER/ADMIN]
```

```json
{ "terminationDate": "2025-03-01" }       // requerido, ISO date
// Response 200 - data: Employee (isActive=false)
```

---

### Contracts

Prefijo: `/companies/:companyId/employees/:employeeId/contracts`

#### Listar Contratos

```
GET .../contracts                         [JWT + OWNER/ADMIN/MANAGER]
// Response 200 - data: Contract[]
```

> MANAGER no recibe `salaryAmount`.

#### Crear Contrato

```
POST .../contracts                        [JWT + OWNER/ADMIN]
```

```json
{
  "startDate": "2025-01-01",             // requerido
  "endDate": "2025-12-31",              // opcional (null = indefinido)
  "salaryType": "MONTHLY",              // MONTHLY | HOURLY
  "salaryAmount": 3500000.00            // requerido, positivo, max 99999999999.99
}
// Response 201 - data: Contract
```

> Valida que no haya solapamiento de fechas con otros contratos del mismo empleado.

#### Editar Contrato

```
PATCH .../contracts/:contractId           [JWT + OWNER/ADMIN]
// Response 200 - data: Contract actualizado
```

#### Ver Horario Semanal

```
GET .../contracts/:contractId/schedule    [JWT + OWNER/ADMIN/MANAGER]
```

```json
// Response 200 - data:
[
  { "weekday": 1, "startTime": "08:00", "endTime": "17:00", "breakMinutes": 60 },
  { "weekday": 2, "startTime": "08:00", "endTime": "17:00", "breakMinutes": 60 }
]
```

> `weekday`: 0=Domingo, 1=Lunes, ..., 6=Sabado

#### Establecer Horario Semanal

```
PUT .../contracts/:contractId/schedule    [JWT + OWNER/ADMIN]
```

```json
{
  "entries": [
    { "weekday": 1, "startTime": "08:00", "endTime": "17:00", "breakMinutes": 60 },
    { "weekday": 2, "startTime": "08:00", "endTime": "17:00", "breakMinutes": 60 },
    { "weekday": 3, "startTime": "08:00", "endTime": "17:00", "breakMinutes": 60 },
    { "weekday": 4, "startTime": "08:00", "endTime": "17:00", "breakMinutes": 60 },
    { "weekday": 5, "startTime": "08:00", "endTime": "12:00", "breakMinutes": 0 }
  ]
}
// Response 200 - Reemplaza el horario completo
```

---

### Attendance

Prefijo: `/companies/:companyId/attendance`

#### Listar Asistencia

```
GET /companies/:companyId/attendance      [JWT + OWNER/ADMIN/MANAGER]
```

**Query Params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina |
| `limit` | number | 20 | Items (1-100) |
| `employeeId` | UUID | - | Filtrar por empleado |
| `fromDate` | ISO date | - | Desde (inclusive) |
| `toDate` | ISO date | - | Hasta (inclusive) |

> **Nota:** Solo se pueden registrar asistencias para empleados activos. Si el empleado esta dado de baja, el servidor responde `400 Bad Request`.

#### Registrar Asistencia

```
POST /companies/:companyId/attendance     [JWT + OWNER/ADMIN/MANAGER]
```

```json
{
  "employeeId": "emp-uuid",              // requerido
  "date": "2025-03-01",                  // requerido, unico por empleado/fecha
  "clockIn": "08:00",                    // opcional, formato HH:mm
  "clockOut": "17:00",                   // opcional, formato HH:mm
  "workedMinutes": 480,                  // opcional, max 1440
  "notes": "Llego tarde"                 // opcional, max 500 caracteres
}
// Response 201
```

#### Editar Asistencia

```
PATCH /companies/:companyId/attendance/:id  [JWT + OWNER/ADMIN/MANAGER]
```

```json
{ "workedMinutes": 500, "notes": "Corregido" }  // notes max 500 caracteres
// Response 200 (no permite cambiar employeeId ni date)
```

#### Eliminar Asistencia

```
DELETE /companies/:companyId/attendance/:id  [JWT + OWNER/ADMIN]
// Response 204
```

---

### Overtime

Prefijo: `/companies/:companyId/overtime`

#### Listar Horas Extra

```
GET /companies/:companyId/overtime        [JWT + OWNER/ADMIN/MANAGER]
```

**Query Params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina |
| `limit` | number | 20 | Items (1-100) |
| `employeeId` | UUID | - | Filtrar por empleado |
| `fromDate` | ISO date | - | Desde (inclusive) |
| `toDate` | ISO date | - | Hasta (inclusive) |
| `type` | OvertimeType | - | OT_50 o OT_100 |

> **Nota:** Solo se pueden registrar horas extra para empleados activos. Si el empleado esta dado de baja, el servidor responde `400 Bad Request`.

#### Registrar Hora Extra

```
POST /companies/:companyId/overtime       [JWT + OWNER/ADMIN/MANAGER]
```

```json
{
  "employeeId": "emp-uuid",              // requerido
  "date": "2025-03-01",                  // requerido
  "overtimeType": "OT_50",              // OT_50 (50%) | OT_100 (100%)
  "minutes": 120,                        // requerido, min 1, max 720
  "notes": "Cierre de mes"              // opcional, max 500 caracteres
}
// Response 201
```

> Unico por empleado + fecha + tipo.

#### Editar Hora Extra

```
PATCH /companies/:companyId/overtime/:id  [JWT + OWNER/ADMIN/MANAGER]
```

```json
{ "minutes": 90 }                         // no permite cambiar employeeId, date, overtimeType
// Response 200
```

#### Eliminar Hora Extra

```
DELETE /companies/:companyId/overtime/:id  [JWT + OWNER/ADMIN]
// Response 204
```

---

### Holidays

Prefijo: `/companies/:companyId/holidays`

#### Listar Feriados

```
GET /companies/:companyId/holidays        [JWT + Miembro]
```

**Query Params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina |
| `limit` | number | 20 | Items (1-100) |
| `year` | number | - | Filtrar por ano (2000-2100) |
| `fromDate` | ISO date | - | Desde |
| `toDate` | ISO date | - | Hasta |

#### Crear Feriado

```
POST /companies/:companyId/holidays       [JWT + OWNER/ADMIN]
```

```json
{
  "date": "2025-05-01",                  // requerido, unico por empresa
  "name": "Dia del Trabajador",          // requerido, min 1
  "isOptional": false                    // opcional, default false
}
// Response 201
```

> `isOptional: true` = feriado opcional (no se descuenta si el empleado trabajo).

#### Editar Feriado

```
PATCH /companies/:companyId/holidays/:id  [JWT + OWNER/ADMIN]
// Response 200
```

#### Eliminar Feriado

```
DELETE /companies/:companyId/holidays/:id [JWT + OWNER/ADMIN]
// Response 204
```

---

### Concepts (Conceptos de Nomina)

Prefijo: `/companies/:companyId/concepts`

#### Listar Conceptos

```
GET /companies/:companyId/concepts        [JWT + OWNER/ADMIN/MANAGER]
```

**Query Params:**

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagina |
| `limit` | number | 20 | Items (1-100) |
| `category` | ConceptCategory | - | EARNING o DEDUCTION |
| `calcType` | ConceptCalcType | - | FIXED, PERCENT, HOURLY, MANUAL |
| `isActive` | boolean | - | Filtrar activos/inactivos |

#### Ver Concepto

```
GET /companies/:companyId/concepts/:id    [JWT + OWNER/ADMIN/MANAGER]
// Response 200
```

#### Crear Concepto

```
POST /companies/:companyId/concepts       [JWT + OWNER/ADMIN]
```

```json
{
  "code": "IPS_EMPLEADO",                // requerido, unico por empresa
  "name": "IPS 9%",                      // requerido
  "category": "DEDUCTION",              // EARNING | DEDUCTION
  "calcType": "PERCENT",                // FIXED | PERCENT | HOURLY | MANUAL
  "fixedAmount": null,                   // requerido si calcType=FIXED
  "percentValue": 9.00,                 // requerido si calcType=PERCENT
  "percentBase": "BASIC",               // BASIC | GROSS (default BASIC)
  "hourlyRate": null,                    // requerido si calcType=HOURLY
  "sortOrder": 10                        // opcional, default 0
}
// Response 201
```

**Reglas de campos condicionales:**

| calcType | Campo requerido | Descripcion |
|----------|----------------|-------------|
| `FIXED` | `fixedAmount` | Monto fijo por periodo |
| `PERCENT` | `percentValue` + `percentBase` | Porcentaje sobre base |
| `HOURLY` | `hourlyRate` | Tarifa por hora trabajada |
| `MANUAL` | Ninguno | Se edita a mano en el payslip |

#### Editar Concepto

```
PATCH /companies/:companyId/concepts/:id  [JWT + OWNER/ADMIN]
// Response 200
```

#### Eliminar Concepto (Soft Delete)

```
DELETE /companies/:companyId/concepts/:id [JWT + OWNER/ADMIN]
// Response 204 (sets isActive=false)
```

---

### Payroll - Periods

Prefijo: `/companies/:companyId/payroll/periods`

#### Listar Periodos

```
GET .../periods                           [JWT + OWNER/ADMIN/MANAGER]
```

**Query Params:** `page`, `limit`, `periodType` (MONTHLY|BIWEEKLY|WEEKLY|CUSTOM)

#### Ver Periodo

```
GET .../periods/:periodId                 [JWT + OWNER/ADMIN/MANAGER]
// Response 200
```

#### Crear Periodo

```
POST .../periods                          [JWT + OWNER/ADMIN]
```

```json
{
  "periodType": "MONTHLY",              // requerido
  "startDate": "2025-03-01",            // requerido
  "endDate": "2025-03-31",              // requerido
  "name": "Marzo 2025"                  // opcional
}
// Response 201
```

> Valida que no haya solapamiento con otros periodos de la empresa.

---

### Payroll - Runs

Prefijo: `/companies/:companyId/payroll/runs`

#### Listar Runs

```
GET .../runs                              [JWT + OWNER/ADMIN/MANAGER]
```

**Query Params:** `page`, `limit`, `periodId` (UUID opcional)

#### Ver Run

```
GET .../runs/:runId                       [JWT + OWNER/ADMIN/MANAGER]
// Response 200
```

#### Crear Run

```
POST .../runs                             [JWT + OWNER/ADMIN]
```

```json
{ "periodId": "period-uuid" }
// Response 201 - data: PayrollRun (status: "DRAFT")
```

#### Ejecutar Motor de Liquidacion

```
POST .../runs/:runId/calculate            [JWT + OWNER/ADMIN]
// Response 200 - data: PayrollRun (status: "COMPLETED")
```

**Ciclo de vida del Run:**

```
DRAFT  -->  RUNNING  -->  COMPLETED  -->  CLOSED
              |               |
              v               v
           DRAFT          (editable: solo lineas MANUAL)
          (si falla)
```

#### Cerrar Run

```
POST .../runs/:runId/close                [JWT + OWNER/ADMIN]
// Response 200 - data: PayrollRun (status: "CLOSED")
// Inmutable despues de cerrar
```

---

### Payroll - Payslips

Prefijo: `/companies/:companyId/payroll/runs/:runId/payslips`

#### Listar Payslips del Run

```
GET .../payslips                          [JWT + OWNER/ADMIN/MANAGER]
```

**Query Params:** `page`, `limit`, `employeeId` (UUID opcional)

```json
// Response 200 - data: { items, total, page, limit, pages }
// Cada item incluye datos basicos del empleado
```

#### Ver Detalle de Payslip

```
GET .../payslips/:payslipId               [JWT + OWNER/ADMIN/MANAGER]
```

```json
// Response 200 - data:
{
  "id": "payslip-uuid",
  "runId": "run-uuid",
  "employeeId": "emp-uuid",
  "grossPay": "3500000.00",
  "totalDeductions": "315000.00",
  "netPay": "3185000.00",
  "employee": {
    "id": "emp-uuid",
    "firstName": "Maria",
    "lastName": "Garcia",
    "documentType": "CI",
    "documentNumber": "4567890",
    "email": "maria@email.com"
  },
  "lines": [
    {
      "id": "line-uuid",
      "conceptCode": "BASIC",
      "conceptName": "Sueldo basico proporcional",
      "category": "EARNING",
      "amount": "3500000.00"
    },
    {
      "id": "line-uuid",
      "conceptCode": "IPS_EMPLEADO",
      "conceptName": "IPS 9%",
      "category": "DEDUCTION",
      "amount": "315000.00"
    }
  ]
}
```

#### Editar Linea de Payslip

```
PATCH .../payslips/:payslipId/lines/:lineId  [JWT + OWNER/ADMIN]
```

```json
{ "amount": "50000.00" }                  // string numerico, max 2 decimales, >= 0
// Response 200 - data: PayslipLine actualizada
```

> **Restricciones:**
> - Solo si el run esta en estado `COMPLETED` (no DRAFT ni CLOSED)
> - Solo lineas de conceptos con `calcType: MANUAL`
> - Recalcula automaticamente grossPay, totalDeductions, netPay del payslip

#### Exportar CSV

```
GET .../payslips/export                   [JWT + OWNER/ADMIN/MANAGER]
```

Responde directamente con el archivo CSV (no envelope):
- **Content-Type:** `text/csv; charset=utf-8`
- **Content-Disposition:** `attachment; filename="nomina_2025-03-01_2025-03-31_run-abc12345.csv"`
- Incluye BOM UTF-8 para compatibilidad con Excel

---

## Flujo de Autenticacion para Frontend

### Setup Inicial (Axios/Fetch)

```typescript
// Configuracion base
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,                 // IMPORTANTE: para cookies HttpOnly
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});
```

### Interceptor de Refresh Automatico

```typescript
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        // Cookie se envia automaticamente con withCredentials
        const { data } = await api.post('/auth/refresh', {});
        // Guardar nuevo accessToken
        localStorage.setItem('accessToken', data.data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(error.config);
      } catch {
        // Refresh fallo - redirigir a login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Agregar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Flujo Completo

```
1. POST /auth/register o /auth/login
   -> Guardar accessToken en memoria/localStorage
   -> Cookie refresh_token se setea automaticamente

2. Cada request:
   -> Header: Authorization: Bearer <accessToken>
   -> Header: X-Requested-With: XMLHttpRequest (en POST/PUT/PATCH/DELETE)

3. Cuando accessToken expire (401):
   -> POST /auth/refresh (cookie se envia sola)
   -> Obtener nuevo accessToken

4. POST /auth/logout
   -> Cookie se limpia automaticamente
   -> Limpiar accessToken del storage
```

---

## Paginacion

Todos los endpoints de listado aceptan:

```
?page=1&limit=20
```

- `page`: min 1
- `limit`: min 1, max 100, default 20

Respuesta:

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

---

## Validaciones de Contrasena

Aplica a: `register`, `reset-password`, `change-password`

```
- Minimo 8 caracteres
- Al menos 1 letra minuscula
- Al menos 1 letra mayuscula
- Al menos 1 numero
```

---

## Rate Limiting

| Endpoint | Limite |
|----------|--------|
| Global (todas las rutas) | 100 req/min |
| `POST /auth/register` | 10 req/min |
| `POST /auth/login` | 5 req/min |
| `POST /auth/refresh` | 10 req/min |
| `POST /auth/send-confirmation-email` | 3 req/hora |
| `POST /auth/forgot-password` | 3 req/hora |

Responde `429 Too Many Requests` si se excede.
