import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { ApiError } from '../../api/client'
import { useDeleteEmployee, useEmployees, useLookups, useSaveEmployee } from '../../api/hooks'
import type { Employee, EmployeeInput } from '../../api/types'
import { formatNumber } from '../../lib/format'
import { EmployeeForm } from './EmployeeForm'
import { EmployeesTable } from './EmployeesTable'
import { useEmployeeListParams } from './useEmployeeListParams'
import { useSearchInput } from './useSearchInput'

type Editing = { mode: 'create' } | { mode: 'edit'; employee: Employee } | null

export function EmployeesPage() {
  const { params, update, toggleSort, hasFilters, clearFilters } = useEmployeeListParams()
  const employees = useEmployees(params)
  const lookups = useLookups()
  const saveEmployee = useSaveEmployee()
  const deleteEmployee = useDeleteEmployee()

  const search = useSearchInput(params.q, (q) => update({ q }))

  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)

  const closeEditor = () => {
    setEditing(null)
    saveEmployee.reset()
  }

  const handleSave = (input: EmployeeInput) => {
    const id = editing?.mode === 'edit' ? editing.employee.id : undefined
    saveEmployee.mutate(
      { id, input },
      {
        onSuccess: (saved) => {
          notifications.show({ color: 'green', message: `${saved.full_name} was ${id ? 'updated' : 'added'}` })
          closeEditor()
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleting) return
    deleteEmployee.mutate(deleting.id, {
      onSuccess: () => {
        notifications.show({ color: 'green', message: `${deleting.full_name} was removed` })
        setDeleting(null)
      },
      onError: (error) => notifications.show({ color: 'red', message: error.message }),
    })
  }

  const saveError = saveEmployee.error instanceof ApiError ? saveEmployee.error : null
  const meta = employees.data?.meta
  const firstShown = meta && meta.total > 0 ? (meta.page - 1) * meta.per_page + 1 : 0
  const lastShown = meta ? Math.min(meta.page * meta.per_page, meta.total) : 0

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Employees</Title>
        <Button onClick={() => setEditing({ mode: 'create' })} disabled={!lookups.data}>
          Add employee
        </Button>
      </Group>

      <Paper withBorder p="md">
        <Group align="flex-end" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Search name or email"
            value={search.value}
            onChange={(event) => search.onChange(event.currentTarget.value)}
            style={{ flex: '1 1 240px' }}
          />
          <Select
            label="Country"
            placeholder="All countries"
            clearable
            searchable
            data={lookups.data?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []}
            value={params.country ?? null}
            onChange={(country) => update({ country: country ?? undefined })}
          />
          <Select
            label="Department"
            placeholder="All departments"
            clearable
            searchable
            data={lookups.data?.departments ?? []}
            value={params.department ?? null}
            onChange={(department) => update({ department: department ?? undefined })}
          />
          <Select
            label="Job title"
            placeholder="All job titles"
            clearable
            searchable
            data={lookups.data?.job_titles ?? []}
            value={params.job_title ?? null}
            onChange={(jobTitle) => update({ job_title: jobTitle ?? undefined })}
          />
          {hasFilters && (
            <Button
              variant="subtle"
              onClick={() => {
                search.clear()
                clearFilters()
              }}
            >
              Clear filters
            </Button>
          )}
        </Group>
      </Paper>

      <Paper withBorder>
        {employees.isPending ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : employees.isError ? (
          <Alert color="red" title="Could not load employees" m="md">
            {employees.error.message}
          </Alert>
        ) : employees.data.data.length === 0 ? (
          <Text c="dimmed" ta="center" p="xl">
            No employees match these filters.
          </Text>
        ) : (
          <EmployeesTable
            employees={employees.data.data}
            sort={params.sort}
            direction={params.direction}
            onSort={toggleSort}
            onEdit={(employee) => setEditing({ mode: 'edit', employee })}
            onDelete={setDeleting}
          />
        )}
      </Paper>

      {meta && meta.total > 0 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {formatNumber(firstShown)}–{formatNumber(lastShown)} of {formatNumber(meta.total)} employees
          </Text>
          <Pagination
            total={meta.total_pages}
            value={meta.page}
            onChange={(page) => update({ page }, { resetPage: false })}
          />
        </Group>
      )}

      <Modal
        opened={editing !== null}
        onClose={closeEditor}
        title={editing?.mode === 'edit' ? `Edit ${editing.employee.full_name}` : 'Add employee'}
        size="lg"
      >
        {editing && lookups.data && (
          <EmployeeForm
            key={editing.mode === 'edit' ? editing.employee.id : 'new'}
            employee={editing.mode === 'edit' ? editing.employee : undefined}
            lookups={lookups.data}
            submitting={saveEmployee.isPending}
            serverErrors={saveError?.fieldErrors}
            onSubmit={handleSave}
            onCancel={closeEditor}
          />
        )}
        {saveError && Object.keys(saveError.fieldErrors).length === 0 && (
          <Alert color="red" mt="md">
            {saveError.message}
          </Alert>
        )}
      </Modal>

      <Modal opened={deleting !== null} onClose={() => setDeleting(null)} title="Delete employee?">
        <Stack>
          <Text>
            This permanently removes <b>{deleting?.full_name}</b> and their salary record.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button color="red" loading={deleteEmployee.isPending} onClick={handleDelete}>
              Delete employee
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
