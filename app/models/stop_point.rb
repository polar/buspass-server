#
# A StopPoint denotes a point on a JourneyPatternTimingLink.
#
class StopPoint < ActiveRecord::Base

  # We are currently creating one location for each StopPoint
  # We just delete when this SP is destroyed, as location has
  # nothing to do.
  belongs_to :location, :dependent => :delete

  validates_presence_of   :common_name
  validates_presence_of   :location

  def getLocationCoordinates(mapping)
    return location.getCoordinates(mapping)
  end

end
