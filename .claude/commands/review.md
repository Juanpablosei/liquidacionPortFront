# Skill: /review
# Trigger: "review", "code review", "revisar"
# Code quality review of recent changes

## Usage
`/review` — reviews uncommitted changes
`/review <file-path>` — reviews a specific file

## Review Process

### Step 1: Identify Changes
```bash
git diff --name-only          # Unstaged changes
git diff --staged --name-only # Staged changes
```

### Step 2: Run Quality Tools
```bash
npx tsc --noEmit
npm run lint
```

### Step 3: Manual Review
For each changed file, check against the code-reviewer agent checklist:

#### TypeScript
- No `any` types
- No unsafe `as` casts
- Explicit return types on exports

#### UI/Styling
- Dark theme compliance (#0A0F1C bg, #2563EB accent)
- Uses `cn()` for conditional classes
- No inline styles except dynamic values
- No decorative gradients

#### Patterns
- Uses shared components (DataTable, FormField, ConfirmDialog)
- API calls through `src/lib/api/` modules
- Company-scoped endpoints
- Permission checks with RoleGate

#### Security
- No hardcoded credentials
- No exposed API keys
- Input validation with Zod

### Step 4: Report

## Output Format
```
Code Review — [N] files changed

[file1.tsx]
  [CRITICAL] line 45: using `any` type
  [WARNING] line 80: missing loading state
  [OK] permissions, styling, API patterns

[file2.ts]
  [OK] all checks passed

Summary: X critical, Y warnings, Z suggestions
Action needed: [YES/NO]
```

### Step 5: Capture Lessons (if issues found)
If any CRITICAL or WARNING issues were found, append a new entry to `tasks/lessons.md` with the pattern detected.

Format:
```markdown
## {date} — Review: {short description}
- **Error**: {what was wrong}
- **Cause**: {why it happened — e.g. scaffold didn't include it, pattern not followed}
- **Rule**: {rule to prevent it next time}
- **Applies to**: {scope — e.g. all new pages, all forms, admin section}
```

Rules:
- Only write lessons for CRITICAL and WARNING issues, not OK items.
- Group related issues into a single lesson entry if they share the same root cause.
- Do NOT duplicate lessons that already exist in the file — check before writing.
- Focus on **patterns** (e.g. "always use cn() for conditional classes") not one-off fixes.
