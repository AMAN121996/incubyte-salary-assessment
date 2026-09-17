import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { lookups } from '../../test/fixtures'
import { mockApi, renderWithProviders } from '../../test/utils'
import { CountryInsightsPage } from './CountryInsightsPage'
import { india } from './insightsFixtures'

function setup(route = '/insights/IN') {
  const api = mockApi({
    'GET /api/lookups': () => ({ body: lookups }),
    'GET /api/insights/countries/IN': () => ({ body: india }),
    'GET /api/insights/countries/ZZ': () => ({ status: 404, body: { error: 'Country not found' } }),
  })
  renderWithProviders(<CountryInsightsPage />, { route, path: '/insights/:countryCode' })
  return api
}

describe('CountryInsightsPage', () => {
  it('shows headline pay statistics for the country', async () => {
    setup()

    expect(await screen.findByRole('heading', { name: 'India' })).toBeInTheDocument()
    expect(screen.getByText('Median salary').parentElement).toHaveTextContent('₹2,600,000')
    expect(screen.getByText('Salary range').parentElement).toHaveTextContent('₹1,000,000 – ₹5,750,000')
  })

  it('breaks pay down by job title, with a link to those employees', async () => {
    setup()

    const row = (await screen.findByText('Software Engineer')).closest('tr')!
    expect(within(row).getByText('₹2,875,000')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: '90' })).toHaveAttribute(
      'href',
      '/employees?country=IN&job_title=Software+Engineer',
    )
  })

  it('switches to the department breakdown', async () => {
    setup()
    await screen.findByText('Software Engineer')

    await userEvent.click(screen.getByRole('tab', { name: 'By department' }))

    const row = (await screen.findByText('People')).closest('tr')!
    expect(within(row).getByRole('link', { name: '10' })).toHaveAttribute('href', '/employees?country=IN&department=People')
  })

  it('shows a not-found message for an unknown country', async () => {
    setup('/insights/ZZ')

    expect(await screen.findByText('Country not found')).toBeInTheDocument()
  })
})
