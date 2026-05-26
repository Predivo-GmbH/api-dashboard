// Scrapes the Google Payments Center for the Gemini API prepay credit balance.
// Uses Google session cookies for authentication.
// Strategy 1: Raw HTTP fetch with cookie header (no browser detection)
// Strategy 2: Stealth Playwright with anti-detection measures
// Strategy 3: AI Studio billing page (fallback)

import { createHash } from 'crypto'

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

const PAYMENTS_CENTER_URL = 'https://payments.google.com/gp/w/u/0/home/accountdetail?ebaid=AJ9oCCwmjClYI5gp05ak3oYotGJomztFrdKC5hXIiviIbqyQpeHmVFWeLV7OZm3s2tyWruaTGBzM'
const AI_STUDIO_BILLING_URL = 'https://aistudio.google.com/billing'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function buildCookieHeader() {
  const parts = []
  if (GOOGLE_SID) parts.push(`SID=${GOOGLE_SID}`)
  if (GOOGLE_HSID) parts.push(`HSID=${GOOGLE_HSID}`)
  if (GOOGLE_SSID) parts.push(`SSID=${GOOGLE_SSID}`)
  if (GOOGLE_APISID) parts.push(`APISID=${GOOGLE_APISID}`)
  if (GOOGLE_SAPISID) parts.push(`SAPISID=${GOOGLE_SAPISID}`)
  if (GOOGLE_SECURE_1PSID) parts.push(`__Secure-1PSID=${GOOGLE_SECURE_1PSID}`)
  if (GOOGLE_SECURE_3PSID) parts.push(`__Secure-3PSID=${GOOGLE_SECURE_3PSID}`)
  if (GOOGLE_SAPISID) parts.push(`__Secure-3PAPISID=${GOOGLE_SAPISID}`)
  return parts.join('; ')
}

function computeSapisidHash(origin) {
  const timestamp = Math.floor(Date.now() / 1000)
  const input = `${timestamp} ${GOOGLE_SAPISID} ${origin}`
  const hash = createHash('sha1').update(input).digest('hex')
  return `SAPISIDHASH ${timestamp}_${hash}`
}

function extractBalance(html) {
  // Try multiple patterns to find CHF balance
  const patterns = [
    /CHF\s+(\d+[.,]\d{2})/,
    /Credit balance[\s\S]*?(\d+[.,]\d{2})/,
    /(\d+[.,]\d{2})\s*CHF/,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'))
      if (!isNaN(val) && val > 0 && val < 100000) return val
    }
  }
  return null
}

