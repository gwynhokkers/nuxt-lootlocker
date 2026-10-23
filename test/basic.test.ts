import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('nuxt app with the lootlocker module installed', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('server-renders the index page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })
})
