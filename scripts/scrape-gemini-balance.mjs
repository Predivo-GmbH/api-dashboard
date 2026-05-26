// Scrapes the Google Payments Center for the Gemini API prepay credit balance.
// Uses Google session cookies for authentication.
// Primary: Payments Center (payments.google.com) — shows CHF balance directly.
// Fallback: AI Studio billing (aistudio.google.com/billing) — shows available credits.

const GOOGLE_SID = process.env.GOOGLE_SID
const GOOGLE_APISID = process.env.GOOGLE_APISID
const GOOGLE_SAPISID = process.env.GOOGLE_SAPISID
const GOOGLE_HSID = process.env.GOOGLE_HSID
const GOOGLE_SSID = process.env.GOOGLE_SSID
const GOOGLE_SECURE_1PSID = process.env.GOOGLE_SECURE_1PSID
const GOOGLE_SECURE_3PSID = process.env.GOOGLE_SECURE_3PSID
const BACKOFFICE_SUPABASE_URL = process.env.BACKOFFICE_SUPABASE_URL
const BACKOFFICE_SERVICE_KEY = process.env.BACKOFFICE_SERVICE_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

// Payments Center account detail URL (Cloud Prepay 0190BA-3B6902-9AC226)
const PAYMENTS_CENTER_URL = 'https://payments.google.com/gp/w/u/0/home/accountdetail?ebaid=AJ9oCCwmjClYI5gp05ak3oYotGJomztFrdKC5hXIiviIbqyQpeHmVFWeLV7OZm3s2tyWruaTGBzM'
const AI_STUDIO_BILLING_URL = 'https://aistudio.google.com/billing'

function getGoogleCookies() {
  const cookies = []
  const base = { domain: '.google.com', path: '/' }

  if (GOOGLE_SID) {
    cookies.push({ ...base, name: 'SID', value: GOOGLE_SID, httpOnly: false, secure: false, sameSite: 'Lax' })
  }
  if (GOOGLE_HSID) {
    cookies.push({ ...base, name: 'HSID', value: GOOGLE_HSID, httpOnly: true, secure: false, sameSite: 'Lax' })
  }
  if (GOOGLE_SSID) {
    cookies.push({ ...base, name: 'SSID', value: GOOGLE_SSID, httpOnly: true, secure: true, sameSite: 'Lax' })
  }
  if (GOOGLE_APISID) {
    cookies.push({ ...base, name: 'APISID', value: GOOGLE_APISID, httpOnly: false, secure: false, sameSite: 'Lax' })
  }
  if (GOOGLE_SAPISID) {
    cookies.push({ ...base, name: 'SAPISID', value: GOOGLE_SAPISID, httpOnly: false, secure: true, sameSite: 'Lax' })
    cookies.push({ ...base, name: '__Secure-3PAPISID', value: GOOGLE_SAPISID, httpOnly: false, secure: true, sameSite: 'None' })
  }
  if (GOOGLE_SECURE_1PSID) {
    cookies.push({ ...base, name: '__Secure-1PSID', value: GOOGLE_SECURE_1PSID, httpOnly: true, secure: true, sameSite: 'Lax' })
  }
  if (GOOGLE_SECURE_3PSID) {
    cookies.push({ ...base, name: '__Secure-3PSID', value: GOOGLE_SECURE_3PSID, httpOnly: true, secure: true, sameSite: 'None' })
  }

  return cookies
}

async function scrapePaymentsCenter(context) {
  console.log('Strategy 1: Scraping Payments Center...')
  const page = await context.newPage()

  try {
    await page.goto(PAYMENTS_CENTER_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    await page.waitForTimeout(3000)

    // Debug: log the final URL and page title
    console.log(`  Final URL: ${page.url()}`)
    console.log(`  Page title: ${await page.title()}`)
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500))
    console.log(`  Page text (first 500 chars): ${bodyText}`)

    const balanceText = await page.evaluate(() => {
      const allText = document.body.innerText

      // Look for "CHF X.XX" pattern near "Credit balance"
      const chfMatch = allText.match(/CHF\s+(\d+[.,]\d{2})/)
      if (chfMatch) return { amount: chfMatch[1].replace(',', '.'), currency: 'CHF' }

      // Fallback: look for any currency amount near "Credit balance"
      const creditSection = allText.match(/Credit balance[\s\S]*?([A-Z]{3})\s+(\d+[.,]\d{2})/)
      if (creditSection) return { amount: creditSection[2].replace(',', '.'), currency: creditSection[1] }

      return null
    })

    if (balanceText) {
      const balance = parseFloat(balanceText.amount)
      if (!isNaN(balance)) {
        console.log(`Payments Center: ${balanceText.currency} ${balance.toFixed(2)}`)
        await page.close()
        return { balance, currency: balanceText.currency }
      }
    }

    await page.screenshot({ path: 'gemini-payments-debug.png', fullPage: true })
    await page.close()
    console.log('Payments Center: Could not extract balance. Screenshot saved.')
    return null
  } catch (err) {
    console.log(`Payments Center failed: ${err.message}`)
    try { await page.close() } catch {}
    return null
  }
}

