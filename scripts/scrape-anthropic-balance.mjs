// Scrapes the Anthropic Console billing page for the credit balance
// Uses session cookie for authentication — no Playwright needed if internal API works
// Falls back to Playwright if the API approach fails

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_SESSION_KEY = process.env.ANTHROPIC_SESSION_KEY
const BACKOFFICE_SUPABASE_URL = process.env.BACKOFFICE_SUPABASE_URL
const BACKOFFICE_SERVICE_KEY = process.env.BACKOFFICE_SERVICE_KEY
const ORG_UUID = '49a44d35-9078-4532-8178-b2c9d55550fa' // Predivo GmbH

// ── Self-refreshing session cookie ──
// The cookie is stored in BackOffice api_entries.scrape_session_cookie and rolled
// forward on every run from the server's fresh Set-Cookie. The GitHub secret
// ANTHROPIC_SESSION_KEY is only the one-time bootstrap seed.
async function loadStoredCookie() {
  if (!BACKOFFICE_SUPABASE_URL || !BACKOFFICE_SERVICE_KEY) return null
  try {
    const res = await fetch(
      `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_entries?name=eq.Anthropic%20Claude&select=scrape_session_cookie`,
      { headers: { apikey: BACKOFFICE_SERVICE_KEY, Authorization: `Bearer ${BACKOFFICE_SERVICE_KEY}` } }
    )
    const rows = await res.json()
    const stored = rows?.[0]?.scrape_session_cookie
    return stored && stored.length > 20 ? stored : null
  } catch (e) {
    console.warn(`Could not load stored cookie: ${e.message}`)
    return null
  }
}