// ── Strategy 1: Raw HTTP with cookies (no browser = no detection) ──
async function fetchViaHttp() {
  console.log('Strategy 1: Raw HTTP fetch with cookies...')
  try {
    const res = await fetch(PAYMENTS_CENTER_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        'Cookie': buildCookieHeader(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    console.log(`  HTTP status: ${res.status}`)
    console.log(`  Final URL: ${res.url}`)

    if (res.url.includes('accounts.google.com')) {
      console.log('  Redirected to login — cookies insufficient for raw HTTP')
      return null
    }

    const html = await res.text()
    console.log(`  Response length: ${html.length} chars`)
    console.log(`  First 300 chars: ${html.substring(0, 300)}`)

    const balance = extractBalance(html)
    if (balance) {
      console.log(`  Balance found: CHF ${balance.toFixed(2)}`)
      return { balance, currency: 'CHF' }
    }

    console.log('  Could not extract balance from HTML')
    return null
  } catch (err) {
    console.log(`  HTTP fetch failed: ${err.message}`)
    return null
  }
}

// ── Strategy 2: Stealth Playwright with session warm-up ──
async function fetchViaStealth() {
  console.log('Strategy 2: Stealth Playwright...')
  const { chromium } = await import('playwright')

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })

  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'Europe/Zurich',
    permissions: [],
    bypassCSP: true,
  })

  // Anti-detection: remove webdriver flag and other automation indicators
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'de'] })
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
    // Override chrome.runtime to look like a real browser
    window.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}) }
  })

  // Set all cookies
  const base = { domain: '.google.com', path: '/' }
  const cookies = []
  if (GOOGLE_SID) cookies.push({ ...base, name: 'SID', value: GOOGLE_SID, httpOnly: false, secure: false, sameSite: 'Lax' })
  if (GOOGLE_HSID) cookies.push({ ...base, name: 'HSID', value: GOOGLE_HSID, httpOnly: true, secure: false, sameSite: 'Lax' })
  if (GOOGLE_SSID) cookies.push({ ...base, name: 'SSID', value: GOOGLE_SSID, httpOnly: true, secure: true, sameSite: 'Lax' })
  if (GOOGLE_APISID) cookies.push({ ...base, name: 'APISID', value: GOOGLE_APISID, httpOnly: false, secure: false, sameSite: 'Lax' })
  if (GOOGLE_SAPISID) {
    cookies.push({ ...base, name: 'SAPISID', value: GOOGLE_SAPISID, httpOnly: false, secure: true, sameSite: 'Lax' })
    cookies.push({ ...base, name: '__Secure-3PAPISID', value: GOOGLE_SAPISID, httpOnly: false, secure: true, sameSite: 'None' })
    cookies.push({ ...base, name: '__Secure-1PAPISID', value: GOOGLE_SAPISID, httpOnly: true, secure: true, sameSite: 'Lax' })
  }
  if (GOOGLE_SECURE_1PSID) cookies.push({ ...base, name: '__Secure-1PSID', value: GOOGLE_SECURE_1PSID, httpOnly: true, secure: true, sameSite: 'Lax' })
  if (GOOGLE_SECURE_3PSID) cookies.push({ ...base, name: '__Secure-3PSID', value: GOOGLE_SECURE_3PSID, httpOnly: true, secure: true, sameSite: 'None' })

  await context.addCookies(cookies)

  try {
    // Warm-up: visit google.com first to let Google set derived cookies (SIDCC etc.)
    console.log('  Warming up session on google.com...')
    const warmupPage = await context.newPage()
    await warmupPage.goto('https://www.google.com/', { waitUntil: 'networkidle', timeout: 15000 })
    await warmupPage.waitForTimeout(2000)

    // Check if we're authenticated by looking for account info
    const isLoggedIn = await warmupPage.evaluate(() => {
      return document.querySelector('a[aria-label*="Google Account"]') !== null ||
             document.querySelector('[data-ogsr-up]') !== null ||
             document.cookie.includes('SIDCC')
    })
    console.log(`  Logged in after warmup: ${isLoggedIn}`)

    // Grab any new cookies Google set (SIDCC, etc.)
    const allCookies = await context.cookies()
    const sidcc = allCookies.find(c => c.name === 'SIDCC')
    console.log(`  SIDCC cookie present: ${!!sidcc}`)

    await warmupPage.close()

    // Now navigate to Payments Center
    console.log('  Navigating to Payments Center...')
    const page = await context.newPage()
    await page.goto(PAYMENTS_CENTER_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    const finalUrl = page.url()
    console.log(`  Final URL: ${finalUrl}`)
    console.log(`  Page title: ${await page.title()}`)

    if (finalUrl.includes('accounts.google.com')) {
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200))
      console.log(`  Login page detected: ${bodyText}`)
      await page.screenshot({ path: 'gemini-payments-debug.png', fullPage: true })
      await page.close()
      await browser.close()
      return null
    }

    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log(`  Page text (first 500): ${bodyText.substring(0, 500)}`)

    const balance = extractBalance(bodyText)
    if (balance) {
      console.log(`  Balance found: CHF ${balance.toFixed(2)}`)
      await page.close()
      await browser.close()
      return { balance, currency: 'CHF' }
    }

    await page.screenshot({ path: 'gemini-payments-debug.png', fullPage: true })
    console.log('  Could not extract balance')
    await page.close()
    await browser.close()
    return null
  } catch (err) {
    console.log(`  Stealth Playwright failed: ${err.message}`)
    await browser.close()
    return null
  }
}

