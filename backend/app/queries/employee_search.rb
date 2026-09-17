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
    total = filtered.count
    # A page past the end (e.g. after deleting the last row on it) returns the
    # last page instead of an empty one; this also bounds the SQL offset.
    page = requested_page.clamp(1, [ (total.to_f / per_page).ceil, 1 ].max)

    Result.new(
      records: filtered.order(order_clause).limit(per_page).offset((page - 1) * per_page).to_a,
      page: page,
      per_page: per_page,
      total: total
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
    direction = param(:direction)&.downcase == "desc" ? "DESC" : "ASC"
    # id as a tie-breaker keeps pagination stable when sort values repeat
    Arel.sql("#{sort_expression(column)} #{direction}, id ASC")
  end

  # The UI shows country names, so sort by name. The CASE is built only from
  # the constant country list, never from user input.
  def sort_expression(column)
    return column unless column == "country_code"

    whens = Countries::LIST.map { |code, attrs| "WHEN '#{code}' THEN #{Employee.connection.quote(attrs[:name])}" }
    "CASE country_code #{whens.join(' ')} END"
  end

  def requested_page
    [ param(:page).to_i, 1 ].max
  end

  def per_page
    @per_page ||= param(:per_page) ? param(:per_page).to_i.clamp(1, MAX_PER_PAGE) : DEFAULT_PER_PAGE
  end

  def param(key)
    @params[key].to_s.strip.presence
  end
end
