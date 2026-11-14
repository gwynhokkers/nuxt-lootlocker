import { describe, it, expect, vi } from 'vitest'
import { createClient } from '../src/runtime/client'
import type { ClientOptions, FetchLike } from '../src/runtime/client'
import { endpoints } from '../src/runtime/endpoints'
import { LootLockerError } from '../src/runtime/errors'

function setup(overrides: Partial<ClientOptions> = {}, reply: unknown = { ok: true }) {
  const fetch = vi.fn<FetchLike>(async () => reply)
  const client = createClient({
    baseURL: 'https://api.lootlocker.com',
    domainKey: 'dk',
    environment: 'development',
    getSessionToken: () => 'tok',
    fetch,
    ...overrides,
  })
  return { client, fetch }
}

describe('http helpers', () => {
  it.each([
    ['get', 'GET'],
    ['delete', 'DELETE'],
  ] as const)('%s sends %s to the joined URL', async (helper, method) => {
    const { client, fetch } = setup()
    await client[helper]('/game/thing')
    expect(fetch).toHaveBeenCalledWith('https://api.lootlocker.com/game/thing', expect.objectContaining({ method }))
  })

  it.each([
    ['post', 'POST'],
    ['put', 'PUT'],
    ['patch', 'PATCH'],
  ] as const)('%s sends %s with the body', async (helper, method) => {
    const { client, fetch } = setup()
    await client[helper]('game/thing', { a: 1 })
    expect(fetch).toHaveBeenCalledWith('https://api.lootlocker.com/game/thing', expect.objectContaining({ method, body: { a: 1 } }))
  })

  it('tolerates a trailing slash on baseURL and passes the query through', async () => {
    const { client, fetch } = setup({ baseURL: 'https://api.lootlocker.com/' })
    await client.get('/x', { query: { page: 2 } })
    expect(fetch).toHaveBeenCalledWith('https://api.lootlocker.com/x', expect.objectContaining({ query: { page: 2 } }))
  })

  it('returns the response data', async () => {
    const { client } = setup({}, { hello: 'world' })
    expect(await client.get('/x')).toEqual({ hello: 'world' })
  })
})

describe('auth headers', () => {
  it('sends x-session-token on session calls and nothing white label', async () => {
    const { client, fetch } = setup()
    await client.get('/x')
    const { headers } = fetch.mock.calls[0]![1]
    expect(headers).toEqual({ 'x-session-token': 'tok' })
  })

  it('sends domain-key and is-development, and no token, on white label calls', async () => {
    const { client, fetch } = setup()
    await client.post('/x', {}, { auth: 'whiteLabel' })
    expect(fetch.mock.calls[0]![1].headers).toEqual({ 'domain-key': 'dk', 'is-development': 'true' })
  })

  it('sends is-development "false" in production', async () => {
    const { client, fetch } = setup({ environment: 'production' })
    await client.get('/x', { auth: 'whiteLabel' })
    expect(fetch.mock.calls[0]![1].headers['is-development']).toBe('false')
  })

  it('omits the token header when there is no session', async () => {
    const { client, fetch } = setup({ getSessionToken: () => null })
    await client.get('/x')
    expect(fetch.mock.calls[0]![1].headers).toEqual({})
  })

  it('reads the token on every call', async () => {
    let token = 'one'
    const { client, fetch } = setup({ getSessionToken: () => token })
    await client.get('/x')
    token = 'two'
    await client.get('/x')
    expect(fetch.mock.calls.map(c => c[1].headers['x-session-token'])).toEqual(['one', 'two'])
  })

  it('never sends LL-Version', async () => {
    const { client, fetch } = setup()
    await client.get('/x')
    await client.get('/x', { auth: 'whiteLabel' })
    for (const [, options] of fetch.mock.calls) {
      expect(Object.keys(options.headers).map(h => h.toLowerCase())).not.toContain('ll-version')
    }
  })

  it('keeps caller headers but never lets them override auth headers', async () => {
    const { client, fetch } = setup()
    await client.get('/x', { headers: { 'x-custom': '1', 'x-session-token': 'evil' } })
    expect(fetch.mock.calls[0]![1].headers).toEqual({ 'x-custom': '1', 'x-session-token': 'tok' })
  })
})

describe('errors', () => {
  it('throws LootLockerError with status and payload on a non-2xx', async () => {
    const payload = { message: 'Invalid session token' }
    const { client } = setup({
      fetch: async () => {
        throw Object.assign(new Error('401'), { response: { status: 401, _data: payload } })
      },
    })
    const error = await client.get('/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(LootLockerError)
    expect(error).toMatchObject({ status: 401, payload, message: 'LootLocker 401: Invalid session token' })
  })

  it('rethrows failures that have no response', async () => {
    const boom = new TypeError('network down')
    const { client } = setup({
      fetch: async () => {
        throw boom
      },
    })
    await expect(client.get('/x')).rejects.toBe(boom)
  })
})

describe('endpoint map', () => {
  it('includes stripeManage as GET /game/store/stripe/manage', () => {
    expect(endpoints.stripeManage).toMatchObject({ method: 'GET', path: '/game/store/stripe/manage', auth: 'session' })
  })

  it('calls an endpoint with its own method, path and auth', async () => {
    const { client, fetch } = setup({}, { url: 'https://billing.example' })
    const result = await client.call(endpoints.stripeManage)
    expect(result.url).toBe('https://billing.example')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.lootlocker.com/game/store/stripe/manage',
      expect.objectContaining({ method: 'GET', headers: { 'x-session-token': 'tok' } }),
    )
  })
})