async function saveStoredCookie(cookie, expiresAt) {
  if (!BACKOFFICE_SUPABASE_URL || !BACKOFFICE_SERVICE_KEY || !cookie) return
  try {
    const res = await fetch(
      `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_entries?name=eq.Anthropic%20Claude`,
      {
        method: 'PATCH',
        headers: {
          apikey: BACKOFFICE_SERVICE_KEY,
          Authorization: `Bearer ${BACKOFFICE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ scrape_session_cookie: cookie, scrape_session_expires_at: expiresAt }),
      }
    )
    if (res.ok) console.log(`Session cookie refreshed in BackOffice (expires ${expiresAt})`)
    else console.warn(`Failed to save refreshed cookie: ${await res.text()}`)
  } catch (e) {
    console.warn(`Could not save refreshed cookie: ${e.message}`)
  }
}

async function getBalanceViaPlaywright(sessionCookie) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  // Set the session cookie
  await context.addCookies([{
    name: 'sessionKey',
    value: sessionCookie,
    domain: 'platform.claude.com',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }])

  const page = await context.newPage()

  try {
    await page.goto('https://platform.claude.com/settings/billing', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Wait for the balance to render
    await page.waitForTimeout(3000)

    // Look for the balance text — it's displayed as "$X.XX" with "Remaining balance" below it
    const balanceText = await page.evaluate(() => {
      // Strategy 1: Find element containing dollar amount near "Remaining balance"
      const allText = document.body.innerText
      const match = allText.match(/\$(\d+\.\d{2})\s*\n?\s*Remaining balance/)
      if (match) return match[1]

      // Strategy 2: Find by heading structure
      const headings = document.querySelectorAll('h1, h2, h3, p, span, div')
      for (const el of headings) {
        const text = el.textContent?.trim() ?? ''
        if (/^\$\d+\.\d{2}$/.test(text)) {
          // Check if sibling/parent mentions "remaining" or "balance"
          const parent = el.parentElement
          if (parent && /remaining|balance/i.test(parent.textContent ?? '')) {
            return text.replace('$', '')
          }
        }
      }

      return null
    })

    if (!balanceText) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'anthropic-billing-debug.png', fullPage: true })
      throw new Error('Could not find balance on page. Screenshot saved.')
    }

    const balance = parseFloat(balanceText)
    if (isNaN(balance)) {
      throw new Error(`Parsed balance is NaN: "${balanceText}"`)
    }

    console.log(`Balance found: $${balance.toFixed(2)}`)

    // Self-refresh: read the (server-refreshed) sessionKey cookie back out so we can persist it.
    // Anthropic re-issues the cookie on each request, rolling its ~7-day expiry forward.
    let freshCookie = null
    let expiresAt = null
    try {
      const all = await context.cookies('https://platform.claude.com')
      const sk = all.find(c => c.name === 'sessionKey')
      if (sk && sk.value) {
        freshCookie = sk.value
        expiresAt = sk.expires && sk.expires > 0
          ? new Date(sk.expires * 1000).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    } catch (e) {
      console.warn(`Could not read refreshed cookie: ${e.message}`)
    }

    await browser.close()
    return { balance, freshCookie, expiresAt }

  } catch (err) {
    await browser.close()
    throw err
  }
}

async function updateSupabase(balance) {
  // Get the Anthropic Claude api_entry_id
  const apiRes = await fetch(
    `${SUPABASE_URL}/rest/v1/api_entries?name=eq.Anthropic%20Claude&select=id`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  )
  const apis = await apiRes.json()
  if (!apis.length) throw new Error('Anthropic Claude not found in api_entries')

  const apiEntryId = apis[0].id

  // Upsert credit_snapshots
  const upsertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/credit_snapshots?api_entry_id=eq.${apiEntryId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        balance,
        snapshot_at: new Date().toISOString(),
        notes: `Auto-scraped from Console at ${new Date().toISOString()}`,
      }),
    }
  )

  if (!upsertRes.ok) {
    const err = await upsertRes.text()
    throw new Error(`Failed to update credit_snapshots: ${err}`)
  }

  // Also update subscriptions.credits_remaining directly
  const subRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?api_entry_id=eq.${apiEntryId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        credits_remaining: balance,
      }),
    }
  )

  if (!subRes.ok) {
    const err = await subRes.text()
    throw new Error(`Failed to update subscription: ${err}`)
  }

  console.log(`APIs Supabase updated: credit_snapshots.balance = $${balance.toFixed(2)}, subscriptions.credits_remaining = $${balance.toFixed(2)}`)

  // Update BackOffice dashboard (api_subscriptions.balance_override)
  if (BACKOFFICE_SUPABASE_URL && BACKOFFICE_SERVICE_KEY) {
    const boApiRes = await fetch(
      `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_entries?name=eq.Anthropic%20Claude&select=id`,
      {
        headers: {
          'apikey': BACKOFFICE_SERVICE_KEY,
          'Authorization': `Bearer ${BACKOFFICE_SERVICE_KEY}`,
        },
      }
    )
    const boApis = await boApiRes.json()
    if (boApis.length) {
      const boRes = await fetch(
        `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_subscriptions?api_entry_id=eq.${boApis[0].id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': BACKOFFICE_SERVICE_KEY,
            'Authorization': `Bearer ${BACKOFFICE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            balance_override: balance,
            balance_override_updated_at: new Date().toISOString(),
          }),
        }
      )
      if (boRes.ok) {
        console.log(`BackOffice updated: api_subscriptions.balance_override = $${balance.toFixed(2)}`)
      } else {
        const boErr = await boRes.text()
        console.error(`Warning: Failed to update BackOffice: ${boErr}`)
      }
    } else {
      console.warn('Warning: Anthropic Claude not found in BackOffice api_entries')
    }
  } else {
    console.log('Skipping BackOffice update (BACKOFFICE_SUPABASE_URL not set)')
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_KEY not set')
    process.exit(1)
  }

  // Prefer the self-refreshed cookie stored in BackOffice; fall back to the bootstrap secret.
  const storedCookie = await loadStoredCookie()
  const sessionCookie = storedCookie || ANTHROPIC_SESSION_KEY
  if (!sessionCookie) {
    console.error('No session cookie available (neither stored nor ANTHROPIC_SESSION_KEY)')
    process.exit(1)
  }
  console.log(`Using ${storedCookie ? 'stored (self-refreshed)' : 'bootstrap secret'} session cookie`)

  console.log('Scraping Anthropic Console billing page...')
  const { balance, freshCookie, expiresAt } = await getBalanceViaPlaywright(sessionCookie)
  console.log(`Credit balance: $${balance.toFixed(2)}`)

  await updateSupabase(balance)

  // Persist the refreshed cookie so the session never expires as long as the scrape runs.
  if (freshCookie) await saveStoredCookie(freshCookie, expiresAt)

  // Output for GitHub Actions
  const output = process.env.GITHUB_OUTPUT
  if (output) {
    const fs = await import('fs')
    fs.appendFileSync(output, `balance=${balance.toFixed(2)}\n`)
  }
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})
