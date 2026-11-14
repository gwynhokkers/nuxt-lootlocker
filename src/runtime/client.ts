import { LootLockerError } from './errors'
import type { Endpoint, EndpointAuth, HttpMethod } from './endpoints'

export interface FetchOptions {
  method: HttpMethod
  headers: Record<string, string>
  query?: Record<string, unknown>
  body?: unknown
}

/** The slice of `$fetch` the client relies on. */
export type FetchLike = (url: string, options: FetchOptions) => Promise<unknown>

export interface ClientOptions {
  baseURL: string
  /** Sent as `domain-key` on white label calls. */
  domainKey: string
  /** Sent as `is-development` ('true' or 'false') on white label calls. */
  environment: 'development' | 'production'
  /** Read on every session call, so the token can change after creation. */
  getSessionToken?: () => string | null | undefined
  /** Defaults to the global `$fetch`. */
  fetch?: FetchLike
}

export interface RequestOptions {
  /** Which credentials to send. Defaults to `session`. */
  auth?: EndpointAuth
  query?: Record<string, unknown>
  body?: unknown
  headers?: Record<string, string>
}

export interface LootLockerClient {
  request: <T = unknown>(method: HttpMethod, path: string, options?: RequestOptions) => Promise<T>
  call: <T>(endpoint: Endpoint<T>, options?: Omit<RequestOptions, 'auth'>) => Promise<T>
  get: <T = unknown>(path: string, options?: RequestOptions) => Promise<T>
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>
  delete: <T = unknown>(path: string, options?: RequestOptions) => Promise<T>
}

interface FetchFailure {
  response?: { status?: number, _data?: unknown }
}

export function createClient(options: ClientOptions): LootLockerClient {
  const baseURL = options.baseURL.replace(/\/+$/, '')

  function headersFor(auth: EndpointAuth): Record<string, string> {
    if (auth === 'whiteLabel') {
      return {
        'domain-key': options.domainKey,
        'is-development': String(options.environment === 'development'),
      }
    }
    const token = options.getSessionToken?.()
    return token ? { 'x-session-token': token } : {}
  }

  async function request<T = unknown>(method: HttpMethod, path: string, req: RequestOptions = {}): Promise<T> {
    const doFetch = options.fetch ?? (globalThis as unknown as { $fetch: FetchLike }).$fetch
    const url = `${baseURL}/${path.replace(/^\/+/, '')}`
    // Caller headers go first so they can never replace the auth headers.
    const headers = { ...req.headers, ...headersFor(req.auth ?? 'session') }

    try {
      return await doFetch(url, { method, headers, query: req.query, body: req.body }) as T
    }
    catch (error) {
      const response = (error as FetchFailure)?.response
      if (response && typeof response.status === 'number') {
        throw new LootLockerError(response.status, response._data)
      }
      throw error
    }
  }

  return {
    request,
    call: (endpoint, req) => request(endpoint.method, endpoint.path, { ...req, auth: endpoint.auth }),
    get: (path, req) => request('GET', path, req),
    post: (path, body, req) => request('POST', path, { ...req, body }),
    put: (path, body, req) => request('PUT', path, { ...req, body }),
    patch: (path, body, req) => request('PATCH', path, { ...req, body }),
    delete: (path, req) => request('DELETE', path, req),
  }
}
