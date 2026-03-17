import { API_STATUSES, HEALTH_STATUSES, API_CATEGORIES, BILLING_MODELS, ALERT_TYPES } from './constants'

describe('API_STATUSES', () => {
  it('has all expected statuses', () => {
    expect(Object.keys(API_STATUSES)).toEqual(
      expect.arrayContaining(['active', 'inactive', 'deprecated', 'error', 'rate_limited'])
    )
  })

  it('each status has label, color, and bg', () => {
    for (const status of Object.values(API_STATUSES)) {
      expect(status).toHaveProperty('label')
      expect(status).toHaveProperty('color')
      expect(status).toHaveProperty('bg')
    }
  })
})

describe('HEALTH_STATUSES', () => {
  it('has all expected statuses', () => {
    expect(Object.keys(HEALTH_STATUSES)).toEqual(
      expect.arrayContaining(['up', 'down', 'degraded', 'timeout', 'unknown'])
    )
  })

  it('each status has label and color', () => {
    for (const status of Object.values(HEALTH_STATUSES)) {
      expect(status).toHaveProperty('label')
      expect(status).toHaveProperty('color')
    }
  })
})

describe('API_CATEGORIES', () => {
  it('has at least 5 categories', () => {
    expect(Object.keys(API_CATEGORIES).length).toBeGreaterThanOrEqual(5)
  })

  it('each category has label and icon', () => {
    for (const cat of Object.values(API_CATEGORIES)) {
      expect(cat).toHaveProperty('label')
      expect(cat).toHaveProperty('icon')
    }
  })
})

describe('BILLING_MODELS', () => {
  it('includes free and pay_as_you_go', () => {
    expect(BILLING_MODELS.free).toBe('Free')
    expect(BILLING_MODELS.pay_as_you_go).toBe('Pay-as-you-go')
  })
})

describe('ALERT_TYPES', () => {
  it('has all expected alert types', () => {
    expect(Object.keys(ALERT_TYPES)).toEqual(
      expect.arrayContaining(['quota_warning', 'health_alert', 'key_expiration'])
    )
  })

  it('each alert type has label and description', () => {
    for (const alert of Object.values(ALERT_TYPES)) {
      expect(alert).toHaveProperty('label')
      expect(alert).toHaveProperty('description')
    }
  })
})
