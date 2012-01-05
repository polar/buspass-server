class CreateReportedJourneyLocations < ActiveRecord::Migration
  def self.up
    create_table :reported_journey_locations do |t|
      t.references    :user
      t.references    :vehicle_journey
      t.string        :location
      t.float         :direction
      t.float         :speed
      t.datetime      :reported_time
      t.datetime      :recorded_time
      t.timestamps
    end
  end

  def self.down
    drop_table :reported_journey_locations
  end
end
