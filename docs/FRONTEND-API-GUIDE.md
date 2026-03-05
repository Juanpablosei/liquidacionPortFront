# Guia de Integracion Frontend - API de Nomina

## Configuracion Base

| Parametro | Valor |
|-----------|-------|
| **Base URL** | `http://localhost:3000/api/v1` |
| **Content-Type** | `application/json` |
| **Body Size Limit** | `10 KB` |
| **Autenticacion** | Bearer JWT en header `Authorization` |
| **Refresh Token** | Cookie HttpOnly `refresh_token` (automatica) |
| **Idioma** | Header `Accept-Language: es` o `en` (default: `es`) |

---

## Headers Requeridos

```
Content-Type: application/json
Authorization: Bearer <accessToken>       // en rutas protegidas
X-Requested-With: XMLHttpRequest          // en POST, PUT, PATCH, DELETE (CSRF)
Accept-Language: es                       // idioma de respuestas: "es" o "en"
```

> **Importante:** Todas las peticiones mutantes (POST/PUT/PATCH/DELETE) a rutas protegidas deben incluir el header `X-Requested-With`. Sin este header, el servidor responde `403 Forbidden`.

> **Idioma:** El header `Accept-Language` controla el idioma de todos los mensajes de respuesta (errores y exitos). Valores soportados: `es` (espanol, default) y `en` (ingles). Si no se envia, el idioma por defecto es `es`.

---

## Formato de Respuestas

### Respuesta Exitosa (2xx)

```json
{
  "success": true,
  "data": { ... },
  "message": "OK",                         // traducido segun Accept-Language
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
  "message": "Mensaje descriptivo del error",  // traducido segun Accept-Language
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
type PayrollPeriodType = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'CUSTOM' | 'SETTLEMENT';

// Estado del run de nomina
type PayrollRunStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'CLOSED';

// Razon de liquidacion final
type SettlementReason = 'DISMISSAL' | 'RESIGNATION';
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
| Importar empleados (Excel) | x | x | | |
| Liquidacion final | x | x | | |
| Ver liquidacion | x | x | x | |
| Config liquidacion | x | x | | |
| CRUD contratos | x | x | | |
| Ver contratos | x | x | x* | |
| Asignar conceptos a contrato | x | x | | |
| Ver conceptos de contrato | x | x | x | |
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
| Exportar PDF | x | x | x | |
| Ver mis recibos (portal) | | | | x |
| Firmar recibos | | | | x |
| Dashboard de firmas | x | x | | |

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
  "expiresIn": 900,
  "mustChangePassword": true              // solo si el usuario debe cambiar su contrasena temporal
}
// + Cookie HttpOnly: refresh_token
```

> **Primer login de empleado:** Si `mustChangePassword: true`, el frontend debe redirigir a pantalla de cambio de contrasena antes de permitir cualquier otra accion. Esto ocurre cuando un empleado fue creado con email y recibio credenciales temporales.

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
  "mustChangePassword": false,             // true si debe cambiar contrasena temporal
  "locale": "es",                          // "es" | "en" - preferencia de idioma del usuario
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

#### Actualizar Idioma

```
PATCH /auth/locale                        [JWT]
```

```json
// Request Body
{
  "locale": "en"                           // "es" | "en"
}

// Response 200 - data:
{ "message": "Preferencia de idioma actualizada." }
```

> Guarda la preferencia de idioma del usuario en la base de datos. Esto permite que el frontend envie el `Accept-Language` correcto en futuras sesiones.

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

#### Descargar Plantilla de Importacion

```
GET /companies/:companyId/employees/import/template  [JWT + OWNER/ADMIN]
```

> Descarga un archivo `.xlsx` con los headers correctos y una fila de ejemplo.
> Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Columnas de la plantilla:**

| Columna | Tipo | Requerido | Descripcion |
|---------|------|-----------|-------------|
| `documentType` | string | Si | `CI`, `RUC`, `PASSPORT`, `OTHER` |
| `documentNumber` | string | Si | Numero de documento (unico por empresa) |
| `firstName` | string | Si | Nombre |
| `lastName` | string | Si | Apellido |
| `email` | string | No | Email del empleado |
| `phone` | string | No | Telefono |
| `hireDate` | string | Si | Fecha de ingreso (`YYYY-MM-DD`) |

#### Importar Empleados desde Excel

