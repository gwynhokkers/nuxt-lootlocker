import { useNuxtApp, useRuntimeConfig } from '#imports'
import { createClient } from '../client'
import type { FetchLike, LootLockerClient } from '../client'
import type { LootLockerPublicRuntimeConfig } from '../types'

interface SessionHolder {
  token: string | null
}

// Held per Nuxt app, outside `useState`, so the token is never serialised
// into the SSR payload. INK-417 replaces this with the pluggable store.
const holders = new WeakMap<object, SessionHolder>()

export interface UseLootLocker extends LootLockerClient {
  client: LootLockerClient
  getSessionToken: () => string | null
  setSessionToken: (token: string | null) => void
  clearSession: () => void
}

/** Low-level access to the LootLocker API. Higher-level composables build on this. */
export function useLootLocker(): UseLootLocker {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig().public.lootlocker as LootLockerPublicRuntimeConfig

  let holder = holders.get(nuxtApp)
  if (!holder) holders.set(nuxtApp, holder = { token: null })
  const session = holder

  const client = createClient({
    baseURL: config.baseURL,
    domainKey: config.domainKey,
    environment: config.environment,
    getSessionToken: () => session.token,
    fetch: $fetch as unknown as FetchLike,
  })

  return {
    ...client,
    client,
    getSessionToken: () => session.token,
    setSessionToken: (token) => { session.token = token },
    clearSession: () => { session.token = null },
  }
}
