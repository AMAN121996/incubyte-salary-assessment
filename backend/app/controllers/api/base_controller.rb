module Api
  class BaseController < ApplicationController
    rescue_from ActiveRecord::RecordNotFound do |error|
      render json: { error: "#{error.model || 'Record'} not found" }, status: :not_found
    end

    # The model's uniqueness validation cannot stop two simultaneous saves;
    # the unique index does, and the client gets the same field error.
    rescue_from ActiveRecord::RecordNotUnique do
      render json: { errors: { email: [ "has already been taken" ] } }, status: :unprocessable_content
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
