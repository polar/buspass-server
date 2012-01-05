class ReportedJourneyLocation < ActiveRecord::Base
  # user
  # vehicle_journey
  # location
  # direction
  # speed
  # reported_time
  # recorded_time
  # confirmed
  serialize :location

  attr_accessor :variance
  attr_accessor :off_schedule

  attr_accessor :location_info

  def distance
    location_info[:distance]
  end
end
