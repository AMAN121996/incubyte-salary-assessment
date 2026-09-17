require "rails_helper"

RSpec.describe "Insights API" do
  let(:json) { response.parsed_body }

  before do
    create(:employee, country_code: "DE", job_title: "Designer", salary: 60_000)
    create(:employee, country_code: "DE", job_title: "Designer", salary: 70_000)
  end

  describe "GET /api/insights/countries" do
    it "returns the per-country overview" do
      get "/api/insights/countries"

      expect(response).to have_http_status(:ok)
      expect(json["total_headcount"]).to eq(2)
      expect(json["countries"].first).to include("country_code" => "DE", "currency" => "EUR", "average" => 65_000)
    end
  end

  describe "GET /api/insights/countries/:code" do
    it "returns the country drill-down" do
      get "/api/insights/countries/DE"

      expect(response).to have_http_status(:ok)
      expect(json["summary"]).to include("headcount" => 2, "median" => 65_000)
      expect(json["by_job_title"].first).to include("name" => "Designer", "headcount" => 2)
    end

    it "returns 404 for an unsupported country" do
      get "/api/insights/countries/ZZ"

      expect(response).to have_http_status(:not_found)
      expect(json["error"]).to eq("Country not found")
    end
  end
end
