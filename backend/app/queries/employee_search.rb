# Turns untrusted list parameters (search, filters, sort, pagination) into a
# safe, indexed query. Everything user-supplied is either bound as a value or
# checked against a whitelist, so nothing reaches SQL unescaped.
class EmployeeSearch
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100
  SORTABLE_COLUMNS = %w[full_name job_title department country_code salary hired_on].freeze
  DEFAULT_SORT = "full_name".freeze

  Result = Data.define(:records, :page, :per_page, :total) do
    def total_pages
      (total.to_f / per_page).ceil
    end

    def meta
      { page: page, per_page: per_page, total: total, total_pages: total_pages }
    end
  end

  def initialize(params, scope: Employee.all)
    @params = params.to_h.symbolize_keys
    @scope = scope
  end

  def call
    filtered = apply_filters(@scope)
    Result.new(
      records: filtered.order(order_clause).limit(per_page).offset((page - 1) * per_page).to_a,
      page: page,
      per_page: per_page,
      total: filtered.count
    )
  end

  private

  def apply_filters(scope)
    scope = scope.where(country_code: param(:country).upcase) if param(:country)
    scope = scope.where(department: param(:department)) if param(:department)
    scope = scope.where(job_title: param(:job_title)) if param(:job_title)

    if param(:q)
      pattern = "%#{Employee.sanitize_sql_like(param(:q))}%"
      scope = scope.where("full_name LIKE :p ESCAPE '\\' OR email LIKE :p ESCAPE '\\'", p: pattern)
    end

    scope
  end

  def order_clause
    column = SORTABLE_COLUMNS.include?(param(:sort)) ? param(:sort) : DEFAULT_SORT
    direction = param(:direction)&.downcase == "desc" ? :desc : :asc
    # id as a tie-breaker keeps pagination stable when sort values repeat
    { column => direction, id: :asc }
  end

  def page
    @page ||= [ param(:page).to_i, 1 ].max
  end

  def per_page
    @per_page ||= param(:per_page) ? param(:per_page).to_i.clamp(1, MAX_PER_PAGE) : DEFAULT_PER_PAGE
  end

  def param(key)
    @params[key].to_s.strip.presence
  end
end
