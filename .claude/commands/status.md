# Skill: /status
# Trigger: "estado", "como va", "status"
# Project status report

## Usage
`/status`

## What to Report

### 1. Project Info
- Name: Silent Port
- Branch: (current git branch)
- Last commit: (hash + message)

### 2. Implementation Status
Check and report all phases:
- Phase 1: Auth
- Phase 2: Companies & members
- Phase 3: Employees & contracts
- Phase 4: Attendance, overtime, holidays
- Phase 5: Payroll concepts
- Phase 6: Payroll engine
- Phase 7: Polish

### 3. Codebase Metrics
Run these commands and report:
```bash
# Total files
find src/ -name "*.ts" -o -name "*.tsx" | wc -l

# Components count
find src/components/ -name "*.tsx" | wc -l

# Pages count
find src/app/ -name "page.tsx" | wc -l

# API modules
ls src/lib/api/*.ts | wc -l

# Types files
ls src/lib/types/*.ts | wc -l
```

### 4. Quality Status
```bash
npx tsc --noEmit 2>&1 | tail -1    # Type errors
npm run lint 2>&1 | tail -3         # Lint status
```

### 5. Git Status
```bash
git status --short
git log --oneline -5
```

### 6. Active Tasks
Read `tasks/todo.md` and report current task status.

## Output Format
```
Silent Port — Status Report
Branch: dev | Last: abc1234 feat: add overtime

Phases: 7/7 complete
Files: 120 TS/TSX | 45 components | 18 pages | 9 API modules

Quality:
  TypeScript: PASS (0 errors)
  ESLint: PASS

Git: clean (no uncommitted changes)
Tasks: [current task or "none active"]
```
