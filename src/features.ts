/**
 * Feature toggles and the composables each one owns. `addImports` only
 * registers the composables of enabled features, so disabled ones never
 * reach the consuming app's auto-imports.
 */
export const FEATURE_COMPOSABLES = {
  auth: [],
  player: ['usePlayer'],
  friends: ['useFriends'],
  storage: ['usePlayerStorage', 'useConnectedAccounts'],
  entitlements: ['useEntitlements'],
  stripe: ['useStripeCheckout'],
  progression: ['useLeaderboard', 'useWallet', 'useProgression'],
  server: ['useLootLockerServer'],
} as const satisfies Record<string, readonly string[]>

export type FeatureName = keyof typeof FEATURE_COMPOSABLES

export type FeatureToggles = Record<FeatureName, boolean>

export const FEATURE_NAMES = Object.keys(FEATURE_COMPOSABLES) as FeatureName[]

export function defaultFeatures(): FeatureToggles {
  return Object.fromEntries(FEATURE_NAMES.map(name => [name, true])) as FeatureToggles
}

/** Composable names for every enabled feature, in registry order. */
export function enabledComposables(features: Partial<FeatureToggles>): string[] {
  return FEATURE_NAMES.flatMap(name =>
    features[name] === false ? [] : [...FEATURE_COMPOSABLES[name]],
  )
}
