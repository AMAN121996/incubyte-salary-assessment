require "rails_helper"

RSpec.describe "Single-page app fallback" do
  let(:index_file) { Rails.root.join("tmp/spa_spec_index.html") }

  around do |example|
    File.write(index_file, "<!doctype html><div id=\"root\"></div>")
    original = Rails.configuration.x.spa_index_path
    Rails.configuration.x.spa_index_path = index_file
    example.run
  ensure
    Rails.configuration.x.spa_index_path = original
    FileUtils.rm_f(index_file)
  end

  it "serves the React app for client-side routes, without long-lived caching" do
    get "/insights/IN"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include('<div id="root">')
    expect(response.headers["Cache-Control"]).to include("no-cache")
  end

  it "serves the React app at the root path" do
    get "/"
    expect(response.body).to include('<div id="root">')
  end

  it "does not swallow unknown API routes" do
    get "/api/unknown"

    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include('<div id="root">')
  end

  it "returns 404 when the frontend has not been built" do
    Rails.configuration.x.spa_index_path = Rails.root.join("tmp/missing.html")

    get "/employees"

    expect(response).to have_http_status(:not_found)
  end
end
