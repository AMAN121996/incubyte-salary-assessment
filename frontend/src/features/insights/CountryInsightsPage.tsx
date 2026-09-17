import { BarChart } from '@mantine/charts'
import { Anchor, Group, Paper, Select, SimpleGrid, Stack, Table, Tabs, Text, Title } from '@mantine/core'
import { Link, useNavigate, useParams } from 'react-router'
import { useCountryInsights, useLookups } from '../../api/hooks'
import type { GroupStats } from '../../api/types'
import { QueryState } from '../../components/QueryState'
import { StatCard } from '../../components/StatCard'
import { formatMoney, formatNumber } from '../../lib/format'

type GroupBy = 'job_title' | 'department'

export function CountryInsightsPage() {
  const { countryCode = '' } = useParams()
  const navigate = useNavigate()
  const insights = useCountryInsights(countryCode.toUpperCase())
  const lookups = useLookups()

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Anchor component={Link} to="/insights" size="sm">
          ← All countries
        </Anchor>
        <Select
          aria-label="Switch country"
          placeholder="Switch country"
          searchable
          data={lookups.data?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []}
          value={countryCode.toUpperCase()}
          onChange={(code) => code && navigate(`/insights/${code}`)}
        />
      </Group>

      <QueryState query={insights}>
        {(data) => {
          const money = (value: number | null) => formatMoney(value, data.currency)
          const { summary } = data

          return (
            <>
              <div>
                <Title order={2}>{data.country_name}</Title>
                <Text c="dimmed" size="sm">
                  Annual gross salaries in {data.currency}
                </Text>
              </div>

              {summary.headcount === 0 ? (
                <Text c="dimmed">No employees in this country yet.</Text>
              ) : (
                <>
                  <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
                    <StatCard label="Employees" value={formatNumber(summary.headcount)} />
                    <StatCard label="Median salary" value={money(summary.median)} />
                    <StatCard label="Average salary" value={money(summary.average)} />
                    <StatCard
                      label="Salary range"
                      value={`${money(summary.min)} – ${money(summary.max)}`}
                      hint={`Middle 50%: ${money(summary.p25)} – ${money(summary.p75)}`}
                    />
                  </SimpleGrid>

                  <Tabs defaultValue="job_title" keepMounted={false}>
                    <Tabs.List>
                      <Tabs.Tab value="job_title">By job title</Tabs.Tab>
                      <Tabs.Tab value="department">By department</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="job_title" pt="md">
                      <Breakdown groupBy="job_title" rows={data.by_job_title} countryCode={data.country_code} money={money} />
                    </Tabs.Panel>
                    <Tabs.Panel value="department" pt="md">
                      <Breakdown groupBy="department" rows={data.by_department} countryCode={data.country_code} money={money} />
                    </Tabs.Panel>
                  </Tabs>
                </>
              )}
            </>
          )
        }}
      </QueryState>
    </Stack>
  )
}

type BreakdownProps = {
  groupBy: GroupBy
  rows: GroupStats[]
  countryCode: string
  money: (value: number | null) => string
}

function Breakdown({ groupBy, rows, countryCode, money }: BreakdownProps) {
  const label = groupBy === 'job_title' ? 'Job title' : 'Department'
  const employeesLink = (name: string) => `/employees?${new URLSearchParams({ country: countryCode, [groupBy]: name })}`

  return (
    <Stack>
      <Paper withBorder p="md">
        <Title order={4} mb="md">
          Median and average salary by {label.toLowerCase()}
        </Title>
        <BarChart
          h={Math.max(200, rows.length * 44)}
          data={rows}
          dataKey="name"
          orientation="vertical"
          yAxisProps={{ width: 180 }}
          series={[
            { name: 'median', label: 'Median', color: 'indigo.6' },
            { name: 'average', label: 'Average', color: 'teal.5' },
          ]}
          valueFormatter={(value) => money(value)}
          withLegend
          gridAxis="x"
        />
      </Paper>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={900}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{label}</Table.Th>
                <Table.Th ta="right">Employees</Table.Th>
                <Table.Th ta="right">Min</Table.Th>
                <Table.Th ta="right">25th pct</Table.Th>
                <Table.Th ta="right">Median</Table.Th>
                <Table.Th ta="right">Average</Table.Th>
                <Table.Th ta="right">75th pct</Table.Th>
                <Table.Th ta="right">Max</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
              {rows.map((row) => (
                <Table.Tr key={row.name}>
                  <Table.Td fw={500}>{row.name}</Table.Td>
                  <Table.Td ta="right">
                    <Anchor component={Link} to={employeesLink(row.name)} title={`View ${row.name} employees`}>
                      {formatNumber(row.headcount)}
                    </Anchor>
                  </Table.Td>
                  <Table.Td ta="right">{money(row.min)}</Table.Td>
                  <Table.Td ta="right">{money(row.p25)}</Table.Td>
                  <Table.Td ta="right">{money(row.median)}</Table.Td>
                  <Table.Td ta="right">{money(row.average)}</Table.Td>
                  <Table.Td ta="right">{money(row.p75)}</Table.Td>
                  <Table.Td ta="right">{money(row.max)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Stack>
  )
}
