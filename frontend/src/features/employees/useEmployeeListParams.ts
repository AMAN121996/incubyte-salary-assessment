import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { EmployeeListParams, SortDirection } from '../../api/types'

const FILTER_KEYS = ['q', 'country', 'department', 'job_title'] as const
// Must match the API's default order (EmployeeSearch::DEFAULT_SORT).
export const DEFAULT_SORT = 'full_name'

/**
 * List state (search, filters, sort, page) lives in the URL so HR can
 * bookmark or share a view, and Back/refresh keep their place.
 */
export function useEmployeeListParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params: EmployeeListParams = useMemo(
    () => ({
      q: searchParams.get('q') ?? undefined,
      country: searchParams.get('country') ?? undefined,
      department: searchParams.get('department') ?? undefined,
      job_title: searchParams.get('job_title') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      direction: (searchParams.get('direction') as SortDirection | null) ?? undefined,
      page: Number(searchParams.get('page')) || 1,
    }),
    [searchParams],
  )

  const update = useCallback(
    (changes: Partial<EmployeeListParams>, { resetPage = true } = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === null || value === '') next.delete(key)
            else next.set(key, String(value))
          }
          // Changing what is shown invalidates the current page number.
          if (resetPage && !('page' in changes)) next.delete('page')
          if (next.get('page') === '1') next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const toggleSort = useCallback(
    (column: string) => {
      const currentSort = params.sort ?? DEFAULT_SORT
      const direction: SortDirection = currentSort === column && params.direction !== 'desc' ? 'desc' : 'asc'
      update({ sort: column, direction })
    },
    [params.sort, params.direction, update],
  )

  const hasFilters = FILTER_KEYS.some((key) => Boolean(params[key]))
  const clearFilters = useCallback(() => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined]))), [update])

  return { params, update, toggleSort, hasFilters, clearFilters }
}
