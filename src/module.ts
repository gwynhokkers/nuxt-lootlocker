import { existsSync } from 'node:fs'
import { addImports, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'
import { defaultFeatures, enabledComposables } from './runtime/features'
import type { FeatureToggles } from './runtime/features'
import type { LootLockerPrivateRuntimeConfig, LootLockerPublicRuntimeConfig, ModuleOptions } from './runtime/types'

export type { FeatureName, FeatureToggles } from './runtime/features'

export type {
  LootLockerAuthMethod,
  LootLockerEnvironment,
  LootLockerMode,
  LootLockerPrivateRuntimeConfig,
  LootLockerPublicRuntimeConfig,
  LootLockerSessionStore,
  ModuleOptions,
} from './runtime/types'

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
    addImports({ name: 'LootLockerError', from: resolve('./runtime/errors') })
  },
})
