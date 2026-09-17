import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, toQueryString } from './client'

function mockFetch(status: number, body?: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('apiRequest', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sends JSON and returns the parsed response', async () => {
    const fetchSpy = mockFetch(201, { id: 1 })

    const result = await apiRequest('/api/employees', { method: 'POST', body: { name: 'x' } })

    expect(result).toEqual({ id: 1 })
    expect(fetchSpy).toHaveBeenCalledWith('/api/employees', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    })
  })

  it('returns undefined for 204 No Content', async () => {
    mockFetch(204)
    await expect(apiRequest('/api/employees/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws an ApiError carrying field errors for 422 responses', async () => {
    mockFetch(422, { errors: { email: ['is invalid'] } })

    const error = await apiRequest('/api/employees').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, fieldErrors: { email: ['is invalid'] } })
  })

  it('uses the server message for other errors', async () => {
    mockFetch(404, { error: 'Employee not found' })
    await expect(apiRequest('/api/employees/9')).rejects.toThrow('Employee not found')
  })
})

describe('toQueryString', () => {
  it('drops empty values and encodes the rest', () => {
    expect(toQueryString({ q: 'a b', country: '', page: 2, department: undefined })).toBe('?q=a+b&page=2')
  })

  it('returns an empty string when nothing is set', () => {
    expect(toQueryString({ q: '' })).toBe('')
  })
})
