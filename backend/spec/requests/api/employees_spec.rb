require "rails_helper"

RSpec.describe "Employees API" do
  let(:json) { response.parsed_body }

  let(:valid_attributes) do
    {
      full_name: "Priya Sharma",
      email: "priya.sharma@acme.test",
      job_title: "Data Analyst",
      department: "Finance",
      country_code: "IN",
      salary: 1_800_000,
      hired_on: "2022-04-01"
    }
  end

  describe "GET /api/employees" do
    it "returns a filtered, paginated list with metadata" do
      create(:employee, full_name: "Ravi Kumar", country_code: "IN")
      create(:employee, full_name: "Ana Silva", country_code: "BR")

      get "/api/employees", params: { country: "IN", page: 1, per_page: 10 }

      expect(response).to have_http_status(:ok)
      expect(json["data"].map { |e| e["full_name"] }).to eq(["Ravi Kumar"])
      expect(json["meta"]).to eq("page" => 1, "per_page" => 10, "total" => 1, "total_pages" => 1)
    end
  end

  describe "GET /api/employees/:id" do
    it "returns the employee" do
      employee = create(:employee, full_name: "Jane Doe", country_code: "GB", salary: 65_000)

      get "/api/employees/#{employee.id}"

      expect(response).to have_http_status(:ok)
      expect(json).to include(
        "id" => employee.id,
        "full_name" => "Jane Doe",
        "country_code" => "GB",
        "country_name" => "United Kingdom",
        "currency" => "GBP",
        "salary" => 65_000,
        "hired_on" => "2020-01-15"
      )
    end

    it "returns 404 for an unknown employee" do
      get "/api/employees/0"

      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Employee not found")
    end
  end

  describe "POST /api/employees" do
    it "creates an employee and returns it" do
      expect {
        post "/api/employees", params: { employee: valid_attributes }, as: :json
      }.to change(Employee, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json).to include("full_name" => "Priya Sharma", "currency" => "INR", "salary" => 1_800_000)
    end

    it "returns field errors and does not persist invalid input" do
      expect {
        post "/api/employees", params: { employee: valid_attributes.merge(email: "bad", salary: -5) }, as: :json
      }.not_to change(Employee, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to include(
        "email" => ["is invalid"],
        "salary" => ["must be greater than 0"]
      )
    end

    it "ignores attributes that are not permitted" do
      post "/api/employees", params: { employee: valid_attributes.merge(id: 999, currency: "USD") }, as: :json

      expect(json["id"]).not_to eq(999)
      expect(json["currency"]).to eq("INR")
    end

    it "returns 400 when the employee payload is missing" do
      post "/api/employees", params: {}, as: :json

      expect(response).to have_http_status(:bad_request)
      expect(json["error"]).to match(/employee/)
    end
  end

  describe "PATCH /api/employees/:id" do
    it "updates the employee" do
      employee = create(:employee, salary: 90_000)

      patch "/api/employees/#{employee.id}", params: { employee: { salary: 95_000, job_title: "Senior Engineer" } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(employee.reload).to have_attributes(salary: 95_000, job_title: "Senior Engineer")
    end

    it "returns field errors for invalid changes" do
      employee = create(:employee)

      patch "/api/employees/#{employee.id}", params: { employee: { full_name: "" } }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]["full_name"]).to include("can't be blank")
    end
  end

  describe "DELETE /api/employees/:id" do
    it "removes the employee" do
      employee = create(:employee)

      expect { delete "/api/employees/#{employee.id}" }.to change(Employee, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
