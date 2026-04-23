import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PASSWORD = 'predivoapidash2026'

async function unlockGate(page: import('@playwright/test').Page) {
  const passwordInput = page.getByPlaceholder('Password')
  if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passwordInput.fill(PASSWORD)
    await page.getByRole('button', { name: 'Unlock' }).click()
    await passwordInput.waitFor({ state: 'hidden', timeout: 5000 })
  }
}

test.describe('Accessibility', () => {
  test('landing page has no critical a11y violations', async ({ page }) => {
    await page.goto('/')
    await unlockGate(page)
    await page.waitForTimeout(500)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Theme-dependent, tested separately
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      )
      console.error('Critical a11y violations:', summary)
    }

    expect(critical).toHaveLength(0)
  })

  test('auth page has no critical a11y violations', async ({ page }) => {
    await page.goto('/auth')
    await unlockGate(page)
    await page.waitForTimeout(500)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(critical).toHaveLength(0)
  })

  test('password gate has no critical a11y violations', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => sessionStorage.clear())
    await page.reload()
    await page.waitForTimeout(500)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(critical).toHaveLength(0)
  })
})
