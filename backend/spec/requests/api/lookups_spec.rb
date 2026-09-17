require "rails_helper"

RSpec.describe "Lookups API" do
  it "returns supported countries and the distinct departments and job titles in use" do
    create(:employee, department: "Sales", job_title: "Account Executive")
    create(:employee, department: "Engineering", job_title: "Software Engineer")
    create(:employee, department: "Sales", job_title: "Account Executive")

    get "/api/lookups"

    json = response.parsed_body
    expect(response).to have_http_status(:ok)
    expect(json["countries"]).to include({ "code" => "IN", "name" => "India", "currency" => "INR" })
    expect(json["departments"]).to eq(%w[Engineering Sales])
    expect(json["job_titles"]).to eq(["Account Executive", "Software Engineer"])
  end
end
