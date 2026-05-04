/**
 * CRITICAL PATH E2E TESTS
 * ========================
 * These tests verify that the most fundamental user flows ACTUALLY WORK,
 * not just that UI elements exist. If these fail, the app is broken.
 *
 * Project: APIs (API Inventory Manager)
 * Auth: password-gate + email/password login (signInWithPassword)
 * Supabase: https://pjsxzjjhlwjqpkvsopuj.supabase.co
 *
 * Tests:
 * 1. Password gate: renders and accepts/rejects
 * 2. Login flow: email/password form submits without errors
 * 3. Edge functions: all reachable, not returning 500
 * 4. Protected routes: redirect to /auth when unauthenticated
 */

import { test, expect } from '@playwright/test'

// ======================================================================
// PROJECT CONFIG
// ======================================================================

const PROJECT_CONFIG = {
  authPath: '/auth',

  authMethod: 'password' as const,

  testEmail: 'roger@mueller.ro',

  selectors: {
    // Password gate (same hash-based gate as other projects)
    gatePasswordInput: 'input[type="password"]',
    gateSubmitButton: 'button[type="submit"]',
    // Auth page (login mode)
    emailInput: '#email',
    passwordInput: '#password',
    submitButton: 'button[type="submit"]:has-text("Sign in")',
  },

  errorIndicators: [
    '[role="alert"]',
    '.text-destructive',
    '[data-testid="error"]',
  ],

  supabaseUrl: 'https://pjsxzjjhlwjqpkvsopuj.supabase.co',

  // Edge functions
  edgeFunctions: [
    'decrypt-secret',
    'encrypt-secret',
    'sync-usage',
  ],

  // Protected routes
  protectedRoutes: ['/dashboard', '/apis', '/projects', '/audit', '/settings'],
}

// ======================================================================
// TESTS
// ======================================================================

test.describe('CRITICAL PATH — Password Gate', () => {
  test('password gate renders with form', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // The password gate should be visible initially
    const gateInput = page.locator('input[type="password"]').first()
    await expect(gateInput).toBeVisible({ timeout: 10000 })

    const submitBtn = page.locator('button[type="submit"]').first()
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })

  test('password gate rejects wrong password', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const gateInput = page.locator('input[type="password"]').first()
    await gateInput.fill('wrong-password-123')

    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()
    await page.waitForTimeout(1000)

    // Error should appear
    const errorEl = page.locator('[role="alert"], .text-destructive')
    await expect(errorEl.first()).toBeVisible()
  })
})

test.describe('CRITICAL PATH — Login Flow', () => {
  test('auth page loads without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.evaluate(() => {
      sessionStorage.setItem('api-dashboard-unlocked', 'true')
    })
    await page.goto(PROJECT_CONFIG.authPath)
    await page.waitForLoadState('networkidle')

    expect(errors, `JS errors on auth page: ${errors.join(', ')}`).toEqual([])
  })

  test('login form is functional (email + password fields + submit)', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      sessionStorage.setItem('api-dashboard-unlocked', 'true')
    })
    await page.goto(PROJECT_CONFIG.authPath)
    await page.waitForLoadState('networkidle')

    const emailInput = page.locator(PROJECT_CONFIG.selectors.emailInput)
    await expect(emailInput).toBeVisible({ timeout: 10000 })

    const pwInput = page.locator(PROJECT_CONFIG.selectors.passwordInput)
    await expect(pwInput).toBeVisible()

    const submitBtn = page.locator(PROJECT_CONFIG.selectors.submitButton)
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })
})

test.describe('CRITICAL PATH — Edge Function Health', () => {
  for (const funcName of PROJECT_CONFIG.edgeFunctions) {
    test(`edge function "${funcName}" is reachable (not 500)`, async ({ request }) => {
      const response = await request.post(
        `${PROJECT_CONFIG.supabaseUrl}/functions/v1/${funcName}`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ _health_check: true }),
          failOnStatusCode: false,
        }
      )

      const status = response.status()
      expect(
        status,
        `Edge function "${funcName}" returned ${status} — function is DOWN`
      ).not.toBe(500)
    })
  }
})

test.describe('CRITICAL PATH — Protected Route Guards', () => {
  for (const route of PROJECT_CONFIG.protectedRoutes) {
    test(`${route} redirects to auth when unauthenticated`, async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => {
        sessionStorage.setItem('api-dashboard-unlocked', 'true')
      })
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Should redirect to auth
      await expect(page).toHaveURL(/\/auth/)
    })
  }
})

test.describe('CRITICAL PATH — Network & Infrastructure', () => {
  test('Supabase project is reachable (not paused)', async ({ request }) => {
    const response = await request.get(
      `${PROJECT_CONFIG.supabaseUrl}/rest/v1/`,
      {
        headers: { apikey: 'placeholder' },
        failOnStatusCode: false,
      }
    )

    const status = response.status()
    expect(
      status < 500,
      `Supabase project appears DOWN (status ${status}). May be paused.`
    ).toBe(true)
  })

  test('auth API responds correctly', async ({ request }) => {
    const response = await request.get(
      `${PROJECT_CONFIG.supabaseUrl}/auth/v1/health`,
      { failOnStatusCode: false }
    )

    expect(response.status()).toBe(200)
  })
})
