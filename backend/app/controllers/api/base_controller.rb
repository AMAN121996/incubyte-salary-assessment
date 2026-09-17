module Api
  class BaseController < ApplicationController
    rescue_from ActiveRecord::RecordNotFound do |error|
      render json: { error: "#{error.model || 'Record'} not found" }, status: :not_found
    end

    rescue_from ActionController::ParameterMissing do |error|
      render json: { error: error.message }, status: :bad_request
    end

    private

    def render_validation_errors(record)
      render json: { errors: record.errors.to_hash }, status: :unprocessable_content
    end
  end
end