// ── Strategy 3: AI Studio billing with SAPISIDHASH API call ──
async function fetchViaAiStudioApi() {
  console.log('Strategy 3: AI Studio API with SAPISIDHASH...')
  try {
    const origin = 'https://aistudio.google.com'
    const authHeader = computeSapisidHash(origin)

    // Try known Google internal API patterns for billing/credit data
    const endpoints = [
      'https://alkalimakersuite-pa.clients6.google.com/$rpc/google.internal.alkali.applications.makersuite.v1.MakerSuiteService/GetBillingInfo',
      'https://alkalimakersuite-pa.clients6.google.com/$rpc/google.internal.alkali.applications.makersuite.v1.MakerSuiteService/GetCreditBalance',
      'https://alkalimakersuite-pa.clients6.google.com/$rpc/google.internal.alkali.applications.makersuite.v2.MakerSuiteService/GetBillingInfo',
    ]

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Cookie': buildCookieHeader(),
            'Content-Type': 'application/json',
            'Origin': origin,
            'Referer': `${origin}/billing`,
            'User-Agent': USER_AGENT,
            'X-Goog-Authuser': '0',
          },
          body: '{}',
        })

        console.log(`  ${endpoint.split('/').pop()}: HTTP ${res.status}`)

        if (res.ok || res.status === 200) {
          const text = await res.text()
          console.log(`  Response (first 500): ${text.substring(0, 500)}`)
          // Try to find a balance/credit amount in the response
          const amountMatch = text.match(/(\d+\.\d{2})/g)
          if (amountMatch) {
            for (const amt of amountMatch) {
              const val = parseFloat(amt)
              if (val > 1 && val < 1000) {
                console.log(`  Potential balance: ${val}`)
                return { balance: val, currency: 'CHF' }
              }
            }
          }
        }
      } catch (e) {
        console.log(`  ${endpoint.split('/').pop()}: ${e.message}`)
      }
    }

    // Fallback: Try loading AI Studio billing page in stealth Playwright
    console.log('  Trying AI Studio billing page in browser...')
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    })
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1920, height: 1080 },
    })

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })

    const base = { domain: '.google.com', path: '/' }
    const cookies = []
    if (GOOGLE_SID) cookies.push({ ...base, name: 'SID', value: GOOGLE_SID, httpOnly: false, secure: false, sameSite: 'Lax' })
    if (GOOGLE_HSID) cookies.push({ ...base, name: 'HSID', value: GOOGLE_HSID, httpOnly: true, secure: false, sameSite: 'Lax' })
    if (GOOGLE_SSID) cookies.push({ ...base, name: 'SSID', value: GOOGLE_SSID, httpOnly: true, secure: true, sameSite: 'Lax' })
    if (GOOGLE_APISID) cookies.push({ ...base, name: 'APISID', value: GOOGLE_APISID, httpOnly: false, secure: false, sameSite: 'Lax' })
    if (GOOGLE_SAPISID) {
      cookies.push({ ...base, name: 'SAPISID', value: GOOGLE_SAPISID, httpOnly: false, secure: true, sameSite: 'Lax' })
      cookies.push({ ...base, name: '__Secure-3PAPISID', value: GOOGLE_SAPISID, httpOnly: false, secure: true, sameSite: 'None' })
    }
    if (GOOGLE_SECURE_1PSID) cookies.push({ ...base, name: '__Secure-1PSID', value: GOOGLE_SECURE_1PSID, httpOnly: true, secure: true, sameSite: 'Lax' })
    if (GOOGLE_SECURE_3PSID) cookies.push({ ...base, name: '__Secure-3PSID', value: GOOGLE_SECURE_3PSID, httpOnly: true, secure: true, sameSite: 'None' })
    await context.addCookies(cookies)

    // Warm up on google.com
    const warmup = await context.newPage()
    await warmup.goto('https://www.google.com/', { waitUntil: 'networkidle', timeout: 15000 })
    await warmup.waitForTimeout(2000)
    await warmup.close()

    const page = await context.newPage()

    let interceptedBalance = null
    page.on('response', async (response) => {
      const url = response.url()
      // Only intercept actual API responses, never login/redirect pages
      if (url.includes('accounts.google.com')) return
      if (url.includes('clients6.google.com') || url.includes('alkali')) {
        try {
          const text = await response.text()
          const amounts = text.match(/\d+\.\d{2}/g)
          if (amounts) {
            for (const amt of amounts) {
              const val = parseFloat(amt)
              if (val > 1 && val < 1000 && !interceptedBalance) {
                interceptedBalance = val
                console.log(`  API interception: found ${val} in ${url.substring(0, 80)}`)
              }
            }
          }
        } catch {}
      }
    })

    await page.goto(AI_STUDIO_BILLING_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(5000)

    console.log(`  AI Studio Final URL: ${page.url()}`)
    console.log(`  AI Studio Page title: ${await page.title()}`)

    if (!page.url().includes('accounts.google.com')) {
      const text = await page.evaluate(() => document.body.innerText)
      console.log(`  AI Studio text (first 500): ${text.substring(0, 500)}`)
      const balance = extractBalance(text)
      if (balance) {
        await page.close()
        await browser.close()
        return { balance, currency: 'CHF' }
      }
    }

    // Only trust intercepted balance if we actually reached the billing page (not login)
    if (interceptedBalance && !page.url().includes('accounts.google.com')) {
      await page.close()
      await browser.close()
      return { balance: interceptedBalance, currency: 'CHF' }
    }

    if (interceptedBalance) {
      console.log(`  Discarding intercepted value ${interceptedBalance} — landed on login page`)
    }

    await page.screenshot({ path: 'gemini-aistudio-debug.png', fullPage: true })
    await page.close()
    await browser.close()
    return null
  } catch (err) {
    console.log(`  AI Studio strategy failed: ${err.message}`)
    return null
  }
}

