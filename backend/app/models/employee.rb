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

  # The HR manager may be in any time zone; the furthest ahead is UTC+14.
  LATEST_UTC_OFFSET = 14.hours

  # Currency is derived from the country, so a salary can never be recorded in
  # a currency that does not match where the person is paid. It is only
  # re-derived when the country changes, so existing records keep the
  # currency they were recorded in.
  before_validation :derive_currency, if: -> { new_record? || will_save_change_to_country_code? }

  private

  def derive_currency
    self.currency = Countries.currency_for(country_code)
  end

  def country_must_be_supported
    errors.add(:country_code, "is not a supported country") unless Countries.supported?(country_code)
  end

  def hired_on_cannot_be_in_the_future
    latest_local_date = (Time.now.utc + LATEST_UTC_OFFSET).to_date
    errors.add(:hired_on, "can't be in the future") if hired_on.present? && hired_on > latest_local_date
  end
end
