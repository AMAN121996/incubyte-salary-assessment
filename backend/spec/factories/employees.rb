FactoryBot.define do
  factory :employee do
    sequence(:full_name) { |n| "Employee #{n}" }
    sequence(:email) { |n| "employee#{n}@acme.test" }
    job_title { "Software Engineer" }
    department { "Engineering" }
    country_code { "US" }
    salary { 100_000 }
    hired_on { Date.new(2020, 1, 15) }
  end
end
