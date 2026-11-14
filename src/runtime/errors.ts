/** Thrown by the client for any non-2xx LootLocker response. */
export class LootLockerError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown) {
    super(messageFrom(status, payload))
    this.name = 'LootLockerError'
    this.status = status
    this.payload = payload
  }
}

function messageFrom(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    const text = body.message ?? body.error
    if (typeof text === 'string' && text) return `LootLocker ${status}: ${text}`
  }
  return `LootLocker request failed with status ${status}`
}
