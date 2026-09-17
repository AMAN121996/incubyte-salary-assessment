Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :employees, only: %i[index show create update destroy]
    resource :lookups, only: :show

    scope :insights, controller: :insights do
      get "countries", action: :countries
      get "countries/:code", action: :country
    end

    match "*path", to: ->(_env) { [ 404, { "content-type" => "application/json" }, [ '{"error":"Not found"}' ] ] }, via: :all
  end

  root "spa#show"
  get "*path", to: "spa#show", constraints: ->(request) { request.format.html? }
end
