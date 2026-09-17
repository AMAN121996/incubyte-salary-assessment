# Turns untrusted list parameters (search, filters, sort, pagination) into a
# safe, indexed query. Everything user-supplied is either bound as a value or
# checked against a whitelist, so nothing reaches SQL unescaped.
class EmployeeSearch
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100
  DEFAULT_SORT = "full_name".freeze

  # Whitelist of sortable columns -> SQL, built only from constants. The UI
  # shows country names, so country sorts by name rather than ISO code.
  SORT_EXPRESSIONS = {
    "full_name" => "full_name",
    "job_title" => "job_title",
    "department" => "department",
    "country_code" => "CASE country_code #{Countries::LIST.map { |code, c| "WHEN '#{code}' THEN '#{c[:name].gsub("'", "''")}'" }.join(' ')} END",
    "salary" => "salary",
    "hired_on" => "hired_on"
  }.freeze

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
      records: filtered.order(*order_clause).limit(per_page).offset((page - 1) * per_page).to_a,
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
    expression = Arel.sql(SORT_EXPRESSIONS.fetch(param(:sort), SORT_EXPRESSIONS.fetch(DEFAULT_SORT)))
    direction = param(:direction)&.downcase == "desc" ? expression.desc : expression.asc
    # id as a tie-breaker keeps pagination stable when sort values repeat
    [ direction, { id: :asc } ]
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
