# Serves the built React app for any non-API path so client-side routes
# (e.g. /insights/IN) work on refresh and deep links. index.html is served
# with no-cache: its hashed JS/CSS assets are cached for a year by the static
# file server, so a new deploy is picked up on the next page load.
class SpaController < ApplicationController
  def show
    index_path = Rails.configuration.x.spa_index_path

    if File.exist?(index_path)
      response.headers["Cache-Control"] = "no-cache"
      render html: File.read(index_path).html_safe
    else
      render plain: "Frontend not built. Run the React dev server or build the Docker image.", status: :not_found
    end
  end
end
