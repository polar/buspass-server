# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ :name => 'Chicago' }, { :name => 'Copenhagen' }])
#   Major.create(:name => 'Daley', :city => cities.first)
Mapping.find_or_create_by_name("LonLat")
Direction.find_or_create_by_name("Inbound")
Direction.find_or_create_by_name("Outbound")
