class Location < ActiveRecord::Base

  serialize :coordinates

  def getLocationCoordinates(mapping)
    coordinates[mapping.name]
  end

end
