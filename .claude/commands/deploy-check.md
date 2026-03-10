# Skill: /deploy-check
# Trigger: "deploy", "listo para merge", "pre-deploy"
# 9-point pre-merge verification checklist

## Usage
`/deploy-check`

## Checklist

Run each check and report PASS/FAIL:

### 1. TypeScript Compilation
```bash
npx tsc --noEmit
```

### 2. ESLint
```bash
npm run lint
```

### 3. Production Build
```bash
npm run build
```

### 4. Environment Variables
Verify all required env vars are documented in `.env.example`:
- `NEXT_PUBLIC_API_URL`
- Any new env vars added

### 5. No Console Statements
Search for `console.log`, `console.warn`, `console.error` in `src/`:
```bash
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | grep -v "// debug" | head -20
```

### 6. No Hardcoded URLs
Search for hardcoded localhost or API URLs:
```bash
grep -r "localhost" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -10
```

### 7. Import Verification
Check for unused imports or circular dependencies.

### 8. File Size Check
Verify no component exceeds 300 lines:
```bash
find src/ -name "*.tsx" -exec wc -l {} + | sort -rn | head -10
```

### 9. Git Status Clean
```bash
git status
```
No untracked files that should be committed.

## Output Format
```
Deploy Check Results:
  [PASS] TypeScript compilation
  [PASS] ESLint
  [PASS] Production build
  [PASS] Environment variables
  [WARN] 2 console.log statements found
  [PASS] No hardcoded URLs
  [PASS] Imports OK
  [PASS] File sizes OK
  [PASS] Git status clean

Result: READY TO MERGE (1 warning)
```
