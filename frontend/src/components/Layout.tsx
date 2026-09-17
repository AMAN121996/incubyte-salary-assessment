import { AppShell, Group, NavLink, Text, Title } from '@mantine/core'
import { NavLink as RouterNavLink, Outlet } from 'react-router'

const navItems = [
  { to: '/employees', label: 'Employees' },
  { to: '/insights', label: 'Salary insights' },
]

export function Layout() {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" gap="xs">
          <Title order={3}>ACME</Title>
          <Text c="dimmed">Salary Management</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm" aria-label="Main navigation">
        {navItems.map((item) => (
          <RouterNavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => <NavLink component="span" label={item.label} active={isActive} />}
          </RouterNavLink>
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
