// Scrapes the Anthropic Console billing page for the credit balance
// Uses session cookie for authentication — no Playwright needed if internal API works
// Falls back to Playwright if the API approach fails

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_SESSION_KEY = process.env.ANTHROPIC_SESSION_KEY
const ORG_UUID = '49a44d35-9078-4532-8178-b2c9d55550fa' // Predivo GmbH

async function getBalanceViaPlaywright() {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  // Set the session cookie
  await context.addCookies([{
    name: 'sessionKey',
    value: ANTHROPIC_SESSION_KEY,
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
    await browser.close()
    return balance

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

  console.log(`Supabase updated: credit_snapshots.balance = $${balance.toFixed(2)}, subscriptions.credits_remaining = $${balance.toFixed(2)}`)
}

async function main() {
  if (!ANTHROPIC_SESSION_KEY) {
    console.error('ANTHROPIC_SESSION_KEY not set')
    process.exit(1)
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_KEY not set')
    process.exit(1)
  }

  console.log('Scraping Anthropic Console billing page...')
  const balance = await getBalanceViaPlaywright()
  console.log(`Credit balance: $${balance.toFixed(2)}`)

  await updateSupabase(balance)

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
