import { ActionIcon, Group, Table, Text, Tooltip, UnstyledButton, VisuallyHidden } from '@mantine/core'
import type { Employee, EmployeeListParams } from '../../api/types'
import { formatDate, formatMoney } from '../../lib/format'
import { DEFAULT_SORT } from './useEmployeeListParams'

type Column = { key: string; label: string; align?: 'right' }

const columns: Column[] = [
  { key: 'full_name', label: 'Name' },
  { key: 'job_title', label: 'Job title' },
  { key: 'department', label: 'Department' },
  { key: 'country_code', label: 'Country' },
  { key: 'salary', label: 'Salary', align: 'right' },
  { key: 'hired_on', label: 'Hired' },
]

type Props = {
  employees: Employee[]
  sort: EmployeeListParams['sort']
  direction: EmployeeListParams['direction']
  onSort: (column: string) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeesTable({ employees, sort, direction, onSort, onEdit, onDelete }: Props) {
  const activeSort = sort ?? DEFAULT_SORT

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => {
              const isActive = activeSort === column.key
              const arrow = isActive ? (direction === 'desc' ? ' ↓' : ' ↑') : ''
              return (
                <Table.Th
                  key={column.key}
                  ta={column.align}
                  aria-sort={isActive ? (direction === 'desc' ? 'descending' : 'ascending') : 'none'}
                >
                  <UnstyledButton onClick={() => onSort(column.key)} fw={600} fz="sm">
                    {column.label}
                    {arrow}
                  </UnstyledButton>
                </Table.Th>
              )
            })}
            <Table.Th>
              <VisuallyHidden>Actions</VisuallyHidden>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((employee) => (
            <Table.Tr key={employee.id}>
              <Table.Td>
                <Text fw={500} size="sm">
                  {employee.full_name}
                </Text>
                <Text c="dimmed" size="xs">
                  {employee.email}
                </Text>
              </Table.Td>
              <Table.Td>{employee.job_title}</Table.Td>
              <Table.Td>{employee.department}</Table.Td>
              <Table.Td>{employee.country_name}</Table.Td>
              <Table.Td ta="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(employee.salary, employee.currency)}
              </Table.Td>
              <Table.Td>{formatDate(employee.hired_on)}</Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end" wrap="nowrap">
                  <Tooltip label="Edit">
                    <ActionIcon variant="subtle" aria-label={`Edit ${employee.full_name}`} onClick={() => onEdit(employee)}>
                      ✎
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={`Delete ${employee.full_name}`}
                      onClick={() => onDelete(employee)}
                    >
                      🗑
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
