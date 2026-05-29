// Scrapes the GitHub Budgets page for the Actions budget amount.
// Uses session cookie for authentication + headless Playwright.
// Updates BackOffice api_subscriptions.balance_initial with the real budget.

const GITHUB_SESSION_KEY = process.env.GITHUB_SESSION_KEY
const BACKOFFICE_SUPABASE_URL = process.env.BACKOFFICE_SUPABASE_URL
const BACKOFFICE_SERVICE_KEY = process.env.BACKOFFICE_SERVICE_KEY

async function scrapeGitHubBudget() {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  await context.addCookies([
    {
      name: 'user_session',
      value: GITHUB_SESSION_KEY,
      domain: 'github.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: '__Host-user_session_same_site',
      value: GITHUB_SESSION_KEY,
      domain: 'github.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
    },
    {
      name: 'logged_in',
      value: 'yes',
      domain: '.github.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: 'dotcom_user',
      value: 'Arivioo',
      domain: '.github.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ])

  const page = await context.newPage()

  try {
    await page.goto('https://github.com/settings/billing/budgets', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })

    // Wait for the budget content to render (look for "budget" text)
    try {
      await page.waitForSelector('text=budget', { timeout: 15000 })
    } catch {
      // Take debug screenshot before failing
      await page.screenshot({ path: 'github-budgets-debug.png', fullPage: true })
      const url = page.url()
      throw new Error(`Budget content not found. Page URL: ${url} — likely not authenticated. Screenshot saved.`)
    }
    await page.waitForTimeout(2000)

    // Extract all budget entries from the page
    const budgets = await page.evaluate(() => {
      const text = document.body.innerText
      const entries = []

      // Split by "Account\nArivioo" to get individual budget blocks
      const blocks = text.split(/Account\s*\n\s*Arivioo/)
      for (const block of blocks) {
        const productMatch = block.match(/Product\s*\n\s*([\w\s]+?)(?:\s*\n|$)/)
          || block.match(/SKU\s*\n\s*([\w\s]+?)(?:\s*\n|$)/)
        const spentMatch = block.match(/\$([\d,.]+)\s*spent/)
        const budgetMatch = block.match(/\$([\d,.]+)\s*budget/)

        if (budgetMatch) {
          entries.push({
            product: productMatch ? productMatch[1].trim() : 'Unknown',
            spent: spentMatch ? parseFloat(spentMatch[1].replace(',', '')) : 0,
            budget: parseFloat(budgetMatch[1].replace(',', '')),
          })
        }
      }

      return entries
    })

    if (!budgets.length) {
      await page.screenshot({ path: 'github-budgets-debug.png', fullPage: true })
      throw new Error('Could not find any budgets on page. Screenshot saved.')
    }

    console.log('Found budgets:', JSON.stringify(budgets, null, 2))

    const actionsBudget = budgets.find(b => b.product === 'Actions')
    if (!actionsBudget) {
      throw new Error('Actions budget not found among: ' + budgets.map(b => b.product).join(', '))
    }

    console.log(`GitHub Actions budget: $${actionsBudget.budget.toFixed(2)}`)
    await browser.close()
    return actionsBudget

  } catch (err) {
    await browser.close()
    throw err
  }
}

async function updateBackOffice(actionsBudget) {
  if (!BACKOFFICE_SUPABASE_URL || !BACKOFFICE_SERVICE_KEY) {
    console.log('Skipping BackOffice update (env vars not set)')
    return
  }

  // Find the GitHub Actions api_entry_id
  const apiRes = await fetch(
    `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_entries?name=eq.GitHub%20Actions&select=id`,
    {
      headers: {
        'apikey': BACKOFFICE_SERVICE_KEY,
        'Authorization': `Bearer ${BACKOFFICE_SERVICE_KEY}`,
      },
    }
  )
  const apis = await apiRes.json()
  if (!apis.length) throw new Error('GitHub Actions not found in BackOffice api_entries')

  const apiEntryId = apis[0].id

  // Update balance_initial (budget) in api_subscriptions
  const res = await fetch(
    `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_subscriptions?api_entry_id=eq.${apiEntryId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': BACKOFFICE_SERVICE_KEY,
        'Authorization': `Bearer ${BACKOFFICE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        balance_initial: actionsBudget.budget,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to update BackOffice: ${err}`)
  }

  console.log(`BackOffice updated: api_subscriptions.balance_initial = $${actionsBudget.budget.toFixed(2)}`)
}

async function main() {
  if (!GITHUB_SESSION_KEY) {
    console.error('GITHUB_SESSION_KEY not set')
    process.exit(1)
  }

  console.log('Scraping GitHub Budgets page...')
  const actionsBudget = await scrapeGitHubBudget()
  console.log(`Actions: $${actionsBudget.spent.toFixed(2)} spent of $${actionsBudget.budget.toFixed(2)} budget`)

  await updateBackOffice(actionsBudget)

  // Output for GitHub Actions
  const output = process.env.GITHUB_OUTPUT
  if (output) {
    const fs = await import('fs')
    fs.appendFileSync(output, `budget=${actionsBudget.budget.toFixed(2)}\n`)
    fs.appendFileSync(output, `spent=${actionsBudget.spent.toFixed(2)}\n`)
  }
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})
