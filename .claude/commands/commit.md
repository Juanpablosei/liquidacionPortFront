# Skill: /commit
# Trigger: "commit", "guardar cambios"
# Quality check + conventional commit

## Usage
`/commit <message>` or `/commit` (auto-generates message from changes)

## Flow

### Step 1: Quality Check
```bash
npx tsc --noEmit    # Type check
npm run lint         # Lint check
```
If either fails: FIX the issues first, then retry.

### Step 2: Review Changes
```bash
git status
git diff --staged
git diff
```
Analyze what changed and ensure nothing unintended is included.

### Step 3: Stage Files
Stage only the relevant files. NEVER use `git add -A` blindly.
Do NOT stage:
- `.env` or `.env.local` files
- `node_modules/`
- `.next/`
- Files with credentials or secrets

### Step 4: Commit
Use Conventional Commits format:
- `feat: description` — new feature
- `fix: description` — bug fix
- `refactor: description` — code restructuring
- `docs: description` — documentation only
- `chore: description` — tooling, config, deps
- `style: description` — formatting, no logic change

Message should be concise (< 72 chars), in English, lowercase.

```bash
git commit -m "feat: add employee overtime tracking"
```

### Step 5: Verify
```bash
git log --oneline -1
git status
```

## Rules
- NEVER commit without passing quality checks first
- NEVER use `--no-verify` flag
- NEVER commit secrets or environment files
- If lint/tsc fails, fix and create a NEW commit (don't amend)
- ALWAYS commit on the `dev` branch unless the user explicitly specifies another branch
- Before committing, verify the current branch with `git branch --show-current`
- If NOT on `dev` (and the user didn't specify another branch), switch to `dev` first or ask the user for confirmation
