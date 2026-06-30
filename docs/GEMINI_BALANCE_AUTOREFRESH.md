# Gemini balance — auto-refresh & dashboard staleness

**Last updated:** 2026-06-30
**Owner:** Roger
**Scope:** How the Google Gemini prepay credit balance gets onto the BackOffice API
dashboard, why it works the way it does, and how to operate/troubleshoot it.

---

## TL;DR

- The BackOffice dashboard tile **"Google Gemini · Balance"** shows the Gemini API
  **prepay credit balance** (currently CHF 20.83).
- That number is refreshed automatically **every 4 hours** by a **local Windows
  Scheduled Task** on Roger's machine (`GeminiBalanceScrape`). **Cost: zero.**
- The old "Scrape session expiring / log in" banner is **gone**. Each balance now
  shows either **"Updated X ago"** (fresh) or **"⚠ Couldn't auto-update — balance may
  be inaccurate"** (stale). No expiry dates, no countdowns.

---

## Why it can't be done server-side (the core constraint)

Google exposes the AI Studio **prepay credit balance only in the logged-in AI Studio
UI** — there is **no API** for it (the Cloud Billing API returns metadata, not the
prepay credit). And the number renders inside a **cross-origin
`payments.google.com` iframe** embedded in the AI Studio billing page.

Consequences:
- The dashboard's server-side **"Sync Now"** edge function (`sync-usage`) **cannot**
  read it — it has no Google login.
- The dashboard's own client-side JS **cannot** read it — the iframe is cross-origin
  (CORS), and a bookmarklet on the AI Studio page can't reach the Payments iframe
  either.
- A **GitHub Actions** scraper **cannot** reliably read it — a datacenter IP can't
  hold Roger's Google session, *and* it would burn Actions minutes (cost).

The **only** thing that can read it is **a browser already logged into Roger's
Google account**. Automation tools (Playwright) *can* read across the iframe
boundary, unlike page JS — which is what makes the local task possible.

---

## The Gemini account facts (don't re-litigate these)

- **Tracked account:** `rogmueller1976@gmail.com` (PRO). Project **BenchmarkSignal**
  (`gen-lang-client-0086755396`), billing account `0190BA-3B6902-9AC226`,
  **Prepay**, credit balance ~CHF 20.83 (CHF 25 added 2026-05-12, auto-reload off).
- **NOT** `lakeviewer1976@gmail.com` — that's a separate **Postpay** account
  (`gen-lang-client-0258338980`, CHF 0.00). The old CI scraper pointed here by
  mistake. Ignore it.
- In the **dedicated Chrome** (see below), `rogmueller1976` is at account index
  **`/u/1/`** (and `lakeviewer1976` at `/u/0/`). The scraper hardcodes `/u/1/` and
  additionally only trusts the **"Credit balance" / "Prepay"** wording, so it can
  never accidentally read the postpay account's "Your balance CHF 0.00".

---

## How the auto-refresh works

```
Windows Scheduled Task "GeminiBalanceScrape"  (every 4h, runs as Roger when logged on)
        └─ C:\Users\roger_rwjnmnz\.gemini-scrape\run-scrape.cmd
               └─ node  api-dashboard\scripts\scrape-gemini-local.mjs
                      ├─ connectOverCDP("http://127.0.0.1:9222")   ← the dedicated Chrome
                      ├─ open a NEW tab → aistudio.google.com/u/1/billing?project=...
                      ├─ read "Credit balance" CHF from the payments.google.com iframe
                      ├─ PATCH BackOffice api_subscriptions.balance_override (+ _updated_at)
                      └─ close ONLY that tab (never Roger's tabs, never the browser)
```

Key design points:
- It **reuses the dedicated Chrome already running on port 9222**
  (profile `C:\Users\roger_rwjnmnz\.claude-chrome-profile`, already logged into
  `rogmueller1976`). No separate browser, no separate login.
- It uses **system Chrome** via Playwright `channel: 'chrome'` (no chromium download).
- On any failure (Chrome not running, login lapsed, layout change) it **writes
  nothing and exits non-zero** — so the dashboard honestly shows "may be inaccurate"
  rather than a stale-but-confident number.

### Files & locations

| What | Path |
|---|---|
| Scraper script (in repo, version-controlled, **no secrets**) | `C:\Business\Internal Projects\api-dashboard\scripts\scrape-gemini-local.mjs` |
| Task wrapper (.cmd) | `C:\Users\roger_rwjnmnz\.gemini-scrape\run-scrape.cmd` |
| Config / secrets (gitignored, **outside repo**) | `C:\Users\roger_rwjnmnz\.gemini-scrape\config.env` |
| Run log | `C:\Users\roger_rwjnmnz\.gemini-scrape\scrape.log` |
| Dedicated Chrome profile | `C:\Users\roger_rwjnmnz\.claude-chrome-profile` (port 9222) |
| Node | `C:\Program Files\nodejs\node.exe` |

