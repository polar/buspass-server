require 'spec_helper'
require 'login_helper'

describe BusController do
  include Devise::TestHelpers

  it "report_location should record a location" do
    @user = User.new()
    @user.save!

    login_test_user

    route = Route.first
    assert_not_nil route, "No routes"

    service = Service.first :conditions => { :route_id => route }
    assert_not_nil service, "No service"

    journey = VehicleJourney.first :conditions => { :service_id => service }
    assert_not_nil journey, "No journey"

    jp = journey.journey_pattern
    info = jp.location_info_at(jp.path_distance/2)

    post :report_location, {:lon => info[:coord][0],
                            :lat => info[:coord][1],
                            :dir => info[:direction],
                            :speed => info[:speed],
                            :time => (Time.parse("0:00") + journey.start_time.minutes) + info[:ti_dist]}

    userloc = UserLocation.find_by_user_id(@user)

    assigns[:user_loc].should == userloc
  end

  it "report_location should record a location" do
    @user = User.new()
    @user.save!

    login_test_user

    route = Route.first
    assert_not_nil route, "No routes"

    service = Service.first :conditions => { :route_id => route }
    assert_not_nil service, "No service"

    journey = VehicleJourney.first :conditions => { :service_id => service }
    assert_not_nil journey, "No journey"

    jp = journey.journey_pattern
    info = jp.location_info_at(jp.path_distance/2)
    time = (Time.parse("0:00") + journey.start_time.minutes) + info[:ti_dist]
    jl = journey.create_journey_location(:service => service, :route => route)
    jl.coordinates = info[:coord]
    jl.direction = info[:direction]
    jl.distance = info[:distance] - 1000
    jl.reported_time = time - 3.minutes
    #jl.speed = info[:speed]
    jl.save!

    post :report_location, {:lon => info[:coord][0],
                            :lat => info[:coord][1],
                            :dir => info[:direction],
                            :speed => info[:speed],
                            :time => time}

    userloc = UserLocation.find_by_user_id(@user)

    assigns[:user_loc].should == userloc

    rjls = ReportedJourneyLocation.all :conditions => { :vehicle_journey_id => journey }
    assert_not_nil rjls
  end
end