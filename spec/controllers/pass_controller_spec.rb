require 'spec_helper'
require "hpricot"

describe PassController, "Controller Spec" do
  include Devise::TestHelpers

  #
  # Spec for /pass/route_journeys
  #
  it "route_journeys without any arguments should get all routes" do
    login_test_user

    routes = Route.all
    textspecs = routes.map {|r| getRouteSpecText(r)}
    expected = textspecs.join("\n")

    get :route_journeys, :format => "text"
    assigns[:routes].should == routes
    response.body.should == expected
  end

  it "route_journeys with route or routes argument should get the route" do
    login_test_user

    route = Route.first
    assert_not_nil route, "No routes"

    get :route_journeys, :format => "text", :route => route.id
    assigns[:routes].should == [route]
    response.body.should == getRouteSpecText(route)

    get :route_journeys, :format => "text", :routes => [route.id]
    assigns[:routes].should == [route]
    response.body.should == getRouteSpecText(route)
  end

  it "route_journeys with route or routes argument should get the journey and route" do
    login_test_user

    route = Route.first
    assert_not_nil route, "No routes"

    service = Service.first :conditions => { :route_id => route }
    assert_not_nil service, "No service"

    journey = VehicleJourney.first :conditions => { :service_id => service }
    assert_not_nil journey, "No journey"

    jl = journey.create_journey_location(:service => service, :route => route)
    jl.coordinates = [76.4,-43.2]
    jl.save!

    textspecs = [getJourneySpecText(journey,route)] + [getRouteSpecText(route)]
    expected = textspecs.join("\n")

    get :route_journeys, :format => "text", :route => route.id
    assigns[:routes].should == [route]
    response.body.should == expected

    get :route_journeys, :format => "text", :routes => [route.id]
    assigns[:routes].should == [route]
    response.body.should == expected
  end

  #
  # Spec for /pass/route_journey
  #   We are not going to bother with the spec for the
  #   Route or the Journey, as we would just be copying functions
  #   from the controller. We will just make sure we get the
  #   correct routes.
  #
  it "route_journey should return text version of journey" do
    login_test_user

    journey = VehicleJourney.first

    get :route_journey, { :format => :text, :type => "V", :id => journey.persistentid }

    assigns[:object].should == journey
  end

  it "route_journey should return text version of route" do
    login_test_user

    route = Route.first

    get :route_journey, { :format => :text, :type => "R", :id => route.persistentid }

    assigns[:object].should == route
  end

  it "curloc should return not in service for journey that isn't currently running" do
    login_test_user

    journey = VehicleJourney.first

    get :curloc, :format => :text, :id => journey.persistentid

    response.body.should == "#{journey.persistentid},!\n"
  end

  it "curloc should return given journey location" do
    login_test_user

    route = Route.first
    assert_not_nil route, "No routes"

    service = Service.first :conditions => { :route_id => route }
    assert_not_nil service, "No service"

    journey = VehicleJourney.first :conditions => { :service_id => service }
    assert_not_nil journey, "No journey"

    jp = journey.journey_pattern

    info = jp.location_info_at(jp.path_distance/2)

    jl = journey.create_journey_location(:service => service, :route => route)
    jl.coordinates = info[:coord]
    jl.direction = info[:direction]
    jl.distance = info[:distance]
    #jl.speed = info[:speed]
    jl.save!

    get :curloc, :format => :text, :id => journey.persistentid
    assigns[:journey_location].should == jl
  end

  private

  def mock_users(stubs={})
    @user ||= mock_model(User, stubs).as_null_object
  end

  def login_test_user
    attr = { :username => "Foobar", :email => "doineedit@foobar.com" }
    #mock up an authentication in warden as per http://www.michaelharrison.ws/weblog/?p=349
    request.env['warden'] = mock(Warden, :authenticate => mock_users(attr),
                                 :authenticate! => mock_users(attr),
                                 :authenticate? => mock_users(attr))
  end

  # Same as private functions in controller.

  def getRouteSpecText(route)
    "#{route.name.tr(",","_")},#{route.persistentid},R,#{route.version}"
  end

  def getJourneySpecText(journey, route)
    "#{journey.display_name.tr(",","_")},#{journey.persistentid},V,#{route.persistentid},#{route.version}"
  end

end