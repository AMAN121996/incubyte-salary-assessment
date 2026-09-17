module EmployeeSerializer
  module_function

  def call(employee)
    {
      id: employee.id,
      full_name: employee.full_name,
      email: employee.email,
      job_title: employee.job_title,
      department: employee.department,
      country_code: employee.country_code,
      country_name: Countries.name_for(employee.country_code),
      currency: employee.currency,
      salary: employee.salary,
      hired_on: employee.hired_on&.iso8601
    }
  end
end
