require 'spec_helper'

describe "VehicleJourney" do

  it "location_at should return correct distance" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    # Try every 1000 feet
    pd = 0
    pathd = jp.path_distance
    while pd < pathd do
      info = jp.location_info_at(pd)
      assert_equal pd, info[:distance], "incorrect distances"
      pd += 1000
    end
  end


  it "First location should be at the path distance of zero" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    coordinates = jp.journey_pattern_timing_links.first.from.location.coordinates["LonLat"]
    info = jp.location_info_at(0)

    # Due to round off error and different precisions we just make sure
    # that they are close enough.
    assert (coordinates[0] - info[:coord][0]).abs < 1E6, "Not the same longitude"
    assert (coordinates[1] - info[:coord][1]).abs < 1E6, "Not the same latitude"
  end

  # All JourneyPattern should be consistent.
  it "Fast location should be at the path distance" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    pd = jp.path_distance
    coordinates = jp.journey_pattern_timing_links.last.to.location.coordinates["LonLat"]
    info = jp.location_info_at(pd)

    # Due to round off error and different precisions we just make sure
    # that they are close enough.
    assert (coordinates[0] - info[:coord][0]).abs < 1E6, "Not the same longitude"
    assert (coordinates[1] - info[:coord][1]).abs < 1E6, "Not the same latitude"
  end

  it "next_from should return unchanged from path_distance" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    pd = jp.path_distance
    time = 10.seconds
    info = jp.next_from(pd, time)

    assert_equal pd, info[:distance], "incorrect distances"
    assert_equal time, info[:ti_remains], "incorrect times"
  end

  it "next_from should have consistency with its endpoints" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"


    pathd = jp.path_distance
    time = jp.duration.minutes

    info = jp.next_from(0,time)

    assert_equal pathd, info[:distance], "incorrect distances"
    assert_equal 0, info[:ti_remains], "incorrect times:"

    info = jp.next_from(pathd,time)

    assert_equal pathd, info[:distance], "incorrect distances"
    assert_equal time, info[:ti_remains], "incorrect times:"
  end

  it "next_from should have consistency with location_info_at" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    # Do this for the endpoints and somewhere in the middle.
    pathd = jp.path_distance
    for pd in [0, pathd/2, pathd] do
      info = jp.location_info_at(pd)
      assert_equal pd, info[:distance], "incorrect distances"

      time = info[:ti_dist]
      info2 = jp.next_from(0,time)

      assert_equal 0, info2[:ti_remains], "incorrect times"
      assert_in_delta info[:distance], info2[:distance], 10.0, "incorrect distances"

      # Due to round off error and different precisions we just make sure
      # that they are close enough.
      assert (info[:coord][0] - info2[:coord][0]).abs < 1E6, "Not the same longitude"
      assert (info[:coord][1] - info2[:coord][1]).abs < 1E6, "Not the same latitude"
    end
  end

  # All JourneyPattern should be consistent.
  it "next_from should have consistency with location_info_at" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    pd = jp.path_distance/2
    info = jp.location_info_at(pd)

    assert_equal info[:distance], pd, "Unequal Distances"

    time = info[:ti_dist]
    coordinates = info[:coord]
    info1 = jp.next_from(0,time)

    assert_equal pd, info[:distance], "Incompatible distances"

    # Due to round off error and different precisions we just make sure
    # that they are close enough.
    assert (coordinates[0] - info1[:coord][0]).abs < 1E6, "Not the same longitude"
    assert (coordinates[1] - info1[:coord][1]).abs < 1E6, "Not the same latitude"
  end

  it "get_possible should have consitency with location_info_at" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    pd = jp.path_distance/2
    info = jp.location_info_at(pd)

    ans = jp.get_possible(info[:coord], 60)

    assert_not_nil ans, "There should be at least one answer"
    found = false
    for a in ans do
      dist = a[:distance]
      if ((dist-pd).abs < 1E3)
        found = true
        # Due to round off error and different precisions we just make sure
        # that they are close enough.
        assert (a[:coord][0] - info[:coord][0]).abs < 1E6, "Not the same longitude"
        assert (a[:coord][1] - info[:coord][1]).abs < 1E6, "Not the same latitude"
      end
    end
    assert found, "No solution found"
  end

  def report(vj,time,distance)
    info = vj.journey_pattern.location_info_at(distance)

    rjl = ReportedJourneyLocation.new (
      :user_id => 1,
      :vehicle_journey_id => vj,
      :location => info[:coord],
      :direction => info[:direction],
      :speed => info[:speed],
      :reported_time => time,
      :recorded_time => time + 1.seconds)
    rjl.save!
    return rjl
  end

  it "figure_location with one ReportedJourneyLocation should be better than estimate" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    tm_start = Time.parse("0:00")+vj.start_time.minutes
    pd = jp.path_distance/2
    info_last = jp.location_info_at(pd)
    # let us assume it is exactly on schedule
    tm_last = tm_start + info_last[:ti_dist]

    # Lets report a location for 30 seconds from the last distance
    # and say we got there in 24 seconds.
    info = jp.next_from(pd, 30.seconds)
    rjl = report(vj,tm_last + 20.seconds, info[:distance])

    info2 = vj.figure_location(info_last[:distance], tm_last, tm_last+(24.seconds), tm_start)
    coordinates = info2[:coord]

    # Due to round off error and different precisions we just make sure
    # that they are close enough.
    assert_in_delta coordinates[0], rjl.location[0], 1E6, "Not the same longitude"
    assert_in_delta coordinates[1], rjl.location[1], 1E6, "Not the same latitude"
    assert info2[:reported]
  end

  def report_many(vj,tm_start, distance,deltas)
    info = vj.journey_pattern.location_info_at(distance)
    tm_last = tm_start + info[:ti_dist]
    for t,d in deltas do
      report(vj,tm_last + t, info[:distance] + d)
    end
    return tm_last
  end


  it "figure_location with one ReportedJourneyLocation should be better than estimate" do
    vj = VehicleJourney.first
    assert_not_nil vj, "Database not initialized. VehicleJourney"
    jp = vj.journey_pattern
    assert_not_nil jp, "Database not initialized. JourneyPattern"
    assert jp.check_consistency!, "JourneyPattern not consistent"

    pd = jp.path_distance/2
    deltas = [ [30.seconds, 40], [40.seconds, 500], [23.seconds,900], [32.seconds, 3000], [-10.seconds, -100] ]
    tm_start = Time.parse("0:00") + vj.start_time.minutes
    tm_last = report_many(vj,tm_start, pd, deltas)

    info2 = vj.figure_location(pd, tm_last, tm_last+(50.seconds), tm_start)
    # Due to round off error and different precisions we just make sure
    # that they are close enough.
    assert info2[:reported]
  end



end
