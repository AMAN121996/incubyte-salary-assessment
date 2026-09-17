# Countries ACME employs people in, with the currency salaries are paid in.
# Kept in code (not the database) because the list changes rarely and
# must be identical across every environment.
module Countries
  LIST = {
    "AU" => { name: "Australia", currency: "AUD" },
    "BR" => { name: "Brazil", currency: "BRL" },
    "CA" => { name: "Canada", currency: "CAD" },
    "DE" => { name: "Germany", currency: "EUR" },
    "FR" => { name: "France", currency: "EUR" },
    "GB" => { name: "United Kingdom", currency: "GBP" },
    "IN" => { name: "India", currency: "INR" },
    "JP" => { name: "Japan", currency: "JPY" },
    "SG" => { name: "Singapore", currency: "SGD" },
    "US" => { name: "United States", currency: "USD" }
  }.freeze

  module_function

  def codes
    LIST.keys
  end

  def supported?(code)
    LIST.key?(code.to_s.upcase)
  end

  def currency_for(code)
    LIST.dig(code.to_s.upcase, :currency)
  end

  def name_for(code)
    LIST.dig(code.to_s.upcase, :name)
  end

  def all
    LIST.map { |code, attrs| { code: code, **attrs } }.sort_by { |c| c[:name] }
  end
end
