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

test.describe('Password Gate', () => {
  test('shows password form initially', async ({ page }) => {
    // Clear sessionStorage to ensure gate is locked
    await page.goto('/')
    await page.evaluate(() => sessionStorage.clear())
    await page.reload()
    await expect(page.getByText('Predivo APIs')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
  })

  test('rejects wrong password', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => sessionStorage.clear())
    await page.reload()
    await page.getByPlaceholder('Password').fill('wrong')
    await page.getByRole('button', { name: 'Unlock' }).click()
    await expect(page.getByText('Incorrect password')).toBeVisible()
  })

  test('unlocks with correct password', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => sessionStorage.clear())
    await page.reload()
    await page.getByPlaceholder('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Unlock' }).click()
    await expect(page.getByPlaceholder('Password')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Landing Page Features', () => {
  test('displays all 6 feature cards', async ({ page }) => {
    await page.goto('/')
    await unlockGate(page)
    const features = [
      'Credential Management',
      'Health Monitoring',
      'Cost Tracking',
      'Project Organization',
      'Audit Trail',
      'Security First',
    ]
    for (const feature of features) {
      await expect(page.getByText(feature)).toBeVisible()
    }
  })

  test('Get started button links to auth', async ({ page }) => {
    await page.goto('/')
    await unlockGate(page)
    const link = page.getByRole('link', { name: 'Get started' })
    await expect(link).toHaveAttribute('href', '/auth')
  })
})

test.describe('Auth Page Features', () => {
  test('shows email and password fields with correct types', async ({ page }) => {
    await page.goto('/auth')
    await unlockGate(page)
    const emailInput = page.getByLabel('Email')
    const passwordInput = page.getByLabel('Password')
    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('shows encryption notice', async ({ page }) => {
    await page.goto('/auth')
    await unlockGate(page)
    await expect(page.getByText('AES-256 encryption')).toBeVisible()
  })
})
