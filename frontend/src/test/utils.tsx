import { render } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import { AppProviders } from '../AppProviders'

type RenderOptions = { route?: string; path?: string }

export function renderWithProviders(ui: ReactElement, { route = '/', path = '*' }: RenderOptions = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

  return render(
    <AppProviders queryClient={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

type Handler = (url: URL, init: RequestInit | undefined) => { status?: number; body?: unknown }

/**
 * Minimal fetch fake: routes "METHOD /path" to a handler, records every call.
 * Keeps UI tests fast and deterministic without a network layer.
 */
export function mockApi(routes: Record<string, Handler>) {
  const calls: { method: string; url: URL; body: unknown }[] = []

  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(String(input), 'http://localhost')
    const method = init?.method ?? 'GET'
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined })

    const handler = routes[`${method} ${url.pathname}`]
    if (!handler) throw new Error(`Unhandled request: ${method} ${url.pathname}`)

    const { status = 200, body } = handler(url, init)
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  return { calls, spy }
}
