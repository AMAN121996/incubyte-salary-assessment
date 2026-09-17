require "rails_helper"

RSpec.describe Countries do
  describe ".currency_for" do
    it "returns the ISO-4217 currency for a supported country" do
      expect(Countries.currency_for("IN")).to eq("INR")
      expect(Countries.currency_for("DE")).to eq("EUR")
    end

    it "is case-insensitive" do
      expect(Countries.currency_for("us")).to eq("USD")
    end

    it "returns nil for an unsupported country" do
      expect(Countries.currency_for("ZZ")).to be_nil
      expect(Countries.currency_for(nil)).to be_nil
    end
  end

  describe ".supported?" do
    it "is true only for configured countries" do
      expect(Countries.supported?("GB")).to be(true)
      expect(Countries.supported?("ZZ")).to be(false)
    end
  end

  describe ".all" do
    it "lists every country with its code, name and currency, sorted by name" do
      all = Countries.all

      expect(all).to include({ code: "IN", name: "India", currency: "INR" })
      expect(all.map { |c| c[:name] }).to eq(all.map { |c| c[:name] }.sort)
    end
  end
end
