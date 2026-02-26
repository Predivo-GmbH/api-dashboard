# Predivo API Dashboard

## Stack
- React 19 + TypeScript + Vite, Tailwind v4 + shadcn/ui, TanStack Query
- Supabase backend (Auth, PostgreSQL, Edge Functions in Deno)
- Deployment: GitHub Actions -> FTP to apis.predivo.ch

## Dev Server
- URL: http://localhost:5173
- Start: `npm run dev`
- Password gate: `predivoapidash2026`

## Rules
- NO hardcoded hex colors — use design tokens from `src/index.css`
- NO new frameworks/libraries without discussion
- All components must support light and dark mode
- Edge functions: deploy with `--no-verify-jwt` (they handle own auth)
- Do NOT deploy to Vercel — FTP only
- Always ask before pushing to main
- API keys must NEVER appear in plaintext in DB or frontend
- Audit log every credential access
- Vitest 4.x with `globals: true` — DO NOT import from 'vitest' in test files

## Key Files
- `src/App.tsx` — Router + providers (PasswordGate > ThemeProvider > QueryClientProvider > BrowserRouter)
- `src/lib/constants.ts` — API_STATUSES, HEALTH_STATUSES, API_CATEGORIES, BILLING_MODELS
- `src/types/api.ts` — All TypeScript interfaces
- `supabase/functions/_shared/encryption.ts` — AES-256-GCM encrypt/decrypt
- `supabase/migrations/001_core_schema.sql` — Full database schema

## Visual Development

### Design References
- Design principles: `/context/design-principles.md`
- Brand style guide: `/context/style-guide.md`

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. Navigate to affected pages via Playwright MCP
2. Verify design compliance against context files
3. Capture screenshot at 1440px
4. Check console for errors

---

## Verification Loop (MANDATORY)

After ANY code change, verify before reporting completion:
1. **Build** — `npm run build` must pass with zero TypeScript errors
2. **Lint** — `npm run lint` must pass with zero errors
3. **Test** — `npm test -- --run` must pass (all green)
4. If any step fails, fix the issue before proceeding — do NOT move on with broken code

For comprehensive validation, invoke the `@build-validator` agent.

### Plan Before Building
For non-trivial features (3+ files, new patterns, architectural changes):
- Run `/plan` first to create a structured implementation plan
- Wait for user approval before writing code

---

## Code Quality

### Before Creating PRs
- Run `/code-review` for a comprehensive code quality check
- Run `/security-review` for any changes touching auth, APIs, or data handling
- Run `/design-review` for any visual/UI changes
- Run `@build-validator` to verify build, tests, lint, and no debug artifacts

### Learn From Mistakes
After a PR review catches issues, run `/learn` to extract recurring patterns and propose additions to this file.
