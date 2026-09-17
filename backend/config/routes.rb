Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :employees, only: %i[index show create update destroy]
    resource :lookups, only: :show
  end
end
