##
# Route
#  This is the route for the bus.
#
class Route < ActiveRecord::Base
  include LocationBoxing

  #
  # Route has many JourneyPatterns by way of its Services.
  # The Service will destroy the JourneyPatterns.
  #
  has_many :journey_patterns, :order => :name

  # Services are created for a particular route only
  has_many :services, :dependent => :destroy

  belongs_to :network_version

  # The Route's persistenid is its code
  validates_uniqueness_of :name
  validates_uniqueness_of :code

  # A version of a route depends on the modification of its
  # Journey Patterns. If we modifed a single journey pattern
  # we've got a new version of the route. The version is
  # the time of the newest journey pattern.
  def version
    datei = updated_at.to_i
    for jp in journey_patterns do
      datei = datei > jp.version ? datei : jp.version
    end
    return datei
  end

  # Returns the location bounding box
  def theBox
    journey_patterns.reduce(journey_patterns.first.theBox) {|v,jp| combineBoxes(v,jp.theBox)}
  end

  def locatedBy(location)
    journey_patterns.reduce(false) {|v,tl| v || tl.locatedBy(location) }
  end

  def isOnRoute(location,buffer)
    journey_patterns.reduce(false) {|v,tl| v || tl.isOnRoute(location, buffer) }
  end

  def self.find_by_location(location)
    self.all.select {|r| r.locatedBy(location)}
  end

  def self.find_or_create_by_number(route_number)
    r = self.find_or_create_by_name("Route #{route_number}")
    r.code = route_number
    r.persistentid = r.name.hash.abs
    r.save!
    return r
  end

end
