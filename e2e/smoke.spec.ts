import { test, expect } from '@playwright/test'

const PASSWORD = 'predivoapidash2026'

async function unlockGate(page: import('@playwright/test').Page) {
  const passwordInput = page.getByPlaceholder('Password')
  if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passwordInput.fill(PASSWORD)
    await page.getByRole('button', { name: 'Unlock' }).click()
    await passwordInput.waitFor({ state: 'hidden', timeout: 5000 })
  }
}

test.describe('Smoke Tests', () => {
  test('landing page loads and shows hero', async ({ page }) => {
    await page.goto('/')
    await unlockGate(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('API Management')
  })

  test('landing page has sign-in link', async ({ page }) => {
    await page.goto('/')
    await unlockGate(page)
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('auth page loads and shows form', async ({ page }) => {
    await page.goto('/auth')
    await unlockGate(page)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist')
    await unlockGate(page)
    // Should eventually show not found or redirect to auth
    await expect(
      page.getByText('Page not found').or(page.getByText('Welcome back'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('no console errors on landing page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await unlockGate(page)
    await page.waitForTimeout(1000)
    // Filter out known non-critical errors (e.g., favicon, Supabase connection)
    const critical = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('supabase') && !e.includes('ERR_CONNECTION')
    )
    expect(critical).toHaveLength(0)
  })
})
