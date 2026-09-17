import { describe, expect, it } from 'vitest'
import { buildEmployee } from '../../test/fixtures'
import { emptyFormValues, toEmployeeInput, toFormValues, validateEmployeeForm } from './employeeFormValues'

const today = '2026-09-17'

const validValues = {
  full_name: 'Priya Sharma',
  email: 'priya@acme.com',
  job_title: 'Software Engineer',
  department: 'Engineering',
  country_code: 'IN',
  salary: 1800000,
  hired_on: '2022-04-01',
}

describe('validateEmployeeForm', () => {
  it('accepts valid values', () => {
    expect(validateEmployeeForm(validValues, today)).toEqual({})
  })

  it('requires every field', () => {
    const errors = validateEmployeeForm(emptyFormValues, today)

    expect(Object.keys(errors).sort()).toEqual(
      ['country_code', 'department', 'email', 'full_name', 'hired_on', 'job_title', 'salary'].sort(),
    )
  })

  it('treats whitespace-only text as missing', () => {
    expect(validateEmployeeForm({ ...validValues, full_name: '   ' }, today)).toHaveProperty('full_name')
  })

  it('rejects a malformed email', () => {
    expect(validateEmployeeForm({ ...validValues, email: 'priya@' }, today).email).toBe('Enter a valid email')
  })

  it('rejects zero, negative and fractional salaries', () => {
    for (const salary of [0, -100, 1000.5]) {
      expect(validateEmployeeForm({ ...validValues, salary }, today).salary).toBe(
        'Salary must be a positive whole number',
      )
    }
  })

  it('rejects hire dates in the future', () => {
    expect(validateEmployeeForm({ ...validValues, hired_on: '2026-09-18' }, today).hired_on).toBe(
      "Hire date can't be in the future",
    )
  })
})

describe('toEmployeeInput', () => {
  it('trims text and converts salary to a number', () => {
    expect(toEmployeeInput({ ...validValues, full_name: ' Priya Sharma ', salary: '1800000' })).toEqual(validValues)
  })
})

describe('toFormValues', () => {
  it('maps an employee to editable form values', () => {
    expect(toFormValues(buildEmployee())).toEqual({
      full_name: 'Priya Sharma',
      email: 'priya.sharma@acme.com',
      job_title: 'Software Engineer',
      department: 'Engineering',
      country_code: 'IN',
      salary: 1800000,
      hired_on: '2022-04-01',
    })
  })
})