async function updateSupabase(balance, currency) {
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const apiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/api_entries?name=eq.Google%20Gemini&select=id`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
    )
    const apis = await apiRes.json()
    if (apis.length) {
      await fetch(`${SUPABASE_URL}/rest/v1/credit_snapshots?api_entry_id=eq.${apis[0].id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ balance, currency, snapshot_at: new Date().toISOString(), notes: `Auto-scraped ${new Date().toISOString()}` }),
      })
      await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?api_entry_id=eq.${apis[0].id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ credits_remaining: balance }),
      })
      console.log(`APIs Supabase updated: ${currency} ${balance.toFixed(2)}`)
    }
  }

  if (BACKOFFICE_SUPABASE_URL && BACKOFFICE_SERVICE_KEY) {
    const boApiRes = await fetch(
      `${BACKOFFICE_SUPABASE_URL}/rest/v1/api_entries?name=eq.Google%20Gemini&select=id`,
      { headers: { 'apikey': BACKOFFICE_SERVICE_KEY, 'Authorization': `Bearer ${BACKOFFICE_SERVICE_KEY}` } }
    )
    const boApis = await boApiRes.json()
    if (boApis.length) {
      const boRes = await fetch(`${BACKOFFICE_SUPABASE_URL}/rest/v1/api_subscriptions?api_entry_id=eq.${boApis[0].id}`, {
        method: 'PATCH',
        headers: { 'apikey': BACKOFFICE_SERVICE_KEY, 'Authorization': `Bearer ${BACKOFFICE_SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ balance_override: balance, balance_override_updated_at: new Date().toISOString() }),
      })
      if (boRes.ok) console.log(`BackOffice updated: ${currency} ${balance.toFixed(2)}`)
      else console.error(`BackOffice update failed: ${await boRes.text()}`)
    }
  }
}

async function main() {
  if (!GOOGLE_SID || !GOOGLE_SAPISID) {
    console.error('GOOGLE_SID and/or GOOGLE_SAPISID not set')
    process.exit(1)
  }

  let result = null

  // Strategy 1: Raw HTTP (fastest, no browser detection)
  result = await fetchViaHttp()

  // Strategy 2: Stealth Playwright with session warm-up
  if (!result) result = await fetchViaStealth()

  // Strategy 3: AI Studio API + browser fallback
  if (!result) result = await fetchViaAiStudioApi()

  if (!result) {
    console.error('All 3 strategies failed. Check debug screenshots.')
    process.exit(1)
  }

  console.log(`\nFinal balance: ${result.currency} ${result.balance.toFixed(2)}`)
  await updateSupabase(result.balance, result.currency)

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
