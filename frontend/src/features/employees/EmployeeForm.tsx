import { Alert, Autocomplete, Button, Group, NumberInput, Select, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useEffect } from 'react'
import type { FieldErrors } from '../../api/client'
import type { Employee, EmployeeInput, Lookups } from '../../api/types'
import {
  emptyFormValues,
  toEmployeeInput,
  toFormErrors,
  toFormValues,
  validateEmployeeForm,
  type EmployeeFormValues,
} from './employeeFormValues'

type Props = {
  employee?: Employee
  lookups: Lookups
  submitting?: boolean
  serverErrors?: FieldErrors
  onSubmit: (input: EmployeeInput) => void
  onCancel: () => void
}

// The HR manager's local calendar date (toISOString would give the UTC date).
const todayIso = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function EmployeeForm({ employee, lookups, submitting = false, serverErrors, onSubmit, onCancel }: Props) {
  const form = useForm<EmployeeFormValues>({
    initialValues: employee ? toFormValues(employee) : emptyFormValues,
    validate: (values) => validateEmployeeForm(values, todayIso()),
  })

  const { setErrors } = form
  useEffect(() => {
    if (serverErrors) setErrors(toFormErrors(serverErrors))
  }, [serverErrors, setErrors])

  const currency = lookups.countries.find((c) => c.code === form.values.country_code)?.currency
  const countryChanged = employee !== undefined && form.values.country_code !== employee.country_code
  const countryOptions = lookups.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.currency})` }))

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(toEmployeeInput(values)))} noValidate>
      <Stack>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Full name" withAsterisk {...form.getInputProps('full_name')} />
          <TextInput label="Email" type="email" withAsterisk {...form.getInputProps('email')} />
          <Autocomplete
            label="Job title"
            withAsterisk
            data={lookups.job_titles}
            {...form.getInputProps('job_title')}
          />
          <Autocomplete
            label="Department"
            withAsterisk
            data={lookups.departments}
            {...form.getInputProps('department')}
          />
          <Select
            label="Country"
            withAsterisk
            searchable
            data={countryOptions}
            {...form.getInputProps('country_code')}
          />
          <NumberInput
            label={currency ? `Annual salary (${currency})` : 'Annual salary'}
            description="Gross, in local currency"
            withAsterisk
            min={1}
            allowDecimal={false}
            allowNegative={false}
            thousandSeparator=","
            {...form.getInputProps('salary')}
          />
          <TextInput label="Hire date" type="date" max={todayIso()} withAsterisk {...form.getInputProps('hired_on')} />
        </SimpleGrid>

        {countryChanged && currency && (
          <Alert color="yellow">
            The salary will now be recorded in {currency}. The amount is not converted from {employee.currency}, so
            check it before saving.
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Save employee
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
