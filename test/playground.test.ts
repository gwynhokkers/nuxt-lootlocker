import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { hasNuxtModule } from '@nuxt/kit'
import { setup, $fetch, useTestContext } from '@nuxt/test-utils/e2e'

describe('playground app with the lootlocker module installed', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  it('registers the module', () => {
    expect(hasNuxtModule('@gwynhokkers/nuxt-lootlocker', useTestContext().nuxt)).toBe(true)
  })

  it('server-renders the index page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Nuxt LootLocker playground')
  })
})
