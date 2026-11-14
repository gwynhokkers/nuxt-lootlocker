export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * `session` calls send `x-session-token`. `whiteLabel` calls send
 * `domain-key` and `is-development` and never a token.
 */
export type EndpointAuth = 'session' | 'whiteLabel'

export interface Endpoint<TResponse = unknown> {
  readonly method: HttpMethod
  readonly path: string
  readonly auth: EndpointAuth
  /** Phantom field: carries the response type, never set at runtime. */
  readonly _response?: TResponse
}

export function defineEndpoint<TResponse = unknown>(
  method: HttpMethod,
  path: string,
  auth: EndpointAuth,
): Endpoint<TResponse> {
  return { method, path, auth }
}

/**
 * The single endpoint map. Later milestones add their endpoints here;
 * only paths confirmed against the LootLocker reference belong in it.
 */
export const endpoints = {
  /** Undocumented in the LootLocker reference; confirmed in INK-413. */
  stripeManage: defineEndpoint<{ url: string }>('GET', '/game/store/stripe/manage', 'session'),
} as const

export type EndpointName = keyof typeof endpoints
