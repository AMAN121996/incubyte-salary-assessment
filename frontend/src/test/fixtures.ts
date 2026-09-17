import type { Employee, Lookups } from '../api/types'

export const lookups: Lookups = {
  countries: [
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'US', name: 'United States', currency: 'USD' },
  ],
  departments: ['Engineering', 'Sales'],
  job_titles: ['Account Executive', 'Software Engineer'],
}

export function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    full_name: 'Priya Sharma',
    email: 'priya.sharma@acme.com',
    job_title: 'Software Engineer',
    department: 'Engineering',
    country_code: 'IN',
    country_name: 'India',
    currency: 'INR',
    salary: 1800000,
    hired_on: '2022-04-01',
    ...overrides,
  }
}
