module Api
  class InsightsController < BaseController
    rescue_from SalaryInsights::UnknownCountry do
      render json: { error: "Country not found" }, status: :not_found
    end

    def countries
      render json: SalaryInsights.countries
    end

    def country
      render json: SalaryInsights.country(params[:code])
    end
  end
end
