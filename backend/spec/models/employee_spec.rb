require "rails_helper"

RSpec.describe Employee do
  subject(:employee) { build(:employee) }

  describe "validations" do
    it "is valid with the factory defaults" do
      expect(employee).to be_valid
    end

    it { is_expected.to validate_presence_of(:full_name) }
    it { is_expected.to validate_length_of(:full_name).is_at_most(120) }
    it { is_expected.to validate_presence_of(:job_title) }
    it { is_expected.to validate_presence_of(:department) }
    it { is_expected.to validate_presence_of(:hired_on) }

    it "requires a well-formed email" do
      employee.email = "not-an-email"
      expect(employee).not_to be_valid
      expect(employee.errors[:email]).to include("is invalid")
    end

    it "requires a unique email regardless of case" do
      create(:employee, email: "jane@acme.test")
      employee.email = "JANE@acme.test"

      expect(employee).not_to be_valid
      expect(employee.errors[:email]).to include("has already been taken")
    end

    it "requires a supported country" do
      employee.country_code = "ZZ"
      expect(employee).not_to be_valid
      expect(employee.errors[:country_code]).to include("is not a supported country")
    end

    it "requires a positive whole-number salary" do
      expect(build(:employee, salary: 0)).not_to be_valid
      expect(build(:employee, salary: -1)).not_to be_valid
      expect(build(:employee, salary: 1_000.5)).not_to be_valid
      expect(build(:employee, salary: nil)).not_to be_valid
    end

    it "rejects a hire date in the future" do
      employee.hired_on = Date.current + 1
      expect(employee).not_to be_valid
      expect(employee.errors[:hired_on]).to include("can't be in the future")
    end
  end

  describe "normalisation" do
    it "strips whitespace and lowercases the email" do
      employee = create(:employee, full_name: "  Jane Doe ", email: " Jane@ACME.test ")

      expect(employee.full_name).to eq("Jane Doe")
      expect(employee.email).to eq("jane@acme.test")
    end

    it "upcases the country code" do
      expect(create(:employee, country_code: "in").country_code).to eq("IN")
    end
  end

  describe "currency" do
    it "is derived from the country on create" do
      expect(create(:employee, country_code: "IN").currency).to eq("INR")
    end

    it "follows the country when the employee relocates" do
      employee = create(:employee, country_code: "US")
      employee.update!(country_code: "GB")

      expect(employee.currency).to eq("GBP")
    end

    it "cannot be set independently of the country" do
      employee = create(:employee, country_code: "US", currency: "JPY")
      expect(employee.currency).to eq("USD")
    end
  end
end
