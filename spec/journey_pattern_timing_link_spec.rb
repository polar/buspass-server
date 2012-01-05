require 'spec_helper'

describe "JourneyPatternTimingLink" do
  # All JourneyPattern should be consistent.
  it "location_at should return correct distance" do
    jptl = JourneyPatternTimingLink.first
    assert_not_nil jptl, "Database not initialized. JourneyPatternTimingLink"
    assert jptl.check_consistency!, "JourneyPattern not consistent"

    info = jptl.location_info_at(0)
    assert_equal 0, info[:ti_dist], "incorrect time at zero"
    assert_equal 0, info[:distance], "incorrect distance at zero"

    # Try every 100 feet
    pd = 0
    pathd = jptl.path_distance
    while pd < pathd do
      info = jptl.location_info_at(pd)
      assert_equal pd, info[:distance], "incorrect distances"
      pd += 100
    end
    info = jptl.location_info_at(pathd)
    assert_equal pathd, info[:distance], "incorrect distances"
  end

  it "next_from should return unchanged from path_distance" do
    jptl = JourneyPatternTimingLink.first
    assert_not_nil jptl, "Database not initialized. JourneyPatternTimingLink"
    assert jptl.check_consistency!, "JourneyPattern not consistent"

    pd = jptl.path_distance
    time = 10.seconds
    info = jptl.next_from(pd, time)

    assert_equal pd, info[:distance], "incorrect distances"
    assert_equal time, info[:ti_remains], "incorrect times"
  end

  it "next_from should have consistency with its endpoints" do
    jptl = JourneyPatternTimingLink.first
    assert_not_nil jptl, "Database not initialized. JourneyPatternTimingLink"
    assert jptl.check_consistency!, "JourneyPattern not consistent"

    pathd = jptl.path_distance
    time = jptl.time.minutes

    info = jptl.next_from(0,time)

    assert_equal pathd, info[:distance], "incorrect distances"
    assert_equal 0, info[:ti_remains], "incorrect times:"

    info = jptl.next_from(pathd,time)

    assert_equal pathd, info[:distance], "incorrect distances"
    assert_equal time, info[:ti_remains], "incorrect times:"

    info = jptl.next_from(0, 0)

    assert_equal 0, info[:distance], "incorrect distances"
    assert_equal 0, info[:ti_remains], "incorrect times:"

    info = jptl.next_from(pathd, 0)

    assert_equal pathd, info[:distance], "incorrect distances"
    assert_equal 0, info[:ti_remains], "incorrect times:"
  end


  it "next_from should have consistency with location_info_at" do
    jptl = JourneyPatternTimingLink.first
    assert_not_nil jptl, "Database not initialized. JourneyPatternTimingLink"
    assert jptl.check_consistency!, "JourneyPattern not consistent"

    # Do this for the endpoints and somewhere in the middle.
    pathd = jptl.path_distance
    for pd in [0, pathd/2, pathd] do
      info = jptl.location_info_at(pd)
      assert_equal pd, info[:distance], "incorrect distances"

      time = info[:ti_dist]
      info2 = jptl.next_from(0,time)

      assert_equal 0, info2[:ti_remains], "incorrect times"
      assert_in_delta info[:distance], info2[:distance], 1.0, "incorrect distances"

      # Due to round off error and different precisions we just make sure
      # that they are close enough.
      assert (info[:coord][0] - info2[:coord][0]).abs < 1E6, "Not the same longitude"
      assert (info[:coord][1] - info2[:coord][1]).abs < 1E6, "Not the same latitude"
    end
  end

  it "get_possible should have consitency with location_info_at" do
    jptl = JourneyPatternTimingLink.first
    assert_not_nil jptl, "Database not initialized. JourneyPatternTimingLink"
    assert jptl.check_consistency!, "JourneyPattern not consistent"

    pd = jptl.path_distance/2
    info = jptl.location_info_at(pd)

    ans = jptl.get_possible(info[:coord], 60)

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

end
