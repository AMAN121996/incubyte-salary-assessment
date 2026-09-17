# syntax=docker/dockerfile:1
# One image serves both the Rails API and the built React app (same origin, no CORS).
#
#   docker build -t acme-salary .
#   docker run -p 3000:3000 -e SECRET_KEY_BASE=$(openssl rand -hex 64) -e FORCE_SSL=false \
#     -v acme-salary-data:/rails/storage acme-salary

ARG RUBY_VERSION=3.3.3
ARG NODE_VERSION=22

# ---- 1. Build the React frontend -------------------------------------------
FROM node:${NODE_VERSION}-slim AS frontend
WORKDIR /frontend
RUN corepack enable
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

# ---- 2. Install gems ---------------------------------------------------------
FROM ruby:${RUBY_VERSION}-slim AS base
WORKDIR /rails
ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT="development:test"
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 sqlite3 && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

FROM base AS gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
COPY backend/Gemfile backend/Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# ---- 3. Runtime image --------------------------------------------------------
FROM base
COPY --from=gems "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY backend/ ./
COPY --from=frontend /frontend/dist/assets ./public/assets
COPY --from=frontend /frontend/dist/favicon.svg ./public/favicon.svg
COPY --from=frontend /frontend/dist/index.html ./vendor/frontend/index.html

RUN bundle exec bootsnap precompile app/ lib/ && \
    groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    mkdir -p storage log tmp && chown -R rails:rails storage log tmp
USER 1000:1000

ENV LD_PRELOAD="libjemalloc.so.2" PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -fsS http://localhost:${PORT}/up || exit 1

# db:prepare creates, migrates and (only for a brand-new database) seeds 10,000 employees.
ENTRYPOINT ["./bin/docker-entrypoint"]
CMD ["./bin/rails", "server", "-b", "0.0.0.0"]
