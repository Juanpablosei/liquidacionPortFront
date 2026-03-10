# Skill: /scaffold-feature
# Trigger: "nueva feature", "nuevo modulo", "scaffold"
# Generates the file structure for a new feature

## Usage
`/scaffold-feature <feature-name>`

## What it creates

Based on the feature name, generate the following files:

### 1. Type definition
`src/lib/types/{feature}.ts`
```typescript
export interface {Feature} {
  id: string;
  // ... fields based on feature requirements
  companyId: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Zod validator
`src/lib/validators/{feature}.ts`
```typescript
import { z } from 'zod';

export const create{Feature}Schema = z.object({
  // ... fields
});

export type Create{Feature}Input = z.infer<typeof create{Feature}Schema>;

export const update{Feature}Schema = create{Feature}Schema.partial();
export type Update{Feature}Input = z.infer<typeof update{Feature}Schema>;
```

### 3. API constants
Add to `src/lib/constants/api-endpoints.ts`:
```typescript
{FEATURE}: {
  BASE: (companyId: string) => `/companies/${companyId}/{feature}`,
  BY_ID: (companyId: string, id: string) => `/companies/${companyId}/{feature}/${id}`,
}
```

### 4. API module
`src/lib/api/{feature}.ts`
```typescript
import { apiFetch } from './client';
import { API } from '../constants/api-endpoints';
import type { {Feature} } from '../types/{feature}';
import type { PaginatedResponse } from '../types/api';

export const {feature}Api = {
  getAll: (companyId: string, params?: { page?: number; limit?: number }) =>
    apiFetch<PaginatedResponse<{Feature}>>(API.{FEATURE}.BASE(companyId), { params }),
  getById: (companyId: string, id: string) =>
    apiFetch<{Feature}>(API.{FEATURE}.BY_ID(companyId, id)),
  create: (companyId: string, data: Create{Feature}Input) =>
    apiFetch<{Feature}>(API.{FEATURE}.BASE(companyId), { method: 'POST', body: JSON.stringify(data) }),
  update: (companyId: string, id: string, data: Update{Feature}Input) =>
    apiFetch<{Feature}>(API.{FEATURE}.BY_ID(companyId, id), { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (companyId: string, id: string) =>
    apiFetch<void>(API.{FEATURE}.BY_ID(companyId, id), { method: 'DELETE' }),
};
```

### 5. Page
`src/app/(dashboard)/companies/[companyId]/{feature}/page.tsx`
- Import DataTable, PageHeader, LoadingSkeleton, EmptyState
- Implement list view with pagination
- Add RoleGate for create button

## Output
Report created files as:
```
Created {N} files for feature "{feature-name}":
  src/lib/types/{feature}.ts (X lines)
  src/lib/validators/{feature}.ts (X lines)
  src/lib/api/{feature}.ts (X lines)
  src/app/(dashboard)/companies/[companyId]/{feature}/page.tsx (X lines)
  + Updated src/lib/constants/api-endpoints.ts
```
