require "rails_helper"

RSpec.describe SalaryStatistics do
  it "summarises a list of salaries" do
    stats = described_class.new([ 40, 10, 30, 20 ])

    expect(stats.to_h).to eq(
      headcount: 4,
      min: 10,
      max: 40,
      average: 25,
      median: 25,
      p25: 18,
      p75: 33
    )
  end

  it "takes the middle value as the median for an odd count" do
    expect(described_class.new([ 5, 1, 3 ]).median).to eq(3)
  end

  it "handles a single salary" do
    expect(described_class.new([ 70_000 ]).to_h).to include(min: 70_000, max: 70_000, median: 70_000, p25: 70_000, p75: 70_000)
  end

  it "matches Excel PERCENTILE.INC (linear interpolation) so HR can reconcile numbers" do
    # =PERCENTILE.INC({15,20,35,40,50}, 0.25) => 20 ; 0.9 => 46
    stats = described_class.new([ 15, 20, 35, 40, 50 ])

    expect(stats.percentile(0.25)).to eq(20)
    expect(stats.percentile(0.9)).to eq(46)
  end

  it "rounds averages half up to whole currency units" do
    expect(described_class.new([ 1, 2 ]).average).to eq(2)
    expect(described_class.new([ 1, 1, 2 ]).average).to eq(1)
  end

  it "returns nils (not errors) for an empty list" do
    expect(described_class.new([]).to_h).to eq(headcount: 0, min: nil, max: nil, average: nil, median: nil, p25: nil, p75: nil)
  end

  it "rejects percentiles outside 0..1" do
    expect { described_class.new([ 1 ]).percentile(1.5) }.to raise_error(ArgumentError)
  end
end