```
POST /companies/:companyId/employees/import  [JWT + OWNER/ADMIN]
Content-Type: multipart/form-data
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `file` | File | Archivo `.xlsx` (max 5 MB) |

```json
// Response 201
{
  "imported": 3,
  "employees": [
    { "id": "uuid", "firstName": "Juan", "lastName": "Lopez", "documentNumber": "4567890" }
  ]
}
```

> **Validacion estricta:** Si cualquier fila tiene un error, no se importa ninguna. La respuesta `400` incluye un array `errors` con `{ row, field, message }` por cada error encontrado.
>
> **Duplicados:** Si un `documentNumber` ya existe en la empresa, se rechaza todo el archivo indicando cuales documentos ya existen.

---

### Settlements (Liquidacion Final)

Cuando un empleado es despedido o renuncia, se genera una liquidacion final que incluye salario proporcional, aguinaldo proporcional, vacaciones proporcionales, e indemnizacion (solo en caso de despido).

#### Generar Liquidacion

```
POST /companies/:companyId/employees/:employeeId/settlement  [JWT + OWNER/ADMIN]
```

```json
// Request Body
{
  "reason": "DISMISSAL",                  // DISMISSAL | RESIGNATION
  "terminationDate": "2025-03-15"        // requerido, ISO date
}

// Response 201 - data:
{
  "id": "settlement-uuid",
  "employeeId": "emp-uuid",
  "reason": "DISMISSAL",
  "terminationDate": "2025-03-15",
  "hireDateSnapshot": "2023-01-01",
  "seniorityYears": 2,
  "seniorityMonths": 2,
  "seniorityDays": 14,
  "dailySalary": "116666.67",
  "run": {
    "id": "run-uuid",
    "status": "COMPLETED",
    "payslips": [
      {
        "id": "payslip-uuid",
        "grossPay": "5500000.00",
        "totalDeductions": "315000.00",
        "netPay": "5185000.00",
        "lines": [
          { "conceptCode": "BASIC", "conceptName": "Sueldo basico proporcional", "category": "EARNING", "amount": "1750000.00" },
          { "conceptCode": "AGUINALDO_PROP", "conceptName": "Aguinaldo proporcional", "category": "EARNING", "amount": "729166.67" },
          { "conceptCode": "VACACIONES_PROP", "conceptName": "Vacaciones proporcionales", "category": "EARNING", "amount": "233333.33" },
          { "conceptCode": "INDEM_PREAVISO", "conceptName": "Indemnizacion por preaviso", "category": "EARNING", "amount": "3500000.00" },
          { "conceptCode": "INDEM_ANTIGUEDAD", "conceptName": "Indemnizacion por antiguedad", "category": "EARNING", "amount": "3500000.00" }
        ]
      }
    ]
  }
}
```

> **Efectos automaticos:**
> - Termina al empleado (isActive=false, terminationDate)
> - Cierra el contrato activo (endDate = terminationDate)
> - Crea un periodo y run tipo SETTLEMENT
> - Calcula salario proporcional + conceptos del contrato + lineas de liquidacion
>
> **DISMISSAL** incluye indemnizacion por preaviso y antiguedad. **RESIGNATION** no.
>
> **Un solo settlement por empleado.** Si ya existe, responde `409 Conflict`.

#### Ver Liquidacion

```
GET /companies/:companyId/employees/:employeeId/settlement  [JWT + OWNER/ADMIN/MANAGER]
// Response 200 - data: Settlement (misma estructura que arriba)
```

#### Ver Configuracion de Liquidacion

```
GET /companies/:companyId/settlement-config  [JWT + OWNER/ADMIN]
```

```json
// Response 200 - data:
{
  "id": "config-uuid",
  "companyId": "company-uuid",
  "noticePeriodRules": [
    { "minYears": 0, "maxYears": 1, "days": 30 },
    { "minYears": 1, "maxYears": 5, "days": 45 },
    { "minYears": 5, "maxYears": 10, "days": 60 },
    { "minYears": 10, "maxYears": 999, "days": 90 }
  ],
  "severanceDaysPerYear": 15,
  "vacationRules": [
    { "minYears": 0, "maxYears": 5, "days": 12 },
    { "minYears": 5, "maxYears": 10, "days": 18 },
    { "minYears": 10, "maxYears": 15, "days": 24 },
    { "minYears": 15, "maxYears": 999, "days": 30 }
  ]
}
```

> Se auto-crea con defaults de la ley paraguaya la primera vez que se consulta.

#### Editar Configuracion de Liquidacion

```
PATCH /companies/:companyId/settlement-config  [JWT + OWNER/ADMIN]
```

```json
{
  "severanceDaysPerYear": 20,             // opcional
  "noticePeriodRules": [                  // opcional, array completo
    { "minYears": 0, "maxYears": 1, "days": 30 },
    { "minYears": 1, "maxYears": 5, "days": 60 }
  ],
  "vacationRules": [                      // opcional, array completo
    { "minYears": 0, "maxYears": 5, "days": 15 }
  ]
}
// Response 200 - data: SettlementConfig actualizada
```

> Cada regla en `noticePeriodRules` y `vacationRules` requiere `minYears` (>=0), `maxYears` (>minYears) y `days` (>=1).

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
  "salaryAmount": 3500000.00,           // requerido, positivo, max 99999999999.99
  "conceptIds": ["uuid-1", "uuid-2"]   // opcional, UUIDs de conceptos a asignar
}
// Response 201 - data: Contract
```

