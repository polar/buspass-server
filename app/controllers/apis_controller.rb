class ApisController < ApplicationController
  include AuthenticatedSystem

  CONTROLLER_URL = "http://adiron.kicks-ass.net:3000"
#  CONTROLLER_URL = "http://api.buspass.adiron.com:3000"
#  CONTROLLER_URL = "http://184.106.109.126:3000"

  before_filter :authorized_or_new_user, :get_api

  # This is the login.
  def get_api
    track_user
    #
    # @api = Api.find_by_major_version
    # So far, we just ignore, and give them this one.
    #
    @api = Api.new
    @api.major_version = 1
    @api.minor_version = 1

    text = "<API\n"
    text += "majorVersion= '#{@api.major_version}'\n"
    text += "minorVersion= '#{@api.minor_version}'\n"
    text += "user= '#{current_user.id}'\n"
    text += "getRouteJourneyIds = '#{CONTROLLER_URL}/pass/route_journeys.text'\n"
    text += "getRouteDefinition = '#{CONTROLLER_URL}/pass/route_journey/'\n"
    text += "getJourneyLocation = '#{CONTROLLER_URL}/pass/curloc/'\n"
    text += "/>"
    puts text
    respond_to do |format|
      format.html { redirect_to(apis_url) }
      format.xml  { render :xml => text }
    end
  end

  private

  # before_filter :authorized_or_new_user, :get_api
  def authorized_or_new_user
    if !authorized?
      logout_keeping_session!
      @current_user = User.new
      @current_user.remember_me_for(3.years)
      @current_user.save!
      send_remember_cookie!
    end
  end

  def track_user
    ut = UserTracking.new
    ut.user = @current_user
    if params[:lon] && params[:lat]
      lon = params[:lon].to_f
      lat = params[:lat].to_f
      ut.longitude = lon
      ut.latitude  = lat
    end
    ut.login_date = Time.now
    ut.save!
  end

end
