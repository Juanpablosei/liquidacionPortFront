# Skill: /new-feature
# Trigger: "crear feature", "nueva funcionalidad"
# Full pipeline: scaffold -> implement -> review -> commit

## Usage
`/new-feature <feature-name>`

## Pipeline

### Step 1: Scaffold
Run `/scaffold-feature <feature-name>` to generate the file structure.

### Step 2: Implement
Use the `implementer` agent to fill in the scaffolded files with actual business logic.
Follow the implementation order: types -> validators -> API module -> constants -> hooks -> page.

### Step 3: Review
Use the `code-reviewer` agent to audit the implementation.
Fix any CRITICAL or WARNING issues found.

### Step 4: Quality Check
Run verification:
```bash
npx tsc --noEmit
npm run lint
```
Fix any issues.

### Step 5: Commit
Use `/commit` skill to create a clean commit with the new feature.

## Rules
- Each step must complete successfully before moving to the next.
- If any step fails, fix the issue before proceeding.
- Report progress at each step.
