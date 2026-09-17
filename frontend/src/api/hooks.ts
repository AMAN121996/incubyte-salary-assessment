import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, toQueryString } from './client'
import type {
  CountriesOverview,
  CountryInsights,
  Employee,
  EmployeeInput,
  EmployeeListParams,
  Lookups,
  Paginated,
} from './types'

export const queryKeys = {
  employees: ['employees'] as const,
  employeeList: (params: EmployeeListParams) => ['employees', 'list', params] as const,
  lookups: ['lookups'] as const,
  insights: ['insights'] as const,
  countryInsights: (code: string) => ['insights', 'country', code] as const,
}

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: queryKeys.employeeList(params),
    queryFn: () => apiRequest<Paginated<Employee>>(`/api/employees${toQueryString(params)}`),
    // Keep showing the current page while the next one loads, so the table doesn't flash empty.
    placeholderData: keepPreviousData,
  })
}

export function useLookups() {
  return useQuery({
    queryKey: queryKeys.lookups,
    queryFn: () => apiRequest<Lookups>('/api/lookups'),
    staleTime: 5 * 60_000,
  })
}

export function useCountriesOverview() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: () => apiRequest<CountriesOverview>('/api/insights/countries'),
  })
}

export function useCountryInsights(code: string) {
  return useQuery({
    queryKey: queryKeys.countryInsights(code),
    queryFn: () => apiRequest<CountryInsights>(`/api/insights/countries/${encodeURIComponent(code)}`),
  })
}

// Any change to an employee can change lists, lookups and every aggregate.
function useInvalidateEmployeeData() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.employees }),
      queryClient.invalidateQueries({ queryKey: queryKeys.lookups }),
      queryClient.invalidateQueries({ queryKey: queryKeys.insights }),
    ])
}

export function useSaveEmployee() {
  const invalidate = useInvalidateEmployeeData()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: EmployeeInput }) =>
      id
        ? apiRequest<Employee>(`/api/employees/${id}`, { method: 'PATCH', body: { employee: input } })
        : apiRequest<Employee>('/api/employees', { method: 'POST', body: { employee: input } }),
    onSuccess: invalidate,
  })
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployeeData()
  return useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/api/employees/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
