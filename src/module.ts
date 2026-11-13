import { existsSync } from 'node:fs'
import { addImports, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'
import { defaultFeatures, enabledComposables } from './features'
import type { FeatureToggles } from './features'

export type { FeatureName, FeatureToggles } from './features'

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

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    lootlocker: LootLockerPublicRuntimeConfig
  }
  interface RuntimeConfig {
    lootlocker: LootLockerPrivateRuntimeConfig
  }
}

export const DEFAULT_BASE_URL = 'https://api.lootlocker.com'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@gwynhokkers/nuxt-lootlocker',
    configKey: 'lootlocker',
  },
  defaults: {
    gameKey: '',
    domainKey: '',
    serverKey: '',
    gameVersion: '1.0.0',
    environment: 'development',
    mode: 'direct',
    baseURL: DEFAULT_BASE_URL,
    features: {},
    auth: { methods: ['password', 'guest', 'magicLink'] },
    session: { store: 'localStorage' },
  },
  setup(options, nuxt) {
    const logger = useLogger('nuxt-lootlocker')
    const { resolve } = createResolver(import.meta.url)

    const features: FeatureToggles = { ...defaultFeatures(), ...options.features }
    const { serverKey, ...rest } = options

    // Env vars (NUXT_PUBLIC_LOOTLOCKER_*, NUXT_LOOTLOCKER_SERVER_KEY) override these.
    nuxt.options.runtimeConfig.public.lootlocker = defu(
      nuxt.options.runtimeConfig.public.lootlocker,
      { ...rest, features },
    ) as LootLockerPublicRuntimeConfig
    nuxt.options.runtimeConfig.lootlocker = defu(
      nuxt.options.runtimeConfig.lootlocker,
      { serverKey },
    ) as LootLockerPrivateRuntimeConfig

    if (!options.gameKey && !nuxt.options._prepare) {
      logger.warn('No `lootlocker.gameKey` set; set it in nuxt.config.ts or NUXT_PUBLIC_LOOTLOCKER_GAME_KEY.')
    }

    // Composables arrive milestone by milestone; register only those that
    // exist on disk and whose feature is enabled.
    addImports(
      enabledComposables(features)
        .map(name => ({ name, from: resolve(`./runtime/composables/${name}`) }))
        .filter(entry => ['.ts', '.js', '.mjs'].some(ext => existsSync(entry.from + ext))),
    )
  },
})
