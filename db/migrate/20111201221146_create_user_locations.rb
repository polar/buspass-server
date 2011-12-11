class CreateUserLocations < ActiveRecord::Migration
  def self.up
    create_table :user_locations, :force => true do |t|
      t.integer  "user_id"
      t.datetime "reported_time"
      t.datetime "recorded_time"
      t.text     "coordinates"
      t.float    "direction"
      t.text     "last_coordinates"
      t.float    "last_direction"
      t.datetime "last_reported_time"
      t.timestamps
    end
  end

  def self.down
    drop_table :user_locations
  end
end
