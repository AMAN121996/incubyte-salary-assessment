# Answers "how does the org pay people?" questions.
#
# Figures are always grouped by country and reported in that country's local
# currency: summing or averaging across currencies would be meaningless
# without FX conversion, which is deliberately out of scope.
#
# Each method loads just the (group, salary) pairs it needs in one indexed
# query and derives every statistic from the same data via SalaryStatistics.
# At 10k employees that is a few milliseconds and keeps median/percentiles
# portable across databases.
module SalaryInsights
  class UnknownCountry < StandardError; end

  module_function

  def countries
    salaries_by_country = group_salaries(Employee.pluck(:country_code, :salary))

    rows = salaries_by_country.map do |code, salaries|
      country_header(code).merge(SalaryStatistics.new(salaries).to_h)
    end

    {
      total_headcount: rows.sum { |row| row[:headcount] },
      countries: rows.sort_by { |row| [ -row[:headcount], row[:country_code] ] }
    }
  end

  def country(code)
    code = code.to_s.upcase
    raise UnknownCountry, code unless Countries.supported?(code)

    rows = Employee.where(country_code: code).pluck(:job_title, :department, :salary)

    country_header(code).merge(
      summary: SalaryStatistics.new(rows.map(&:last)).to_h,
      by_job_title: breakdown(rows.map { |title, _dept, salary| [ title, salary ] }),
      by_department: breakdown(rows.map { |_title, dept, salary| [ dept, salary ] })
    )
  end

  def breakdown(pairs)
    group_salaries(pairs)
      .map { |name, salaries| { name: name, **SalaryStatistics.new(salaries).to_h } }
      .sort_by { |row| row[:name] }
  end

  def group_salaries(pairs)
    pairs.each_with_object(Hash.new { |h, k| h[k] = [] }) { |(key, salary), groups| groups[key] << salary }
  end

  def country_header(code)
    { country_code: code, country_name: Countries.name_for(code), currency: Countries.currency_for(code) }
  end

  private_class_method :breakdown, :group_salaries, :country_header
end
