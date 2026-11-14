import type { FeatureToggles } from './features'

export type LootLockerEnvironment = 'development' | 'production'
export type LootLockerMode = 'direct' | 'proxy'
export type LootLockerAuthMethod = 'password' | 'guest' | 'magicLink'
export type LootLockerSessionStore = 'memory' | 'localStorage' | 'cookie'

export interface ModuleOptions {
  /** Game API key. Public: sent from the browser. */
  gameKey: string
  /** White label domain key. Public: sent from the browser. */
  domainKey: string
  /** Server key. Private: only ever present in server runtime config. */
  serverKey: string
  /** Game version sent when starting a session. */
  gameVersion: string
  /** Sent as the `is-development` header on white label calls. */
  environment: LootLockerEnvironment
  /** `direct` calls LootLocker from the browser; `proxy` goes through the Nitro server. */
  mode: LootLockerMode
  /** LootLocker API origin. */
  baseURL: string
  /** Per-feature toggles; disabled features register no composables. */
  features: Partial<FeatureToggles>
  auth: {
    /** Sign-in methods the app offers. */
    methods: LootLockerAuthMethod[]
  }
  session: {
    /** Where the session token is kept. */
    store: LootLockerSessionStore
  }
}

export interface LootLockerPublicRuntimeConfig {
  gameKey: string
  domainKey: string
  gameVersion: string
  environment: LootLockerEnvironment
  mode: LootLockerMode
  baseURL: string
  features: FeatureToggles
  auth: ModuleOptions['auth']
  session: ModuleOptions['session']
}

export interface LootLockerPrivateRuntimeConfig {
  serverKey: string
}
