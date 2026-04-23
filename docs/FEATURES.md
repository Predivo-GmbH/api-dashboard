# Feature Registry — API Dashboard

> Auto-generated feature registry. Each feature maps to source files and test files.
> Used by `scripts/check-feature-coverage.mjs` to enforce test coverage.

## F-001: Password Gate
- **Source**: `src/components/shared/PasswordGate.tsx`
- **Tests**: `src/components/shared/PasswordGate.test.tsx`
- **Description**: SHA-256 password gate protecting the entire app before authentication. Stores unlock state in sessionStorage.

## F-002: Authentication (Supabase Auth)
- **Source**: `src/hooks/useAuth.ts`, `src/pages/Auth.tsx`
- **Tests**: `src/hooks/useAuth.test.ts`, `src/pages/Auth.test.tsx`
- **Description**: Email/password sign-in via Supabase Auth. Screenshot mode with mock user. Session persistence via onAuthStateChange.

## F-003: Landing Page
- **Source**: `src/pages/Landing.tsx`
- **Tests**: `src/pages/Landing.test.tsx`
- **Description**: Public marketing page with feature grid, hero section, sign-in CTA. 6 feature cards.

## F-004: Dashboard (Credit Balances & Alerts)
- **Source**: `src/pages/Dashboard.tsx`, `src/hooks/useDashboardStats.ts`, `src/hooks/useSyncUsage.ts`, `src/hooks/useUsageRecords.ts`
- **Tests**: `src/pages/Dashboard.test.tsx`
- **Description**: Main dashboard showing credit status cards, credit balance list with burn-rate projection, active alerts section, usage sync button.

## F-005: API Inventory
- **Source**: `src/pages/ApiInventory.tsx`, `src/hooks/useApis.ts`
- **Tests**: `src/pages/ApiInventory.test.tsx`
- **Description**: Filterable/searchable API list with status, category, and search filters. Desktop table and mobile card layouts. Quota progress bars.

## F-006: API Detail
- **Source**: `src/pages/ApiDetail.tsx`
- **Tests**: `src/pages/ApiDetail.test.tsx`
- **Description**: Tabbed detail view: Credentials, Subscription, Projects, Health, Alerts. Includes credential reveal/copy/deactivate/delete.

## F-007: API Create/Edit Form
- **Source**: `src/pages/ApiForm.tsx`
- **Tests**: `src/pages/ApiForm.test.tsx`
- **Description**: Create and edit API entries. Form with basic info, endpoints, health check config, billing model, notes.

## F-008: Credential Management (Encrypt/Decrypt)
- **Source**: `src/hooks/useCredentials.ts`
- **Tests**: `src/hooks/useCredentials.test.ts`
- **Description**: AES-256-GCM credential encryption via edge function. Reveal with 30s auto-hide timer. Deactivate and delete credentials.

## F-009: Projects
- **Source**: `src/pages/Projects.tsx`, `src/hooks/useProjects.ts`
- **Tests**: `src/pages/Projects.test.tsx`
- **Description**: Project list with color-coded cards. Create project dialog with name, description, color picker.

## F-010: Project Detail
- **Source**: `src/pages/ProjectDetail.tsx`
- **Tests**: `src/pages/ProjectDetail.test.tsx`
- **Description**: Project overview with stats cards (assigned APIs, total cost, created date). Assign/unassign APIs with env var name.

## F-011: Audit Log
- **Source**: `src/pages/AuditLog.tsx`, `src/hooks/useAuditLog.ts`
- **Tests**: `src/pages/AuditLog.test.tsx`
- **Description**: Paginated audit trail with action type filter. Mobile cards and desktop table layout. 7 action types.

## F-012: Settings (Account & Notifications)
- **Source**: `src/pages/Settings.tsx`, `src/pages/AccountSettings.tsx`, `src/pages/NotificationSettings.tsx`
- **Tests**: `src/pages/Settings.test.tsx`
- **Description**: Settings shell with Account and Notifications sub-tabs. Account shows email/ID and password change form. Notifications shows alert type toggles (currently read-only).

## F-013: Subscriptions
- **Source**: `src/hooks/useSubscriptions.ts`
- **Tests**: `src/hooks/useSubscriptions.test.ts`
- **Description**: CRUD for API subscriptions (plan name, billing cycle, cost, quota, auto-renew).

## F-014: App Layout & Navigation
- **Source**: `src/components/layout/AppLayout.tsx`, `src/components/layout/AppSidebar.tsx`
- **Tests**: `src/components/layout/AppSidebar.test.tsx`
- **Description**: Sidebar navigation with 5 nav items, theme toggle, sign-out. Mobile hamburger menu with overlay. Skip-to-content link.

## F-015: Status Badges
- **Source**: `src/components/shared/StatusBadge.tsx`
- **Tests**: `src/components/shared/StatusBadge.test.tsx`
- **Description**: ApiStatusBadge and HealthStatusBadge components with color-coded labels from constants.

## F-016: Empty State
- **Source**: `src/components/shared/EmptyState.tsx`
- **Tests**: `src/components/shared/EmptyState.test.tsx`
- **Description**: Reusable empty state with icon, title, description, and optional action button.

## F-017: Confirm Dialog
- **Source**: `src/components/shared/ConfirmDialog.tsx`
- **Tests**: `src/components/shared/ConfirmDialog.test.tsx`
- **Description**: Reusable confirmation dialog with title, description, confirm/cancel buttons, destructive variant, loading state.

## F-018: Theme Toggle
- **Source**: `src/components/shared/ThemeToggle.tsx`
- **Tests**: `src/components/shared/ThemeToggle.test.tsx`
- **Description**: Light/dark mode toggle using next-themes. Sun/moon icon transition.

## F-019: Route Announcer
- **Source**: `src/components/shared/RouteAnnouncer.tsx`
- **Tests**: `src/components/shared/RouteAnnouncer.test.tsx`
- **Description**: Screen reader announcements for SPA route changes. Uses aria-live="assertive".

## F-020: Not Found Page
- **Source**: `src/pages/NotFound.tsx`
- **Tests**: `src/pages/NotFound.test.tsx`
- **Description**: 404 page with icon, message, and link back to dashboard.

## F-021: Formatters
- **Source**: `src/lib/formatters.ts`
- **Tests**: `src/lib/formatters.test.ts`
- **Description**: Utility functions: formatCurrency, formatNumber, formatDate, formatDateTime, formatRelativeTime, daysUntil, maskSecret, estimateDaysLeft.

## F-022: Constants
- **Source**: `src/lib/constants.ts`
- **Tests**: `src/lib/constants.test.ts`
- **Description**: Shared constant maps: API_STATUSES (5), HEALTH_STATUSES (5), API_CATEGORIES (10), BILLING_MODELS (6), ALERT_TYPES (6).

## F-023: Utility (cn)
- **Source**: `src/lib/utils.ts`
- **Tests**: `src/lib/utils.test.ts`
- **Description**: Tailwind class merge utility combining clsx and tailwind-merge.
