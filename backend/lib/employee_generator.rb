# Builds realistic, reproducible employee rows for seeding.
#
# Pure: it touches no database, so it is fast to test, and the seed task
# decides how to persist rows (bulk insert). A fixed seed gives identical
# data on every machine, which keeps demos and bug reports reproducible.
class EmployeeGenerator
  NAMES_DIR = Rails.root.join("db/seeds")

  # Annual pay band per role in a USD-equivalent baseline.
  ROLES = {
    "Engineering" => {
      "Software Engineer" => 90_000..140_000,
      "Senior Software Engineer" => 130_000..190_000,
      "Engineering Manager" => 160_000..230_000,
      "QA Engineer" => 70_000..110_000,
      "DevOps Engineer" => 95_000..150_000
    },
    "Product" => {
      "Product Manager" => 110_000..170_000,
      "Product Designer" => 85_000..135_000
    },
    "Sales" => {
      "Account Executive" => 60_000..110_000,
      "Sales Manager" => 100_000..160_000
    },
    "Marketing" => {
      "Marketing Specialist" => 55_000..90_000,
      "Marketing Manager" => 95_000..145_000
    },
    "Finance" => {
      "Accountant" => 55_000..90_000,
      "Financial Analyst" => 70_000..115_000
    },
    "People" => {
      "HR Generalist" => 55_000..85_000,
      "Recruiter" => 55_000..95_000
    },
    "Customer Support" => {
      "Support Specialist" => 40_000..65_000,
      "Support Team Lead" => 60_000..90_000
    }
  }.freeze

  # Local-currency units per baseline unit. Combines local pay levels and
  # currency so bands look plausible per market; not an FX rate.
  PAY_FACTORS = {
    "US" => 1.0, "GB" => 0.65, "DE" => 0.7, "FR" => 0.62, "CA" => 1.0,
    "AU" => 1.05, "SG" => 1.0, "JP" => 90.0, "IN" => 25.0, "BR" => 2.0
  }.freeze

  # Relative headcount per country.
  COUNTRY_WEIGHTS = {
    "US" => 30, "IN" => 25, "GB" => 10, "DE" => 8, "CA" => 6,
    "BR" => 5, "FR" => 5, "AU" => 4, "SG" => 4, "JP" => 3
  }.freeze

  # Relative headcount per department.
  DEPARTMENT_WEIGHTS = {
    "Engineering" => 35, "Customer Support" => 15, "Sales" => 15, "Product" => 10,
    "Marketing" => 9, "Finance" => 8, "People" => 8
  }.freeze

  EARLIEST_HIRE_DATE = Date.new(2012, 1, 1)
  HIRE_DATE_SPAN_DAYS = (Date.new(2026, 6, 30) - EARLIEST_HIRE_DATE).to_i

  def initialize(seed: 42, first_names: read_names("first_names.txt"), last_names: read_names("last_names.txt"))
    @seed = seed
    @first_names = first_names
    @last_names = last_names
  end

  def rows(count)
    random = Random.new(@seed)
    Array.new(count) { |index| build_row(random, index) }
  end

  private

  def build_row(random, index)
    first = @first_names.sample(random: random)
    last = @last_names.sample(random: random)
    country = weighted_pick(COUNTRY_WEIGHTS, random)
    department = weighted_pick(DEPARTMENT_WEIGHTS, random)
    job_title, band = ROLES.fetch(department).to_a.sample(random: random)

    {
      full_name: "#{first} #{last}",
      email: "#{slug(first)}.#{slug(last)}.#{index + 1}@acme.com",
      job_title: job_title,
      department: department,
      country_code: country,
      salary: (random.rand(band) * PAY_FACTORS.fetch(country)).round(-3),
      hired_on: EARLIEST_HIRE_DATE + random.rand(0..HIRE_DATE_SPAN_DAYS)
    }
  end

  def weighted_pick(weights, random)
    target = random.rand(weights.values.sum)
    weights.each do |key, weight|
      return key if target < weight

      target -= weight
    end
  end

  def slug(name)
    name.downcase.gsub(/[^a-z]/, "")
  end

  def read_names(file)
    NAMES_DIR.join(file).readlines(chomp: true).reject(&:blank?)
  end
end
