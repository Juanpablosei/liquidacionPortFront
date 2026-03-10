# Skill: /evaluate
# Trigger: "evaluar", "cuanto cuesta", "que implica"
# Scope, effort, risk assessment for a requirement

## Usage
`/evaluate <requirement description>`

## Analysis Framework

### 1. Scope Analysis
- What files need to be created?
- What files need to be modified?
- Are there new dependencies needed?
- Does it require backend changes?

### 2. Effort Estimate
- **LOW**: 1-3 files, < 1 hour, well-defined pattern exists
- **MEDIUM**: 4-8 files, 1-3 hours, some new patterns needed
- **HIGH**: 9+ files, 3+ hours, architectural decisions needed

### 3. Risk Assessment
- Does it touch shared components? (higher risk)
- Does it change API contracts? (higher risk)
- Does it affect auth/permissions? (higher risk)
- Is there existing similar code to reference? (lower risk)

### 4. Dependencies
- Frontend-only or requires backend changes?
- New npm packages needed?
- New shared components needed?

## Output Format
```
## Evaluation: [requirement]

### Scope
- New files: [list]
- Modified files: [list]
- Backend changes: YES/NO

### Effort: LOW / MEDIUM / HIGH
### Risk: LOW / MEDIUM / HIGH

### Implementation Plan
1. [step]
2. [step]
3. [step]

### Dependencies
- [dependency if any]

### Questions / Blockers
- [any unclear aspects]
```
