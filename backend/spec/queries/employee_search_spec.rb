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
      expect(search(sort: "salary", direction: "desc").records.map(&:salary)).to eq([300, 200, 100])
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

    it "uses a default page size" do
      expect(search.meta[:per_page]).to eq(EmployeeSearch::DEFAULT_PER_PAGE)
    end
  end
end
