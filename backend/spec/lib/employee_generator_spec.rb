require "rails_helper"

RSpec.describe EmployeeGenerator do
  subject(:generator) { described_class.new(seed: 42) }

  it "generates the requested number of rows" do
    expect(generator.rows(250).size).to eq(250)
  end

  it "is deterministic for a given seed" do
    expect(described_class.new(seed: 7).rows(50)).to eq(described_class.new(seed: 7).rows(50))
    expect(described_class.new(seed: 7).rows(50)).not_to eq(described_class.new(seed: 8).rows(50))
  end

  it "produces rows that pass Employee validations" do
    generator.rows(300).each do |row|
      employee = Employee.new(row)
      expect(employee).to be_valid, "#{row.inspect}: #{employee.errors.full_messages}"
    end
  end

  it "produces unique emails" do
    emails = generator.rows(2_000).map { |row| row[:email] }
    expect(emails.uniq.size).to eq(emails.size)
  end

  it "keeps job titles inside their department" do
    generator.rows(300).each do |row|
      expect(EmployeeGenerator::ROLES.fetch(row[:department]).keys).to include(row[:job_title])
    end
  end

  it "prices salaries within the role's band in the country's currency, in round thousands" do
    generator.rows(300).each do |row|
      band = EmployeeGenerator::ROLES.fetch(row[:department]).fetch(row[:job_title])
      factor = EmployeeGenerator::PAY_FACTORS.fetch(row[:country_code])

      expect(row[:salary] % 1_000).to eq(0)
      expect(row[:salary]).to be_between((band.min * factor).floor(-3), (band.max * factor).ceil(-3))
    end
  end

  it "spreads employees across every supported country" do
    countries = generator.rows(2_000).map { |row| row[:country_code] }.uniq
    expect(countries).to match_array(Countries.codes)
  end
end
