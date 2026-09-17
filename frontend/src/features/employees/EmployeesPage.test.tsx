import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { buildEmployee, lookups } from '../../test/fixtures'
import { mockApi, renderWithProviders } from '../../test/utils'
import { EmployeesPage } from './EmployeesPage'

const priya = buildEmployee()
const john = buildEmployee({
  id: 2,
  full_name: 'John Smith',
  email: 'john.smith@acme.com',
  country_code: 'US',
  country_name: 'United States',
  currency: 'USD',
  salary: 125000,
})

function setup({ route = '/employees', routes = {} }: { route?: string; routes?: Parameters<typeof mockApi>[0] } = {}) {
  const api = mockApi({
    'GET /api/lookups': () => ({ body: lookups }),
    'GET /api/employees': () => ({
      body: { data: [priya, john], meta: { page: 1, per_page: 25, total: 10000, total_pages: 400 } },
    }),
    ...routes,
  })
  renderWithProviders(<EmployeesPage />, { route })
  return api
}

const listRequests = (api: ReturnType<typeof mockApi>) =>
  api.calls.filter((c) => c.method === 'GET' && c.url.pathname === '/api/employees')

describe('EmployeesPage', () => {
  it('lists employees with salaries in their local currency and the total count', async () => {
    setup()

    const row = (await screen.findByText('John Smith')).closest('tr')!
    expect(within(row).getByText('$125,000')).toBeInTheDocument()
    expect(screen.getByText('₹1,800,000')).toBeInTheDocument()
    expect(screen.getByText(/of 10,000 employees/)).toBeInTheDocument()
  })

  it('applies filters from the URL so views can be shared', async () => {
    const api = setup({ route: '/employees?country=IN&page=3' })

    await screen.findByText('John Smith')
    expect(listRequests(api)[0].url.searchParams.get('country')).toBe('IN')
    expect(listRequests(api)[0].url.searchParams.get('page')).toBe('3')
  })

  it('searches by name after the user stops typing and resets to page 1', async () => {
    const api = setup({ route: '/employees?page=5' })
    await screen.findByText('John Smith')

    await userEvent.type(screen.getByPlaceholderText('Search name or email'), 'priya')

    await waitFor(() => {
      const last = listRequests(api).at(-1)!.url.searchParams
      expect(last.get('q')).toBe('priya')
      expect(last.get('page')).toBe('1')
    })
  })

  it('toggles sorting when a column header is clicked', async () => {
    const api = setup()
    await screen.findByText('John Smith')

    await userEvent.click(screen.getByRole('button', { name: /Salary/ }))
    await waitFor(() => expect(listRequests(api).at(-1)!.url.search).toContain('sort=salary&direction=asc'))

    await userEvent.click(screen.getByRole('button', { name: /Salary/ }))
    await waitFor(() => expect(listRequests(api).at(-1)!.url.search).toContain('sort=salary&direction=desc'))
  })

  it('deletes an employee after confirmation', async () => {
    const api = setup({ routes: { 'DELETE /api/employees/2': () => ({ status: 204 }) } })

    const row = (await screen.findByText('John Smith')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Delete John Smith' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete employee' }))

    await waitFor(() => expect(api.calls.some((c) => c.method === 'DELETE')).toBe(true))
    expect(await screen.findByText('John Smith was removed')).toBeInTheDocument()
  })

  it('shows server validation errors when saving fails', async () => {
    setup({
      routes: {
        'PATCH /api/employees/2': () => ({ status: 422, body: { errors: { email: ['has already been taken'] } } }),
      },
    })

    const row = (await screen.findByText('John Smith')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Edit John Smith' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Save employee' }))

    expect(await screen.findByText('Email has already been taken')).toBeInTheDocument()
  })
})
