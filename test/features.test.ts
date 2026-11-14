import { describe, it, expect } from 'vitest'
import { defaultFeatures, enabledComposables, FEATURE_NAMES } from '../src/features'

describe('feature toggles', () => {
  it('enables every feature by default', () => {
    const features = defaultFeatures()
    expect(Object.keys(features)).toEqual(FEATURE_NAMES)
    expect(Object.values(features).every(Boolean)).toBe(true)
  })

  it('lists composables for enabled features only', () => {
    const all = enabledComposables(defaultFeatures())
    expect(all).toContain('usePlayer')
    expect(all).toContain('useEntitlements')

    const without = enabledComposables({ ...defaultFeatures(), entitlements: false, stripe: false })
    expect(without).not.toContain('useEntitlements')
    expect(without).not.toContain('useStripeCheckout')
    expect(without).toContain('usePlayer')
  })

  it('treats unspecified features as enabled', () => {
    expect(enabledComposables({})).toEqual(enabledComposables(defaultFeatures()))
  })
})
