import type { CountriesOverview, CountryInsights } from '../../api/types'

export const overview: CountriesOverview = {
  total_headcount: 3100,
  countries: [
    { country_code: 'US', country_name: 'United States', currency: 'USD', headcount: 3000, min: 40000, max: 230000, average: 110000, median: 105000, p25: 80000, p75: 140000 },
    { country_code: 'IN', country_name: 'India', currency: 'INR', headcount: 100, min: 1000000, max: 5750000, average: 2750000, median: 2600000, p25: 1900000, p75: 3500000 },
  ],
}

export const india: CountryInsights = {
  country_code: 'IN',
  country_name: 'India',
  currency: 'INR',
  summary: { headcount: 100, min: 1000000, max: 5750000, average: 2750000, median: 2600000, p25: 1900000, p75: 3500000 },
  by_job_title: [
    { name: 'Recruiter', headcount: 10, min: 1375000, max: 2375000, average: 1900000, median: 1850000, p25: 1600000, p75: 2100000 },
    { name: 'Software Engineer', headcount: 90, min: 2250000, max: 3500000, average: 2900000, median: 2875000, p25: 2600000, p75: 3200000 },
  ],
  by_department: [
    { name: 'Engineering', headcount: 90, min: 2250000, max: 3500000, average: 2900000, median: 2875000, p25: 2600000, p75: 3200000 },
    { name: 'People', headcount: 10, min: 1375000, max: 2375000, average: 1900000, median: 1850000, p25: 1600000, p75: 2100000 },
  ],
}