> Valida que no haya solapamiento de fechas con otros contratos del mismo empleado.
> Si `conceptIds` se omite, se asignan automaticamente **todos los conceptos activos** de la empresa. Si se envia un array, solo se asignan esos conceptos.

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

#### Listar Conceptos del Contrato

```
GET .../contracts/:contractId/concepts   [JWT + OWNER/ADMIN/MANAGER]
```

```json
// Response 200 - data:
[
  {
    "id": "concept-uuid",
    "code": "JUB",
    "name": "Jubilacion (11%)",
    "category": "DEDUCTION",
    "calcType": "PERCENT",
    "isActive": true,
    "sortOrder": 10
  }
]
```

#### Asignar Conceptos al Contrato

```
POST .../contracts/:contractId/concepts  [JWT + OWNER/ADMIN]
```

```json
{
  "conceptIds": ["concept-uuid-1", "concept-uuid-2"]  // requerido, al menos 1
}
// Response 201 - data: lista actualizada de conceptos asignados
```

> Los conceptos deben pertenecer a la misma empresa. Los duplicados se ignoran silenciosamente.

#### Desasignar Concepto del Contrato

```
DELETE .../contracts/:contractId/concepts/:conceptId  [JWT + OWNER/ADMIN]
// Response 204
```

> Retorna `404` si el concepto no estaba asignado al contrato.

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

> **Un solo run por periodo:** Solo se permite crear un run por periodo. Si ya existe uno, el servidor responde `409 Conflict`. Para recalcular, usar `POST .../runs/:runId/calculate` sobre el run existente.

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
    'Accept-Language': 'es',             // idioma: "es" | "en"
  },
});

// Funcion para cambiar el idioma en runtime
function setApiLanguage(locale: 'es' | 'en') {
  api.defaults.headers['Accept-Language'] = locale;
}
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

2. GET /auth/me
   -> Obtener locale del usuario
   -> Setear Accept-Language header en Axios

3. Cada request:
   -> Header: Authorization: Bearer <accessToken>
   -> Header: X-Requested-With: XMLHttpRequest (en POST/PUT/PATCH/DELETE)
   -> Header: Accept-Language: es|en (idioma de respuestas)

4. Cuando accessToken expire (401):
   -> POST /auth/refresh (cookie se envia sola)
   -> Obtener nuevo accessToken

5. POST /auth/logout
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

## Internacionalizacion (i18n)

El backend soporta respuestas en **espanol** (`es`) e **ingles** (`en`).

### Como funciona

1. Todos los mensajes de la API (errores y exitos) se traducen automaticamente segun el header `Accept-Language`
2. Si no se envia el header, el idioma por defecto es `es`
3. Los mensajes de validacion (class-validator) tambien se traducen

### Configurar idioma en el frontend

```typescript
// Opcion 1: Header estatico en la instancia de Axios
api.defaults.headers['Accept-Language'] = userLocale; // "es" | "en"

// Opcion 2: Leer la preferencia del usuario desde /auth/me
const { data } = await api.get('/auth/me');
api.defaults.headers['Accept-Language'] = data.data.locale;

// Opcion 3: Guardar la preferencia del usuario
await api.patch('/auth/locale', { locale: 'en' });
```

### Flujo recomendado

1. Al hacer login/register, obtener `locale` del usuario via `GET /auth/me`
2. Setear `Accept-Language` en Axios con ese valor
3. Si el usuario cambia idioma en la UI, llamar `PATCH /auth/locale` y actualizar el header

