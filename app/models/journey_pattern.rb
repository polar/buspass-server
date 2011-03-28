#
# A JourneyPattern is an ordered list of JourneyPatternTimingLinks between
# StopPoints. Theoretically, it should be able to have more than one Vechicle
# Journey, but that never really seems to be prudent. This may change in the
# future.
#
class JourneyPattern < ActiveRecord::Base
  include LocationBoxing

  # journey_pattern_timing_links is an ordered list
  has_many :journey_pattern_timing_links, :order => :position, :dependent => :delete_all

  belongs_to :route
  belongs_to :service

  has_one    :vehicle_journey, :dependent => :delete

  # We always calculate and save the locator box.

  # We only make the name unique so that we may update them by
  # human sight reading in a CSV file.
  validates_uniqueness_of :name

  validates_presence_of :service
  validates_presence_of :route

  after_validation :assign_lon_lat_locator_fields

  def version
    date = updated_at
    for jptl in journey_pattern_timing_links do
      date = date > jptl.updated_at ? date : jptl.updated_at
    end
    return date.to_i
  end

  # We use Google to get the path, and the end points between validate
  # links may not be exactly the same, but should be close enough.
  # Also, due to round off error in the storage of the coordinates,
  # we calculate distance to make sure the last to first coordinates
  # of the respective links are close enough to each other.
  DIST_FUDGE = 100

  def validate
    last_jptl = journey_pattern_timing_links.first
    last_to_location = last_jptl.to.location
    last_coord = last_jptl.view_path_coordinates["LonLat"].last

    for jptl in journey_pattern_timing_links.drop(1) do
      location = jptl.from.location
      if DIST_FUDGE < getGeoDistance(last_to_location.coordinates["LonLat"],location.coordinates["LonLat"])
        str = "#{last_jptl.position}.to:#{last_to_location.inspect} != #{jptl.position}.from:#{location.inspect}"
        raise "Inconsitent Locations, from '#{last_jptl.name} to '#{jptl.name}'\n#{str}"
      end
      coord = jptl.view_path_coordinates["LonLat"].first
      if DIST_FUDGE < getGeoDistance(coord,last_coord)
        path1str = "#{last_jptl.from.location.coordinates["LonLat"].inspect} - #{last_jptl.view_path_coordinates["LonLat"].inspect} - #{last_jptl.to.location.coordinates["LonLat"].inspect}"
        path2str = "#{jptl.from.location.coordinates["LonLat"].inspect} - #{jptl.view_path_coordinates["LonLat"].inspect} - #{jptl.to.location.coordinates["LonLat"].inspect}"
        raise "Inconsitent Path, from '#{last_jptl.name} to '#{jptl.name}'\n#{path1str}\n#{path2str}"
      end
      last_coord = jptl.view_path_coordinates["LonLat"].last
      last_jptl = jptl
      last_to_location = jptl.to.location
    end
    return true
  end

  def get_vehicle_journey(departure_time)
    dtimelit = departure_time.strftime("%H:%M")
    # We use the name of the Journey Pattern for the Vehicle Journey
    # Right now we have a 1-1 relationship.
    # This gets the minutes after midnight.
    # TODO: Must work on scheme for minutes before midnight, threshold?
    dtime = (Time.parse(dtimelit)-Time.parse("0:00"))/60
    self.vehicle_journey =
      VehicleJourney.find_or_initialize_by_name(
        :name => name,
        :departure_time => dtime,
        :persistentid => name.hash.abs,
        :service_id => self.service)
    return self.vehicle_journey
  end

  # Names the JPTL with an index into this JourneyPattern.
  def get_journey_pattern_timing_link(position)
    name = "#{self.name} #{position}"
    jptl = journey_pattern_timing_links.find_or_initialize_by_name(
              :name => name,
              :position => position)
    return jptl
  end

  # This function returns if the coordinate lies on the route with the buffer.
  # The buffer is in feet.
  def isOnRoute(coord, buffer)
    journey_pattern_timing_links.reduce(false) {|v,tl| v || tl.isOnRoute(coord, buffer) }
  end

  def view_path_coordinates
    if journey_pattern_timing_links.size == 0
      return { "LonLat" => [[0.0,0.0],[0.0,0.0]] }
    end
    return { "LonLat" =>
      journey_pattern_timing_links.reduce([]) {|v,tl|v + tl.view_path_coordinates["LonLat"]}
	       }
  end

  # in minutes
  def duration
    journey_pattern_timing_links.reduce(0) {|v,tl| v + tl.time}
  end

  # in feet
  def path_distance
    journey_pattern_timing_links.reduce(0) {|v,tl| v + tl.path_distance}
  end

  # T is in miliseconds from 0
  def get_jtpl_for_time(time)
    tls = journey_pattern_timing_links
    begin_time = 0.minutes
    for tl in tls do
      end_time = begin_time + tl.time.minutes
      if begin_time <= t && t <= end_time
        return tl
      end
      begin_time = end_time
    end
    raise "Time is past duration"
  end

  # T is in miliseconds from 0
  def point_on_path(t)
    tls = journey_pattern_timing_links
    begin_time = 0.minutes
    for tl in tls do
      end_time = begin_time + tl.time.minutes
      if begin_time <= t && t <= end_time
        return tl.point_on_path(t-begin_time)
      end
      begin_time = end_time
    end
    raise "Time is past duration"
  end

  # T is in miliseconds from 0
  def direction_on_path(t)
    tls = journey_pattern_timing_links
    begin_time = 0.minutes
    for tl in tls do
      end_time = begin_time + tl.time.minutes
      if begin_time <= t && t <= end_time
        return tl.direction_on_path(t-begin_time)
      end
      begin_time = end_time
    end
    raise "Time is past duration"
  end

  # T is in seconds from 0
  def distance_on_path(t)
    tls = journey_pattern_timing_links
    begin_time = 0.minutes
    distance = 0
    for tl in tls do
      end_time = begin_time + tl.time.minutes
      if begin_time <= t && t <= end_time
        return distance + tl.distance_on_path(t-begin_time)
      end
      distance += tl.path_distance
      begin_time = end_time
    end
    raise "Time is past duration"
  end

  # d is in feet, returns seconds from 0.
  def time_on_path(d)
    tls = journey_pattern_timing_links
    begin_dist = 0
    time = 0
    for tl in tls do
      end_dist = begin_dist + tl.path_distance
      if begin_dist <= d && d <= end_dist
        return time + tl.time_on_path(d-begin_dist)
      end
      time += tl.time.minutes
      begin_dist = end_dist
    end
    raise "Distance is past total distance"
  end

  def starting_direction
    journey_pattern_timing_links.first.starting_direction
  end

  def self.find_by_coord(coord)
    # TODO: Faster using a Database query.
    self.all.select {|a| a.locatedBy(coord)}
  end

  def locatedBy(coord)
    inBox(theBox, coord)
  end

  def theBox
    [ [nw_lon, nw_lat], [se_lon, se_lat]]
  end

  # Store the locator box
  def assign_lon_lat_locator_fields
      box = journey_pattern_timing_links.reduce(journey_pattern_timing_links.first.theBox) {|v,jptl| combineBoxes(v,jptl.theBox)}
      self.nw_lon= box[0][0]
      self.nw_lat= box[0][1]
      self.se_lon= box[1][0]
      self.se_lat= box[1][1]
  end

end