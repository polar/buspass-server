class UserLocation < ActiveRecord::Base
	serialize :coordinates
	serialize :last_coordinates
	
	belongs_to :user

	validates_presence_of :user
	validates_presence_of :coordinates
	validates_presence_of :reported_time
	validates_presence_of :recorded_time
end
