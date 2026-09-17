# Seeds ACME's 10,000 employees (override with SEED_EMPLOYEES=n).
#
# Rows come from the deterministic, unit-tested EmployeeGenerator and are
# bulk-inserted in batches: one INSERT per 1,000 rows instead of 10,000
# individual saves. insert_all skips model validations, which is why the
# generator's spec asserts that its rows pass them.
#
# Re-running replaces all employees, so the dataset is always the same.

count = Integer(ENV.fetch("SEED_EMPLOYEES", 10_000))
batch_size = 1_000

started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
now = Time.current

rows = EmployeeGenerator.new(seed: 42).rows(count).map do |row|
  row.merge(currency: Countries.currency_for(row[:country_code]), created_at: now, updated_at: now)
end

Employee.transaction do
  Employee.delete_all
  rows.each_slice(batch_size) { |batch| Employee.insert_all!(batch) }
end

elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
puts "Seeded #{Employee.count} employees in #{elapsed.round(2)}s"
