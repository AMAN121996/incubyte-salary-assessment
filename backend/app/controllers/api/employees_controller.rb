module Api
  class EmployeesController < BaseController
    before_action :set_employee, only: %i[show update destroy]

    def index
      result = EmployeeSearch.new(search_params).call
      render json: { data: result.records.map { |e| EmployeeSerializer.call(e) }, meta: result.meta }
    end

    def show
      render json: EmployeeSerializer.call(@employee)
    end

    def create
      employee = Employee.new(employee_params)

      if employee.save
        render json: EmployeeSerializer.call(employee), status: :created
      else
        render_validation_errors(employee)
      end
    end

    def update
      if @employee.update(employee_params)
        render json: EmployeeSerializer.call(@employee)
      else
        render_validation_errors(@employee)
      end
    end

    def destroy
      @employee.destroy!
      head :no_content
    end

    private

    def set_employee
      @employee = Employee.find(params[:id])
    end

    def search_params
      params.permit(:q, :country, :department, :job_title, :sort, :direction, :page, :per_page)
    end

    def employee_params
      params.expect(employee: %i[full_name email job_title department country_code salary hired_on])
    end
  end
end
