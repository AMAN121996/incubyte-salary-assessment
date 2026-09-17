module Api
  class LookupsController < BaseController
    def show
      render json: {
        countries: Countries.all,
        departments: Employee.distinct.order(:department).pluck(:department),
        job_titles: Employee.distinct.order(:job_title).pluck(:job_title)
      }
    end
  end
end