### Ejemplos de respuestas por idioma

```json
// Accept-Language: es
{ "message": "Credenciales invalidas" }

// Accept-Language: en
{ "message": "Invalid credentials" }
```

---

## Portal del Empleado (MEMBER)

### Flujo de primer login

Cuando se crea un empleado con email, el sistema automaticamente:
1. Crea un `User` con contrasena temporal (8 chars aleatorios)
2. Lo agrega como `MEMBER` de la empresa
3. Envia email con credenciales

Al hacer login con esas credenciales, la respuesta incluye `mustChangePassword: true`:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "abc...",
    "expiresIn": 900,
    "mustChangePassword": true
  }
}
```

**El frontend debe redirigir a pantalla de cambio de contrasena** antes de permitir cualquier otra accion. Despues de `POST /auth/change-password`, el flag se desactiva.

El endpoint `GET /auth/me` tambien incluye `mustChangePassword` para validar el estado.

---

### Mis Recibos de Sueldo

#### Listar mis recibos

```
GET /api/v1/companies/:companyId/my-payslips?page=1&limit=20
```

**Roles:** MEMBER+ (cualquier miembro de la empresa)

Retorna los recibos del empleado vinculado al usuario autenticado, ordenados por fecha mas reciente.

**Respuesta:**
```json
{
  "items": [
    {
      "id": "payslip-uuid",
      "runId": "run-uuid",
      "grossPay": "2500000.00",
      "totalDeductions": "500000.00",
      "netPay": "2000000.00",
      "run": {
        "id": "run-uuid",
        "status": "COMPLETED",
        "period": {
          "id": "period-uuid",
          "name": "Marzo 2026",
          "periodType": "MONTHLY",
          "startDate": "2026-03-01",
          "endDate": "2026-03-31"
        }
      },
      "signature": null
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

#### Ver detalle de mi recibo

```
GET /api/v1/companies/:companyId/my-payslips/:payslipId
```

Incluye lineas (conceptos) del recibo y estado de firma.

#### Firmar un recibo

```
POST /api/v1/companies/:companyId/my-payslips/:payslipId/sign
```

**Body (opcional):**
```json
{
  "comment": "Conforme"
}
```

- `comment`: string, max 500 caracteres, opcional
- Un recibo solo se puede firmar una vez
- Retorna el payslip con la firma incluida

**Errores posibles:**
- `payroll.NOT_YOUR_PAYSLIP` — El recibo no pertenece al empleado del usuario
- `payroll.ALREADY_SIGNED` — El recibo ya fue firmado
- `payroll.NO_EMPLOYEE_LINKED` — El usuario no tiene un empleado vinculado en esta empresa

---

### Dashboard de Firmas (OWNER/ADMIN)

```
GET /api/v1/companies/:companyId/payroll/runs/:runId/payslips/signatures
```

**Roles:** OWNER, ADMIN

**Respuesta:**
```json
{
  "total": 25,
  "signed": 18,
  "pending": 7,
  "details": [
    {
      "employeeId": "uuid",
      "firstName": "Juan",
      "lastName": "Lopez",
      "signed": true,
      "signedAt": "2026-03-15T14:30:00.000Z",
      "comment": "Conforme"
    },
    {
      "employeeId": "uuid",
      "firstName": "Maria",
      "lastName": "Garcia",
      "signed": false,
      "signedAt": null,
      "comment": null
    }
  ]
}
```

> **Nota:** El listado normal de payslips (`GET .../payslips`) ahora tambien incluye el campo `signature` con el estado de firma de cada recibo.

---

## Exportar PDF de Recibos

### Descargar todos los recibos del run en PDF

```
GET /api/v1/companies/:companyId/payroll/runs/:runId/payslips/export-pdf
```

**Roles:** OWNER, ADMIN, MANAGER

Genera un PDF con una pagina por empleado, ordenados por apellido. Responde con `Content-Type: application/pdf`.

### Descargar PDF de un recibo individual

```
GET /api/v1/companies/:companyId/payroll/runs/:runId/payslips/:payslipId/export-pdf
```

**Roles:** OWNER, ADMIN, MANAGER

Genera un PDF de una sola pagina con el recibo del empleado.

**Ejemplo de uso en frontend:**
```javascript
const response = await fetch(`${baseUrl}/companies/${companyId}/payroll/runs/${runId}/payslips/export-pdf`, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url);
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
