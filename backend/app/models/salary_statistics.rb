# Pure descriptive statistics over a list of whole-number salaries.
#
# Percentiles use linear interpolation between closest ranks, the same method
# as Excel's PERCENTILE.INC / MEDIAN, so HR can reconcile figures with the
# spreadsheets they are migrating from. Results are rounded half-up to whole
# currency units; exact Rational arithmetic avoids float drift before rounding.
class SalaryStatistics
  def initialize(salaries)
    @sorted = salaries.sort
  end

  def headcount = @sorted.size

  def min = @sorted.first

  def max = @sorted.last

  def average
    return if @sorted.empty?

    Rational(@sorted.sum, headcount).round(half: :up)
  end

  def median = percentile(0.5)

  def percentile(fraction)
    raise ArgumentError, "percentile must be between 0 and 1" unless (0..1).cover?(fraction)
    return if @sorted.empty?

    rank = fraction.rationalize * (headcount - 1)
    lower = rank.floor
    upper = [ lower + 1, headcount - 1 ].min
    value = @sorted[lower] + (rank - lower) * (@sorted[upper] - @sorted[lower])
    value.round(half: :up)
  end

  def to_h
    { headcount:, min:, max:, average:, median:, p25: percentile(0.25), p75: percentile(0.75) }
  end
end
