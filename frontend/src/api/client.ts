export type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function apiRequest<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(path, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const fieldErrors: FieldErrors = payload.errors ?? {}
    const message = payload.error ?? (response.status === 422 ? 'Please fix the highlighted fields' : `Request failed (${response.status})`)
    throw new ApiError(response.status, message, fieldErrors)
  }

  return payload as T
}

export function toQueryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
