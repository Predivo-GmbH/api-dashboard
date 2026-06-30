// Local Gemini balance scraper — runs on Roger's machine via a 4-hour Windows
// Scheduled Task. It connects over CDP to the ALREADY-RUNNING dedicated Chrome
// (the one Claude drives, remote-debugging port 9222, persistent profile already
// logged into Google rogmueller1976). No separate profile, no separate login.
//
// Why a browser at all: Google only exposes the AI Studio prepay credit balance in
// the logged-in UI (no API), and the number renders inside a cross-origin
// payments.google.com iframe — which Playwright can read across origins.
//
// Reads:  AI Studio billing page at /u/1/ (rogmueller1976's account index in the
//         dedicated Chrome; /u/0/ there is lakeviewer1976, the wrong postpay one).
// Writes: BackOffice api_subscriptions.balance_override (+ _updated_at).
//
// It opens a NEW tab and closes only that tab — it never touches Roger's other tabs
// and never closes the browser. If port 9222 isn't up (dedicated Chrome not running)
// it exits non-zero and writes nothing, so the dashboard honestly shows "may be
// inaccurate" until the next successful run.
//
// Config (NO secrets in this file) is read from ~/.gemini-scrape/config.env:
//   BACKOFFICE_SUPABASE_URL=...
//   BACKOFFICE_SERVICE_KEY=...

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { chromium } from 'playwright'

const HOME = homedir()
const BASE_DIR = join(HOME, '.gemini-scrape')
const ENV_FILE = join(BASE_DIR, 'config.env')
const LOG_FILE = join(BASE_DIR, 'scrape.log')

const CDP_ENDPOINT = process.env.GEMINI_CDP || 'http://127.0.0.1:9222'
const BILLING_URL = 'https://aistudio.google.com/u/1/billing?project=gen-lang-client-0086755396'

if (!existsSync(BASE_DIR)) mkdirSync(BASE_DIR, { recursive: true })

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  try { appendFileSync(LOG_FILE, line + '\n') } catch { /* best-effort */ }
}

// Load config.env (KEY=VALUE per line) into process.env if not already set.
if (existsSync(ENV_FILE)) {
  for (const raw of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

const BACKOFFICE_SUPABASE_URL = process.env.BACKOFFICE_SUPABASE_URL
const BACKOFFICE_SERVICE_KEY = process.env.BACKOFFICE_SERVICE_KEY

// Parse a Swiss-formatted amount: "20.83", "1'234.56", "1,234.56".
function parseAmount(raw) {
  let s = String(raw).replace(/[\s']/g, '')
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '')      // , = thousands
  else if (s.includes(',')) s = s.replace(',', '.')                    // , = decimal
  const v = parseFloat(s)
  return (!isNaN(v) && v >= 0 && v < 100000) ? v : null
}

// Only trust the PREPAY "Credit balance" figure (rogmueller1976). The postpay
// account (lakeviewer1976) shows "Your balance" / "Postpay" instead — guard against
// accidentally reading that by requiring the prepay markers.
function extractPrepayBalance(text) {
  if (!/Credit balance/i.test(text) && !/Prepay/i.test(text)) return null
  const patterns = [
    /Credit balance[\s\S]{0,80}?CHF\s*([\d'.,]+)/i,
    /CHF\s*([\d'.,]+)[\s\S]{0,80}?Prepay/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      const v = parseAmount(m[1])
      if (v !== null) return v
    }
  }
  return null
}

async function readBalance(context) {
  const page = await context.newPage()
  try {
    log('Opening billing page in a new tab...')
    await page.goto(BILLING_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })

    const deadline = Date.now() + 40000
    let balance = null
    let sawLogin = false
    while (Date.now() < deadline && balance === null) {
      if (page.url().includes('accounts.google.com')) { sawLogin = true; break }
      for (const frame of page.frames()) {
        if (frame.url().includes('accounts.google.com')) { sawLogin = true; continue }
        let text = ''
        try { text = await frame.evaluate(() => (document.body ? document.body.innerText : '')) } catch { /* detached */ }
        const b = extractPrepayBalance(text)
        if (b !== null) { balance = b; break }
      }
      if (balance === null) await page.waitForTimeout(1500)
    }

    const finalUrl = page.url()
    if (sawLogin || finalUrl.includes('accounts.google.com')) {
      throw new Error('NOT_LOGGED_IN — dedicated Chrome session lost the Google login. Log back into rogmueller1976 in it.')
    }
    if (balance === null) {
      throw new Error('Prepay credit balance not found (layout change, slow load, or wrong account at /u/1/).')
    }
    return balance
  } finally {
    await page.close().catch(() => {})
  }
}

async function updateBackOffice(balance) {
  if (!BACKOFFICE_SUPABASE_URL || !BACKOFFICE_SERVICE_KEY) {
    throw new Error('Missing BACKOFFICE_SUPABASE_URL / BACKOFFICE_SERVICE_KEY in ~/.gemini-scrape/config.env')
  }
  const headers = {
    apikey: BACKOFFICE_SERVICE_KEY,
    Authorization: `Bearer ${BACKOFFICE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
  const idRes = await fetch(
    `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_entries?name=eq.Google%20Gemini&select=id`,
    { headers }
  )
  const apis = await idRes.json()
  if (!Array.isArray(apis) || apis.length === 0) throw new Error('Google Gemini api_entry not found')

  const res = await fetch(
    `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_subscriptions?api_entry_id=eq.${apis[0].id}`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        balance_override: balance,
        balance_override_updated_at: new Date().toISOString(),
      }),
    }
  )
  if (!res.ok) throw new Error(`BackOffice PATCH failed: ${res.status} ${await res.text()}`)
}

async function main() {
  log(`=== Gemini local scrape start (CDP ${CDP_ENDPOINT}) ===`)
  let browser
  try {
    browser = await chromium.connectOverCDP(CDP_ENDPOINT, { timeout: 10000 })
  } catch (err) {
    throw new Error(`Cannot connect to dedicated Chrome on ${CDP_ENDPOINT} — is it running? (${err.message})`)
  }
  try {
    const context = browser.contexts()[0]
    if (!context) throw new Error('No browser context on the dedicated Chrome')
    const balance = await readBalance(context)
    log(`Balance read: CHF ${balance.toFixed(2)}`)
    await updateBackOffice(balance)
    log(`BackOffice updated: CHF ${balance.toFixed(2)} ✓`)
  } finally {
    // connectOverCDP: this only disconnects our client; it does NOT close Roger's Chrome.
    await browser.close().catch(() => {})
  }
  log('=== done ===')
}

main().catch(err => {
  log(`FAILED: ${err.message}`)
  process.exit(1)
})
