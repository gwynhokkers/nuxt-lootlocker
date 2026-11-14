import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, useTestContext } from '@nuxt/test-utils/e2e'

describe('lootlocker module options', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/options', import.meta.url)),
  })

  const config = () => useTestContext().nuxt!.options.runtimeConfig

  it('puts gameKey and domainKey in public runtime config', () => {
    expect(config().public.lootlocker).toMatchObject({ gameKey: 'game-key', domainKey: 'domain-key' })
  })

  it('keeps serverKey in private runtime config only', () => {
    expect(config().lootlocker.serverKey).toBe('server-key')
    expect(config().public.lootlocker).not.toHaveProperty('serverKey')
  })

  it('applies defaults', () => {
    expect(config().public.lootlocker).toMatchObject({
      baseURL: 'https://api.lootlocker.com',
      environment: 'development',
      mode: 'direct',
      session: { store: 'localStorage' },
    })
  })

  it('merges feature toggles over the all-enabled defaults', () => {
    const { features } = config().public.lootlocker
    expect(features.stripe).toBe(false)
    expect(features.player).toBe(true)
  })

  it('auto-imports useLootLocker without leaking the session token into the SSR payload', async () => {
    const html = await $fetch<string>('/')
    expect(html).toContain('has-token')
    expect(html).not.toContain('secret-token')
  })
})
