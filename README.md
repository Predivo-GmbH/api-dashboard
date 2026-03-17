# Predivo API Dashboard

Internal dashboard for managing all APIs used across Predivo projects. Track API keys, credentials, subscriptions, costs, health status, and audit trails.

**URL:** [apis.predivo.ch](https://apis.predivo.ch)

## Stack

- **Frontend:** React 19 + TypeScript + Vite 7, Tailwind CSS v4 + shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions in Deno)
- **Data:** TanStack React Query for caching + mutations
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** GitHub Actions → FTP to apis.predivo.ch

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
npm run dev
# → http://localhost:5173
# Password gate: predivoapidash2026
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | ESLint |
| `npm test` | Run Vitest test suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run preview` | Preview production build |

## Architecture

```
src/
├── components/
│   ├── layout/       # AppLayout, AppSidebar
│   ├── shared/       # PasswordGate, StatusBadge, EmptyState, ConfirmDialog
│   └── ui/           # shadcn/ui primitives
├── hooks/            # React Query hooks (useApis, useAuth, useCredentials, etc.)
├── lib/              # Supabase client, constants, formatters, utils
├── pages/            # 12 route pages (lazy-loaded)
└── types/            # TypeScript interfaces
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/auth` | Login | Supabase email/password auth |
| `/dashboard` | Dashboard | Metrics, charts, recent APIs |
| `/apis` | API Inventory | Searchable, filterable API list |
| `/apis/new` | Add API | Create new API entry |
| `/apis/:id` | API Detail | Tabs: overview, credentials, subscriptions, alerts |
| `/apis/:id/edit` | Edit API | Update API entry |
| `/projects` | Projects | Project list with API counts |
| `/projects/:id` | Project Detail | Project metrics + assigned APIs |
| `/audit` | Audit Log | Timestamped activity log |
| `/settings` | Settings | Account settings parent |
| `/settings/notifications` | Notifications | Alert preferences |
| `*` | 404 | Not found |

## Database

10 tables in Supabase PostgreSQL — see `supabase/migrations/001_core_schema.sql`.

Key tables: `api_entries`, `api_credentials` (AES-256-GCM encrypted), `projects`, `subscriptions`, `audit_logs`, `health_checks`.

## Edge Functions

- `encrypt-secret` — Encrypt and store API credentials
- `decrypt-secret` — Decrypt credentials for reveal/copy

Both use AES-256-GCM via `ENCRYPTION_MASTER_KEY` env var.

## Design System

- **Accent:** Teal (`#0D9488` light / `#2DD4BF` dark)
- **Fonts:** Inter (UI) + JetBrains Mono (code/credentials)
- **Design:** Border-first (1px borders, no shadows on cards)
- **Tokens:** `docs/design-tokens.json` (canonical source)
- **Mockups:** `docs/design.pen` (Pencil design file)
