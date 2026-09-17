import { BarChart } from '@mantine/charts'
import { Anchor, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import { useCountriesOverview } from '../../api/hooks'
import { QueryState } from '../../components/QueryState'
import { StatCard } from '../../components/StatCard'
import { formatMoney, formatNumber } from '../../lib/format'

export function InsightsOverviewPage() {
  const overview = useCountriesOverview()

  return (
    <Stack>
      <div>
        <Title order={2}>Salary insights</Title>
        <Text c="dimmed" size="sm">
          Pay is shown per country in local currency. Amounts are never added up across currencies.
        </Text>
      </div>

      <QueryState query={overview}>
        {({ total_headcount, countries }) => (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <StatCard label="Employees" value={formatNumber(total_headcount)} />
              <StatCard label="Countries" value={countries.length} />
            </SimpleGrid>

            <Paper withBorder p="md">
              <Title order={4} mb="md">
                Headcount by country
              </Title>
              <BarChart
                h={260}
                data={countries.map((c) => ({ country: c.country_name, headcount: c.headcount }))}
                dataKey="country"
                series={[{ name: 'headcount', label: 'Employees', color: 'indigo.6' }]}
                valueFormatter={formatNumber}
                gridAxis="y"
              />
            </Paper>

            <Paper withBorder>
              <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Country</Table.Th>
                      <Table.Th>Currency</Table.Th>
                      <Table.Th ta="right">Employees</Table.Th>
                      <Table.Th ta="right">Min</Table.Th>
                      <Table.Th ta="right">Median</Table.Th>
                      <Table.Th ta="right">Average</Table.Th>
                      <Table.Th ta="right">Max</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {countries.map((c) => (
                      <Table.Tr key={c.country_code}>
                        <Table.Td>
                          <Anchor component={Link} to={`/insights/${c.country_code}`} fw={500}>
                            {c.country_name}
                          </Anchor>
                        </Table.Td>
                        <Table.Td>{c.currency}</Table.Td>
                        <Table.Td ta="right">{formatNumber(c.headcount)}</Table.Td>
                        <Table.Td ta="right">{formatMoney(c.min, c.currency)}</Table.Td>
                        <Table.Td ta="right">{formatMoney(c.median, c.currency)}</Table.Td>
                        <Table.Td ta="right">{formatMoney(c.average, c.currency)}</Table.Td>
                        <Table.Td ta="right">{formatMoney(c.max, c.currency)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </>
        )}
      </QueryState>
    </Stack>
  )
}
