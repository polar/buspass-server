class JourneyLocation < ActiveRecord::Base

  # Coordinates are { :lat => float, :lon => float }
  serialize :coordinates

  belongs_to :vehicle_journey
  belongs_to :service
  belongs_to :route

  validates_presence_of :coordinates
  validates_presence_of :vehicle_journey
  validates_presence_of :service
  validates_presence_of :route

  # This method returns the time difference
  # for the coordinates on the route and if it is with in the
  # expected timing links.
  # zero means on time (more or less).
  # negative means late
  # positive means early.
  def timediff
    vehicle_journey.time_difference(coordinates,reported_time)
  end

  #
  # This method returns the direction the bus is traveling in radians.
  #
  def direction
    vehicle_journey.direction(coordinates, 60); # 60 feet
  end

  def on_route?
    vehicle_journey.journey_pattern.isOnRoute(coordinates, 60) # 60 feet
  end

  def self.find_by_routes(routes)
    self.all :conditions => [ "route_id IN (?)", routes]
  end
end
