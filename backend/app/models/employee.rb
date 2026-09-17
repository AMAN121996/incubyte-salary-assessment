class Employee < ApplicationRecord
  EMAIL_FORMAT = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/

  normalizes :full_name, :job_title, :department, with: ->(value) { value.strip }
  normalizes :email, with: ->(value) { value.strip.downcase }
  normalizes :country_code, with: ->(value) { value.strip.upcase }

  validates :full_name, presence: true, length: { maximum: 120 }
  validates :email, presence: true, format: { with: EMAIL_FORMAT }, uniqueness: true
  validates :job_title, :department, presence: true, length: { maximum: 80 }
  validates :salary, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :hired_on, presence: true
  validate :country_must_be_supported
  validate :hired_on_cannot_be_in_the_future

  # Currency is always derived from the country, so a salary can never be
  # recorded in a currency that does not match where the person is paid.
  before_validation { self.currency = Countries.currency_for(country_code) }

  private

  def country_must_be_supported
    errors.add(:country_code, "is not a supported country") unless Countries.supported?(country_code)
  end

  def hired_on_cannot_be_in_the_future
    errors.add(:hired_on, "can't be in the future") if hired_on.present? && hired_on > Date.current
  end
end
