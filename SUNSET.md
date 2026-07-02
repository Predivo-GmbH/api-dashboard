# API Dashboard (apis.predivo.ch) — SUNSET (2026-07-02)

**Status:** Decommissioned. This is an archived project, not an active one.

## Why
The internal API credit-balance monitor was integrated into **Predivo BackOffice** (API-Verwaltung page, `api_*` tables, migrations 034/036/038/065/068). The standalone product was never publicly launched (password gate + TOTP). Decision by Roger, 2026-07-02.

## What was deleted
- Subdomain + web space `apis.predivo.ch` (Metanet/Plesk)
- Supabase project `pjsxzjjhlwjqpkvsopuj` — **account `api@predivo.ch` kept: it still hosts Beize Jass Tour** (`dkxdlovwzsxnepoteebk`), and `SUPABASE_TOKEN_API` in production-monitor stays for that reason
- All monitoring: production-monitor commit `81e465c` (env, keep-alive workflow + spec, auth-email guard, auto-heal/auto-fix, tests/apis, workflow-presence)
- predivo.ch product page `/products/api-dashboard` (commit in predivo, URL intentionally 404)
- codebase-memory index entries (both clones)
- Redundant second clone `C:\Business\Internal Projects\api-dashboard` (same repo, same HEAD `201bb58`, clean tree — deleted, not archived)

## What was archived (before deletion)
- `docs\db-final-schema-2026-07-02.sql` (25 KB), `docs\db-final-data-2026-07-02.sql` (38 KB), `docs\db-final-auth-data-2026-07-02.sql`
- No storage buckets existed (verified via `storage.objects`)
- `C:\Business\Archive\api-dashboard-git-history-2026-07-02.bundle` — complete history (verified)
- `C:\Business\Archive\APIs-final-2026-07-02.zip` — full working copy incl. `.git` (verified, no node_modules)

## Notes
- The repo's `scrape-anthropic-balance` GitHub workflow (6-hourly Anthropic-console scrape) and the in-project `sync-usage` cron die with repo archival / project deletion — their output only fed this dashboard.
- DB password was reset 2026-07-02 for the final dump (none was on file); recorded in `docs\Credentials.txt`. Invalid once the Supabase project is deleted.

## GitHub
Repo `Arivioo/api-dashboard` is **archived** (read-only), not deleted.
