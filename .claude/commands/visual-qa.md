# Skill: /visual-qa
# Trigger: "visual qa", "qa visual", "revisar ui", "test visual"
# Visual QA: inspects running app via Chrome DevTools + ui-ux-pro-max review

## Usage
`/visual-qa <url-or-path>` — inspect a specific page (e.g. `/admin`, `/admin/plans`)
`/visual-qa` — inspect current page in Chrome

## Arguments
- `$ARGUMENTS` — optional URL path to navigate to (e.g. `/admin/plans`)

## Pipeline

### Step 0: Ensure Dev Server
Verify the dev server is running. If not, remind the user to start it with `npm run dev`.

### Step 1: Navigate & Screenshot
Use Chrome DevTools MCP tools:
1. List open pages with `mcp__chrome-devtools__list_pages` to find the app tab
2. Select the app page with `mcp__chrome-devtools__select_page`
3. If `$ARGUMENTS` contains a path, navigate with `mcp__chrome-devtools__navigate_page` to `http://localhost:3001{path}`
4. Wait for network idle: `mcp__chrome-devtools__wait_for` with `waitFor: "networkIdle"`
5. Take a full screenshot: `mcp__chrome-devtools__take_screenshot`

### Step 2: Console & Network Errors
1. Check for console errors: `mcp__chrome-devtools__list_console_messages`
2. Check for failed network requests: `mcp__chrome-devtools__list_network_requests` — look for 4xx/5xx status codes
3. Document any errors found

### Step 3: Visual Inspection (ui-ux-pro-max)
Analyze the screenshot using the ui-ux-pro-max design checklist:

#### Layout & Spacing
- Consistent spacing (p-6 page, p-4 cards, gap-4/gap-6)
- Proper alignment of elements
- No overlapping or cut-off content
- Responsive: check at default viewport

#### Dark Theme Compliance
- Background: #0A0F1C (page) / #111827 (cards)
- Accent: #2563EB (buttons, active states)
- Text: white (primary), slate-400 (secondary), slate-500 (tertiary)
- Borders: white/[0.06]
- No light-theme bleed-through

#### Typography
- Headings properly sized and weighted
- Monospace for numbers/codes (font-mono)
- Proper text truncation on overflow
- Readable contrast ratios

#### Interactive Elements
- Buttons have hover states
- Clickable rows show cursor-pointer
- Disabled states visible (opacity-30 or similar)
- Focus indicators present

#### Components
- Loading skeletons appear during fetch
- Empty states shown when no data
- Error states handled (toast or inline)
- Tables have proper headers and alignment

### Step 4: Accessibility Quick Check
Use Chrome DevTools:
1. Run Lighthouse accessibility audit if possible: `mcp__chrome-devtools__lighthouse_audit` with category "accessibility"
2. Or manually check: color contrast, alt text, keyboard navigation hints

### Step 5: Multi-viewport Check (optional)
If the page has responsive design:
1. Resize to mobile: `mcp__chrome-devtools__resize_page` width=375, height=812
2. Take screenshot
3. Check mobile layout (sidebar hidden, tables scroll, cards stack)
4. Resize back to desktop: `mcp__chrome-devtools__resize_page` width=1440, height=900

### Step 6: Report & Todo

#### Report Format
```
Visual QA — {page-name}

Screenshots: [taken at {viewport}]

Console Errors: {count}
  - {error 1}
  - {error 2}

Network Errors: {count}
  - {method} {url} → {status}

Visual Issues:
  [CRITICAL] {description} — {location on page}
  [WARNING] {description} — {location on page}
  [OK] {category}: passed

Accessibility: {score}/100 or manual notes

Summary: X critical, Y warnings
```

#### Auto-create Todos
If ANY critical or warning issues are found, append them to `tasks/todo.md` under a new section:

```markdown
## Visual QA — {page-name} ({date})
- [ ] [CRITICAL] {issue description} — {file hint if known}
- [ ] [WARNING] {issue description} — {file hint if known}
```

Do NOT create todos for [OK] items. Only actionable issues.

## Test Credentials
If the page requires authentication, log in automatically using Chrome DevTools before navigating.

Login URL: `http://localhost:3001/login`
Login form fields: `email` input + `password` input + submit button.

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | superadmin@nomina.app | Password123! |
| OWNER | owner@tecavanzada.com | Password123! |
| ADMIN | admin@tecavanzada.com | Password123! |
| MANAGER | manager@tecavanzada.com | Password123! |
| MEMBER (RRHH) | rrhh@tecavanzada.com | Password123! |

### Auto-login Flow
1. Navigate to login page
2. Fill email field with `mcp__chrome-devtools__fill`
3. Fill password field with `mcp__chrome-devtools__fill`
4. Click submit button with `mcp__chrome-devtools__click`
5. Wait for navigation with `mcp__chrome-devtools__wait_for` (waitFor: "navigation")
6. Then proceed to the target page

### Which user to use
- Default: `owner@tecavanzada.com` (has access to everything)
- For admin panel (`/admin/*`): use `superadmin@nomina.app` (has SUPER_ADMIN systemRole)
- For company pages: use owner or admin
- For restricted views: use manager or rrhh to test permission gates
- If `$ARGUMENTS` includes a role hint (e.g. `/visual-qa /admin as admin`), use that role

## Rules
- ALWAYS take at least one screenshot before reporting
- ALWAYS check console + network for errors
- Compare against the design system defined in CLAUDE.md
- If login fails, report the error and stop — do NOT continue with unauthenticated screenshots
- If dev server is not running, stop and tell the user
