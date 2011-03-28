class JourneyLocation < ActiveRecord::Base

  # Coordinates are { :lat => float, :lon => float }
  serialize :coordinates
  serialize :last_coordinates

  belongs_to :vehicle_journey
  belongs_to :service
  belongs_to :route

  validates_presence_of :coordinates
  validates_presence_of :vehicle_journey
  validates_presence_of :service
  validates_presence_of :route

  def on_route?
    vehicle_journey.journey_pattern.isOnRoute(coordinates, 60) # 60 feet
  end

  def self.find_by_routes(routes)
    self.all :conditions => [ "route_id IN (?)", routes]
  end
end
