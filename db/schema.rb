# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20111227211900) do

  create_table "apis", :force => true do |t|
    t.integer  "major_version"
    t.integer  "minor_version"
    t.text     "definition"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "call_stats", :force => true do |t|
    t.integer  "user_id"
    t.float    "longitude"
    t.float    "latitude"
    t.string   "controller"
    t.string   "action"
    t.datetime "call_time"
    t.datetime "recv_time"
    t.datetime "send_time"
    t.integer  "sessionid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "delayed_jobs", :force => true do |t|
    t.integer  "priority",   :default => 0
    t.integer  "attempts",   :default => 0
    t.text     "handler"
    t.text     "last_error"
    t.datetime "run_at"
    t.datetime "locked_at"
    t.datetime "failed_at"
    t.string   "locked_by"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "directions", :force => true do |t|
    t.string   "name"
    t.string   "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "google_uri_view_paths", :force => true do |t|
    t.text     "uri"
    t.integer  "persistentid"
    t.text     "view_path_coordinates"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "journey_locations", :force => true do |t|
    t.integer  "vehicle_journey_id"
    t.integer  "service_id"
    t.integer  "route_id"
    t.datetime "reported_time"
    t.datetime "recorded_time"
    t.text     "coordinates"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.float    "direction"
    t.integer  "distance"
    t.integer  "timediff"
    t.text     "last_coordinates"
    t.datetime "last_reported_time"
    t.integer  "last_distance"
    t.float    "last_direction"
    t.integer  "last_timediff"
  end

  create_table "journey_pattern_timing_links", :force => true do |t|
    t.integer  "journey_pattern_id"
    t.integer  "position"
    t.float    "nw_lat"
    t.float    "nw_lon"
    t.float    "se_lat"
    t.float    "se_lon"
    t.string   "name"
    t.integer  "to_id"
    t.integer  "from_id"
    t.integer  "time"
    t.text     "google_uri"
    t.text     "view_path_coordinates"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "journey_patterns", :force => true do |t|
    t.string   "name"
    t.string   "description"
    t.integer  "route_id"
    t.float    "nw_lat"
    t.float    "nw_lon"
    t.float    "se_lat"
    t.float    "se_lon"
    t.integer  "service_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "locations", :force => true do |t|
    t.string   "name"
    t.string   "description", :default => ""
    t.text     "coordinates"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "mappings", :force => true do |t|
    t.string   "name"
    t.string   "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "network_versions", :force => true do |t|
    t.integer  "version"
    t.string   "name"
    t.datetime "start_date"
    t.datetime "end_date"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "reported_journey_locations", :force => true do |t|
    t.integer  "user_id"
    t.integer  "vehicle_journey_id"
    t.string   "location"
    t.float    "direction"
    t.float    "speed"
    t.datetime "reported_time"
    t.datetime "recorded_time"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "routes", :force => true do |t|
    t.string   "name"
    t.string   "code"
    t.string   "description"
    t.integer  "network_version_id"
    t.string   "display_name"
    t.integer  "persistentid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "services", :force => true do |t|
    t.string   "name"
    t.string   "persistentid"
    t.string   "description"
    t.date     "operating_period_start_date"
    t.date     "operating_period_end_date"
    t.boolean  "monday"
    t.boolean  "tuesday"
    t.boolean  "wednesday"
    t.boolean  "thursday"
    t.boolean  "friday"
    t.boolean  "saturday"
    t.boolean  "sunday"
    t.integer  "direction_id"
    t.integer  "route_id"
    t.string   "day_class"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "stop_points", :force => true do |t|
    t.integer  "code"
    t.string   "common_name"
    t.string   "street_name"
    t.string   "locality_name"
    t.string   "description"
    t.integer  "location_id"
    t.integer  "network_version_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "user_locations", :force => true do |t|
    t.integer  "user_id"
    t.datetime "reported_time"
    t.datetime "recorded_time"
    t.text     "coordinates"
    t.float    "direction"
    t.text     "last_coordinates"
    t.float    "last_direction"
    t.datetime "last_reported_time"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "user_trackings", :force => true do |t|
    t.float    "longitude"
    t.float    "latitude"
    t.datetime "login_date"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "sessionid"
  end

  create_table "users", :force => true do |t|
    t.string   "login",                     :limit => 40
    t.string   "name",                      :limit => 100, :default => ""
    t.string   "email",                     :limit => 100
    t.string   "crypted_password",          :limit => 40
    t.string   "salt",                      :limit => 40
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "remember_token",            :limit => 40
    t.datetime "remember_token_expires_at"
    t.integer  "sign_in_count",                            :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.string   "authentication_token"
    t.datetime "remember_created_at"
    t.datetime "remember_updated_at"
  end

  add_index "users", ["authentication_token"], :name => "index_users_on_authentication_token", :unique => true
  add_index "users", ["login"], :name => "index_users_on_login", :unique => true

  create_table "vehicle_journeys", :force => true do |t|
    t.string   "name"
    t.string   "description"
    t.integer  "service_id"
    t.integer  "journey_pattern_id"
    t.integer  "departure_time"
    t.string   "display_name"
    t.integer  "persistentid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
