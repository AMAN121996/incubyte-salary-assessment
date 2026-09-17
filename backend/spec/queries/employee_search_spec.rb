require "rails_helper"

RSpec.describe EmployeeSearch do
  def search(**params)
    described_class.new(params).call
  end

  describe "filtering" do
    let!(:ana)   { create(:employee, full_name: "Ana Silva", email: "ana@acme.test", country_code: "BR", department: "Sales", job_title: "Account Executive") }
    let!(:ravi)  { create(:employee, full_name: "Ravi Kumar", email: "ravi@acme.test", country_code: "IN", department: "Engineering", job_title: "Software Engineer") }
    let!(:anita) { create(:employee, full_name: "Anita Rao", email: "a.rao@acme.test", country_code: "IN", department: "Sales", job_title: "Account Executive") }

    it "returns everyone when no filters are given" do
      expect(search.records).to contain_exactly(ana, ravi, anita)
    end

    it "matches the query against name, case-insensitively" do
      expect(search(q: "ANA").records).to contain_exactly(ana)
      expect(search(q: "an").records).to contain_exactly(ana, anita)
    end

    it "matches the query against email" do
      expect(search(q: "a.rao").records).to contain_exactly(anita)
    end

    it "treats LIKE wildcards in the query literally" do
      expect(search(q: "%").records).to be_empty
      expect(search(q: "_").records).to be_empty
    end

    it "filters by country, department and job title and combines them" do
      expect(search(country: "IN").records).to contain_exactly(ravi, anita)
      expect(search(country: "in", department: "Sales").records).to contain_exactly(anita)
      expect(search(job_title: "Account Executive").records).to contain_exactly(ana, anita)
    end

    it "ignores blank filters" do
      expect(search(q: " ", country: "", department: nil).records.size).to eq(3)
    end
  end

  describe "sorting" do
    before do
      create(:employee, full_name: "Bea", salary: 300)
      create(:employee, full_name: "Abe", salary: 100)
      create(:employee, full_name: "Cal", salary: 200)
    end

    it "sorts by full name ascending by default" do
      expect(search.records.map(&:full_name)).to eq(%w[Abe Bea Cal])
    end

    it "sorts by a whitelisted column and direction" do
      expect(search(sort: "salary", direction: "desc").records.map(&:salary)).to eq([ 300, 200, 100 ])
    end

    it "sorts countries by their displayed name, not their ISO code" do
      create(:employee, full_name: "Uma", country_code: "GB") # United Kingdom
      create(:employee, full_name: "Ira", country_code: "IN") # India
      create(:employee, full_name: "Dee", country_code: "DE") # Germany

      names = search(sort: "country_code").records.map(&:country_code).uniq
      expect(names).to eq(%w[DE IN GB US])
    end

    it "falls back to defaults for unknown columns or directions" do
      result = search(sort: "salary; DROP TABLE employees", direction: "sideways")
      expect(result.records.map(&:full_name)).to eq(%w[Abe Bea Cal])
    end
  end

  describe "pagination" do
    before { create_list(:employee, 5) }

    it "returns the requested page with metadata" do
      result = search(page: 2, per_page: 2)

      expect(result.records.size).to eq(2)
      expect(result.meta).to eq(page: 2, per_page: 2, total: 5, total_pages: 3)
    end

    it "clamps page and per_page into valid ranges" do
      expect(search(page: -3, per_page: 0).meta).to include(page: 1, per_page: 1)
      expect(search(per_page: 10_000).meta).to include(per_page: EmployeeSearch::MAX_PER_PAGE)
    end

    it "returns the last page when asked for a page past the end" do
      result = search(page: 99, per_page: 2)

      expect(result.meta).to include(page: 3, total_pages: 3)
      expect(result.records.size).to eq(1)
    end

    it "handles absurdly large page numbers without overflowing the database offset" do
      expect(search(page: "9223372036854775807999").meta).to include(page: 1)
    end

    it "reports page 1 of 0 pages when nothing matches" do
      expect(search(q: "nobody").meta).to eq(page: 1, per_page: 25, total: 0, total_pages: 0)
    end

    it "uses a default page size" do
      expect(search.meta[:per_page]).to eq(EmployeeSearch::DEFAULT_PER_PAGE)
    end
  end
end