async function scrapeAiStudioBilling(context) {
  console.log('Strategy 2: Scraping AI Studio billing page...')
  const page = await context.newPage()

  let interceptedBalance = null

  // API interception: catch internal RPC responses that might contain balance data
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('clients6.google.com') || url.includes('alkali') || url.includes('billing')) {
      try {
        const text = await response.text()
        // Look for credit/balance amounts in JSON or protobuf-like responses
        const amountMatch = text.match(/"(?:balance|credits?|amount)"[:\s]*(\d+\.?\d*)/i)
        if (amountMatch) {
          const val = parseFloat(amountMatch[1])
          if (val > 0 && val < 100000) {
            interceptedBalance = val
            console.log(`API interception: found balance ${val} in ${url.substring(0, 80)}`)
          }
        }
      } catch {}
    }
  })

  try {
    await page.goto(AI_STUDIO_BILLING_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    await page.waitForTimeout(5000)

    // Debug: log the final URL and page title
    console.log(`  Final URL: ${page.url()}`)
    console.log(`  Page title: ${await page.title()}`)
    const aiBodyText = await page.evaluate(() => document.body.innerText.substring(0, 500))
    console.log(`  Page text (first 500 chars): ${aiBodyText}`)

    // DOM scraping: look for credit balance text
    const domBalance = await page.evaluate(() => {
      const allText = document.body.innerText

      // "Available credits" or "Credit balance" followed by a dollar/CHF amount
      const patterns = [
        /Available credits[\s\S]*?(?:CHF|\$|USD)\s*(\d+[.,]\d{2})/i,
        /Credit balance[\s\S]*?(?:CHF|\$|USD)\s*(\d+[.,]\d{2})/i,
        /(?:CHF|\$)\s*(\d+[.,]\d{2})[\s\S]*?(?:available|remaining|balance)/i,
        /(\d+[.,]\d{2})\s*(?:CHF|USD)[\s\S]*?(?:available|remaining|balance)/i,
      ]

      for (const pattern of patterns) {
        const match = allText.match(pattern)
        if (match) return match[1].replace(',', '.')
      }

      // Look for any prominent dollar/CHF amount
      const elements = document.querySelectorAll('h1, h2, h3, [class*="balance"], [class*="credit"]')
      for (const el of elements) {
        const text = el.textContent?.trim() ?? ''
        const amountMatch = text.match(/(?:CHF|\$)\s*(\d+[.,]\d{2})/)
        if (amountMatch) return amountMatch[1].replace(',', '.')
      }

      return null
    })

    if (domBalance) {
      const balance = parseFloat(domBalance)
      if (!isNaN(balance)) {
        console.log(`AI Studio DOM: CHF ${balance.toFixed(2)}`)
        await page.close()
        return { balance, currency: 'CHF' }
      }
    }

    // Fall back to intercepted API response
    if (interceptedBalance !== null) {
      console.log(`AI Studio API interception: ${interceptedBalance}`)
      await page.close()
      return { balance: interceptedBalance, currency: 'CHF' }
    }

    await page.screenshot({ path: 'gemini-aistudio-debug.png', fullPage: true })
    await page.close()
    console.log('AI Studio: Could not extract balance. Screenshot saved.')
    return null
  } catch (err) {
    console.log(`AI Studio failed: ${err.message}`)
    try { await page.close() } catch {}
    return null
  }
}

async function updateSupabase(balance, currency) {
  // Update APIs Supabase (credit_snapshots + subscriptions)
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const apiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/api_entries?name=eq.Google%20Gemini&select=id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )
    const apis = await apiRes.json()

    if (apis.length) {
      const apiEntryId = apis[0].id

      await fetch(
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
            currency,
            snapshot_at: new Date().toISOString(),
            notes: `Auto-scraped from Google at ${new Date().toISOString()}`,
          }),
        }
      )

      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?api_entry_id=eq.${apiEntryId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ credits_remaining: balance }),
        }
      )

      console.log(`APIs Supabase updated: balance = ${currency} ${balance.toFixed(2)}`)
    } else {
      console.log('Google Gemini not found in APIs Supabase api_entries — skipping')
    }
  }

  // Update BackOffice dashboard (api_subscriptions.balance_override)
  if (BACKOFFICE_SUPABASE_URL && BACKOFFICE_SERVICE_KEY) {
    const boApiRes = await fetch(
      `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_entries?name=eq.Google%20Gemini&select=id`,
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
        console.log(`BackOffice updated: api_subscriptions.balance_override = ${currency} ${balance.toFixed(2)}`)
      } else {
        const err = await boRes.text()
        console.error(`Warning: Failed to update BackOffice: ${err}`)
      }
    } else {
      console.warn('Warning: Google Gemini not found in BackOffice api_entries')
    }
  } else {
    console.log('Skipping BackOffice update (BACKOFFICE_SUPABASE_URL not set)')
  }
}

async function main() {
  if (!GOOGLE_SID || !GOOGLE_SAPISID) {
    console.error('GOOGLE_SID and/or GOOGLE_SAPISID not set')
    process.exit(1)
  }

  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  await context.addCookies(getGoogleCookies())

  let result = null

  // Strategy 1: Payments Center (primary)
  result = await scrapePaymentsCenter(context)

  // Strategy 2: AI Studio billing (fallback)
  if (!result) {
    result = await scrapeAiStudioBilling(context)
  }

  await browser.close()

  if (!result) {
    console.error('All scraping strategies failed. Check debug screenshots.')
    process.exit(1)
  }

  console.log(`Final balance: ${result.currency} ${result.balance.toFixed(2)}`)

  await updateSupabase(result.balance, result.currency)

  // Output for GitHub Actions
  const output = process.env.GITHUB_OUTPUT
  if (output) {
    const fs = await import('fs')
    fs.appendFileSync(output, `balance=${result.balance.toFixed(2)}\n`)
    fs.appendFileSync(output, `currency=${result.currency}\n`)
  }
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})
