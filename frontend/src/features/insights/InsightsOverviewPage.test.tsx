import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, renderWithProviders } from '../../test/utils'
import { InsightsOverviewPage } from './InsightsOverviewPage'
import { overview } from './insightsFixtures'

describe('InsightsOverviewPage', () => {
  it('summarises pay per country in each local currency', async () => {
    mockApi({ 'GET /api/insights/countries': () => ({ body: overview }) })

    renderWithProviders(<InsightsOverviewPage />)

    const indiaRow = (await screen.findByRole('link', { name: 'India' })).closest('tr')!
    expect(within(indiaRow).getByText('₹2,600,000')).toBeInTheDocument()
    expect(within(indiaRow).getByText('INR')).toBeInTheDocument()
    expect(screen.getByText('3,100')).toBeInTheDocument()
  })

  it('links each country to its drill-down', async () => {
    mockApi({ 'GET /api/insights/countries': () => ({ body: overview }) })

    renderWithProviders(<InsightsOverviewPage />)

    expect(await screen.findByRole('link', { name: 'United States' })).toHaveAttribute('href', '/insights/US')
  })

  it('shows an error when insights cannot be loaded', async () => {
    mockApi({ 'GET /api/insights/countries': () => ({ status: 500, body: { error: 'Boom' } }) })

    renderWithProviders(<InsightsOverviewPage />)

    expect(await screen.findByText('Boom')).toBeInTheDocument()
  })
})
