require "rails_helper"

RSpec.describe SalaryInsights do
  before do
    create(:employee, country_code: "IN", job_title: "Engineer", department: "Engineering", salary: 1_000_000)
    create(:employee, country_code: "IN", job_title: "Engineer", department: "Engineering", salary: 2_000_000)
    create(:employee, country_code: "IN", job_title: "Recruiter", department: "People", salary: 600_000)
    create(:employee, country_code: "US", job_title: "Engineer", department: "Engineering", salary: 150_000)
  end

  describe ".countries" do
    it "summarises headcount and pay per country in local currency, largest first" do
      result = described_class.countries

      expect(result[:total_headcount]).to eq(4)
      expect(result[:countries]).to eq([
        { country_code: "IN", country_name: "India", currency: "INR",
          headcount: 3, min: 600_000, max: 2_000_000, average: 1_200_000, median: 1_000_000, p25: 800_000, p75: 1_500_000 },
        { country_code: "US", country_name: "United States", currency: "USD",
          headcount: 1, min: 150_000, max: 150_000, average: 150_000, median: 150_000, p25: 150_000, p75: 150_000 }
      ])
    end
  end

  describe ".country" do
    it "returns the country summary with job-title and department breakdowns" do
      result = described_class.country("in")

      expect(result).to include(country_code: "IN", country_name: "India", currency: "INR")
      expect(result[:summary]).to include(headcount: 3, min: 600_000, max: 2_000_000)
      expect(result[:by_job_title]).to eq([
        { name: "Engineer", headcount: 2, min: 1_000_000, max: 2_000_000, average: 1_500_000, median: 1_500_000, p25: 1_250_000, p75: 1_750_000 },
        { name: "Recruiter", headcount: 1, min: 600_000, max: 600_000, average: 600_000, median: 600_000, p25: 600_000, p75: 600_000 }
      ])
      expect(result[:by_department].map { |d| [ d[:name], d[:headcount] ] }).to eq([ [ "Engineering", 2 ], [ "People", 1 ] ])
    end

    it "returns an empty summary for a supported country with no employees" do
      result = described_class.country("JP")

      expect(result[:summary]).to include(headcount: 0, average: nil)
      expect(result[:by_job_title]).to eq([])
    end

    it "raises for an unsupported country" do
      expect { described_class.country("ZZ") }.to raise_error(SalaryInsights::UnknownCountry)
    end
  end
end
