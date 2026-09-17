import type { FieldErrors } from '../../api/client'
import type { Employee, EmployeeInput } from '../../api/types'

export type EmployeeFormValues = {
  full_name: string
  email: string
  job_title: string
  department: string
  country_code: string | null
  salary: number | string
  hired_on: string
}

export const emptyFormValues: EmployeeFormValues = {
  full_name: '',
  email: '',
  job_title: '',
  department: '',
  country_code: null,
  salary: '',
  hired_on: '',
}

export const fieldLabels: Record<keyof EmployeeFormValues, string> = {
  full_name: 'Full name',
  email: 'Email',
  job_title: 'Job title',
  department: 'Department',
  country_code: 'Country',
  salary: 'Salary',
  hired_on: 'Hire date',
}

const EMAIL_FORMAT = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function toFormValues(employee: Employee): EmployeeFormValues {
  const { full_name, email, job_title, department, country_code, salary, hired_on } = employee
  return { full_name, email, job_title, department, country_code, salary, hired_on }
}

export function toEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    job_title: values.job_title.trim(),
    department: values.department.trim(),
    country_code: values.country_code ?? '',
    salary: Number(values.salary),
    hired_on: values.hired_on,
  }
}

/**
 * Mirrors the server's model validations for instant feedback. The server
 * remains the source of truth (e.g. email uniqueness), see toFormErrors.
 */
export function validateEmployeeForm(values: EmployeeFormValues, today: string): Partial<Record<keyof EmployeeFormValues, string>> {
  const errors: Partial<Record<keyof EmployeeFormValues, string>> = {}

  for (const field of ['full_name', 'email', 'job_title', 'department'] as const) {
    if (!values[field].trim()) errors[field] = `${fieldLabels[field]} is required`
  }
  if (!errors.email && !EMAIL_FORMAT.test(values.email.trim())) errors.email = 'Enter a valid email'
  if (!values.country_code) errors.country_code = 'Country is required'

  const salary = Number(values.salary)
  if (values.salary === '') errors.salary = 'Salary is required'
  else if (!Number.isInteger(salary) || salary <= 0) errors.salary = 'Salary must be a positive whole number'

  if (!values.hired_on) errors.hired_on = 'Hire date is required'
  else if (values.hired_on > today) errors.hired_on = "Hire date can't be in the future"

  return errors
}

/** Turns Rails-style { email: ["has already been taken"] } into form errors. */
export function toFormErrors(serverErrors: FieldErrors): Record<string, string> {
  return Object.fromEntries(
    Object.entries(serverErrors).map(([field, messages]) => {
      const label = fieldLabels[field as keyof EmployeeFormValues] ?? field
      return [field, `${label} ${messages.join(', ')}`]
    }),
  )
}
