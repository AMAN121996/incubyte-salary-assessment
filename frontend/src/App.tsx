import { Title } from '@mantine/core'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppProviders } from './AppProviders'
import { Layout } from './components/Layout'
import { EmployeesPage } from './features/employees/EmployeesPage'

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/employees" replace />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="insights" element={<Title order={2}>Salary insights</Title>} />
            <Route path="*" element={<Navigate to="/employees" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}
