import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppProviders } from './AppProviders'
import { Layout } from './components/Layout'
import { EmployeesPage } from './features/employees/EmployeesPage'
import { CountryInsightsPage } from './features/insights/CountryInsightsPage'
import { InsightsOverviewPage } from './features/insights/InsightsOverviewPage'

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/employees" replace />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="insights" element={<InsightsOverviewPage />} />
            <Route path="insights/:countryCode" element={<CountryInsightsPage />} />
            <Route path="*" element={<Navigate to="/employees" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}
