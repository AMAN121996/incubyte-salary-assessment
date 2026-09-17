export type Employee = {
  id: number
  full_name: string
  email: string
  job_title: string
  department: string
  country_code: string
  country_name: string
  currency: string
  salary: number
  hired_on: string
}

export type EmployeeInput = Pick<
  Employee,
  'full_name' | 'email' | 'job_title' | 'department' | 'country_code' | 'salary' | 'hired_on'
>

export type PageMeta = {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export type Paginated<T> = { data: T[]; meta: PageMeta }

export type SortDirection = 'asc' | 'desc'

export type EmployeeListParams = {
  q?: string
  country?: string
  department?: string
  job_title?: string
  sort?: string
  direction?: SortDirection
  page?: number
  per_page?: number
}

export type Country = { code: string; name: string; currency: string }

export type Lookups = {
  countries: Country[]
  departments: string[]
  job_titles: string[]
}

export type SalaryStats = {
  headcount: number
  min: number | null
  max: number | null
  average: number | null
  median: number | null
  p25: number | null
  p75: number | null
}

export type CountryHeader = { country_code: string; country_name: string; currency: string }

export type CountriesOverview = {
  total_headcount: number
  countries: (CountryHeader & SalaryStats)[]
}

export type GroupStats = SalaryStats & { name: string }

export type CountryInsights = CountryHeader & {
  summary: SalaryStats
  by_job_title: GroupStats[]
  by_department: GroupStats[]
}
