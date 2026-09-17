import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { buildEmployee, lookups } from '../../test/fixtures'
import { renderWithProviders } from '../../test/utils'
import { EmployeeForm } from './EmployeeForm'

function renderForm(props: Partial<Parameters<typeof EmployeeForm>[0]> = {}) {
  const onSubmit = vi.fn()
  renderWithProviders(<EmployeeForm lookups={lookups} onSubmit={onSubmit} onCancel={vi.fn()} {...props} />)
  return { onSubmit }
}

describe('EmployeeForm', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const { onSubmit } = renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Save employee' }))

    expect(await screen.findByText('Full name is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits cleaned values for an existing employee', async () => {
    const { onSubmit } = renderForm({ employee: buildEmployee() })

    const salary = screen.getByLabelText(/Annual salary/)
    await userEvent.clear(salary)
    await userEvent.type(salary, '2000000')
    await userEvent.click(screen.getByRole('button', { name: 'Save employee' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Priya Sharma', salary: 2000000 }))
  })

  it("labels the salary with the selected country's currency", () => {
    renderForm({ employee: buildEmployee({ country_code: 'US', currency: 'USD' }) })

    expect(screen.getByLabelText(/Annual salary \(USD\)/)).toBeInTheDocument()
  })

  it('warns that the salary amount is not converted when an existing employee changes country', async () => {
    renderForm({ employee: buildEmployee({ country_code: 'IN', currency: 'INR' }) })
    expect(screen.queryByText(/not converted/)).not.toBeInTheDocument()

    const countryInput = screen.getAllByLabelText(/^Country/).find((el) => el.tagName === 'INPUT')!
    await userEvent.click(countryInput)
    await userEvent.click(await screen.findByText('United States (USD)'))

    expect(await screen.findByText(/not converted/)).toBeInTheDocument()
  })

  it('shows field errors returned by the server', () => {
    renderForm({ employee: buildEmployee(), serverErrors: { email: ['has already been taken'] } })

    expect(screen.getByText('Email has already been taken')).toBeInTheDocument()
  })
})
