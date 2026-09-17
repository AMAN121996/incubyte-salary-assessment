import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { createQueryClient } from './lib/queryClient'
import { theme } from './lib/theme'

export function AppProviders({ children, queryClient }: { children: ReactNode; queryClient?: QueryClient }) {
  const [client] = useState(() => queryClient ?? createQueryClient())

  return (
    <QueryClientProvider client={client}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications position="top-right" />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  )
}
