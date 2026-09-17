import { Alert, Center, Loader } from '@mantine/core'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/** Renders loading and error states uniformly; children only see loaded data. */
export function QueryState<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (query.isPending) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    )
  }
  if (query.isError) {
    return (
      <Alert color="red" title="Something went wrong">
        {query.error.message}
      </Alert>
    )
  }
  return <>{children(query.data)}</>
}