`config.env` contents:
```
BACKOFFICE_SUPABASE_URL=https://xoecpzfsskalvjrtcbbl.supabase.co
BACKOFFICE_SERVICE_KEY=<BackOffice service-role key — see BackOffice/docs/Credentials.txt>
```

### Schedule

- Task name: **`GeminiBalanceScrape`**
- Every **4 hours**, aligned to midnight (00/04/08/12/16/20 local).
- Runs as the logged-on user (needs the interactive session for Chrome).

---

## Operating it

```powershell
# See recent runs
Get-Content "$env:USERPROFILE\.gemini-scrape\scrape.log" -Tail 15

# Run it right now (on demand)
schtasks /Run /TN "GeminiBalanceScrape"

# Pause / resume
schtasks /Change /TN "GeminiBalanceScrape" /DISABLE
schtasks /Change /TN "GeminiBalanceScrape" /ENABLE

# Inspect the task
schtasks /Query /TN "GeminiBalanceScrape" /FO LIST /V

# Remove it entirely
schtasks /Delete /TN "GeminiBalanceScrape" /F
```

Manual run without the task (same effect):
```powershell
cd "C:\Business\Internal Projects\api-dashboard"
& "C:\Program Files\nodejs\node.exe" scripts\scrape-gemini-local.mjs
```

A healthy run logs:
```
=== Gemini local scrape start (CDP http://127.0.0.1:9222) ===
Opening billing page in a new tab...
Balance read: CHF 20.83
BackOffice updated: CHF 20.83 ✓
=== done ===
```

---

## Troubleshooting

| Symptom in log | Cause | Fix |
|---|---|---|
| `Cannot connect to dedicated Chrome on …:9222` | The dedicated Chrome isn't running | Launch it: `"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/Users/roger_rwjnmnz/.claude-chrome-profile" --no-first-run --no-default-browser-check "about:blank"` |
| `NOT_LOGGED_IN …` | The dedicated Chrome's Google session lapsed | In that Chrome, open AI Studio and sign back in as `rogmueller1976` |
| `Prepay credit balance not found …` | Page layout changed, slow load, or wrong account at `/u/1/` | Open `aistudio.google.com/u/1/billing` in the dedicated Chrome and confirm it shows `rogmueller1976` + "Credit balance"; adjust the `/u/N/` index in the script if account order changed |
| `BackOffice PATCH failed …` | Service key/URL wrong in `config.env` | Refresh from `BackOffice/docs/Credentials.txt` |

**Manual override anytime:** the dashboard tile has a pencil-edit — click it and type
a number to set the balance by hand (writes the same `balance_override`).

---

## The dashboard UI change (BackOffice repo)

- **Repo:** `C:\Business\Internal Projects\BackOffice` (deploys to
  backoffice.predivo.ch on push to `main`).
- **Commits:**
  - `2b56308` — removed the "scrape session expiring/expired — log in" banner, the
    `useExpiringScrapeSessions` hook, and the `SCRAPE_LOGIN_URLS` map; added a
    `balanceStale` flag (computed in the data layer) and a per-balance indicator:
    fresh → "Updated X ago", stale → "⚠ Couldn't auto-update — balance may be
    inaccurate". Threshold = 4h (`BALANCE_STALE_MS` in `src/hooks/useApiDashboard.ts`).
  - `52058a7` — show that indicator for progress-bar balances too (Gemini has a
    `balance_initial`, so it renders a bar; the indicator was previously hidden for it).
- **Files:** `src/pages/ApiDashboard.tsx`, `src/hooks/useApiDashboard.ts`.
- The DB column `api_entries.scrape_session_expires_at` is now **dead data** (UI
  ignores it).

### Relevant DB (BackOffice Supabase `xoecpzfsskalvjrtcbbl`)

- `api_entries` "Google Gemini" id: `a5b95c4c-5dfc-47c4-8fcf-84af5ebc5d7f`
- `api_subscriptions` row id: `387e1a36-eb95-4207-813a-b133f265c2b9`
  (fields written: `balance_override`, `balance_override_updated_at`)

---

## Status of the old CI scraper

`scripts/scrape-gemini-balance.mjs` + `.github/workflows/scrape-gemini-balance.yml`
still exist but are effectively **dead** for Gemini (cookie injection can't hold a
Google login from CI). They can be retired. The Anthropic CI scraper
(`scrape-anthropic-balance.mjs`) still works and self-refreshes every 2h — leave it.
